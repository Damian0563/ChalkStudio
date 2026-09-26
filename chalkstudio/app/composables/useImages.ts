import type { UploadedImage } from '#shared/types'
import type { QuickNotice } from '~/types/general'
import type { BoardEvent } from '~/types/board'
import type KonvaTypes from 'konva'
type ImageOptions = {
	quickNotice: Ref<QuickNotice | undefined>
	getUser: () => string
	room: ComputedRef<string>
	getLayer: () => KonvaTypes.Layer | undefined
	getStage: () => KonvaTypes.Stage | undefined
	fetch: ReturnType<typeof useRequestFetch>
	send: (message: string) => void
	recordEvent: (event: BoardEvent) => void
}

export const IMAGE_PLACEHOLDER_NAME = 'image-placeholder'

export const useImages = (options: ImageOptions) => {
	const { $csrfFetch } = useNuxtApp()
	const { quickNotice, room, send, getUser, recordEvent } = options
	const traces = new Map<string, () => void>()
	const Konva = useKonva()

	const readImageSize = async (file: File) => {
		try {
			const bitmap = await createImageBitmap(file)
			const size = { width: bitmap.width, height: bitmap.height }
			bitmap.close()
			return size
		} catch {
			quickNotice.value = { message: 'Error reading image', type: 'error' }
		}
	}

	const createPlaceholder = (layer: KonvaTypes.Layer, x: number, y: number, width: number, height: number) => {
		const radius = Math.min(Math.max(Math.min(width, height) * 0.1, 12), 48)
		const group = new Konva.Group({ name: IMAGE_PLACEHOLDER_NAME, x, y, listening: false })
		group.add(
			new Konva.Rect({
				width,
				height,
				fill: '#f5f0e8',
				stroke: '#c4bfb4',
				strokeWidth: 1,
				dash: [6, 4],
				cornerRadius: 4,
			}),
		)
		const spinner = new Konva.Arc({
			x: width / 2,
			y: height / 2,
			innerRadius: radius * 0.75,
			outerRadius: radius,
			angle: 270,
			fill: '#e85d4c',
		})
		group.add(spinner)
		layer.add(group)
		const animation = new Konva.Animation((frame) => {
			spinner.rotate((frame?.timeDiff ?? 0) * 0.36)
		}, layer)
		animation.start()
		return () => {
			animation.stop()
			group.destroy()
			layer.batchDraw()
		}
	}

	const addImage = async (file: File, screenPos?: { x: number; y: number }) => {
		const layer = options.getLayer()
		const stage = options.getStage()
		if (!layer || !stage) return
		const center = screenPos ?? { x: stage.width() / 2, y: stage.height() / 2 }
		const boardPos = layer.getAbsoluteTransform().copy().invert().point(center)
		const size = await readImageSize(file)
		if (!size) return
		const x = boardPos.x - size.width / 2
		const y = boardPos.y - size.height / 2
		const destroyPlaceholder = createPlaceholder(layer, x, y, size.width, size.height)
		const traceId = crypto.randomUUID()
		send(JSON.stringify({ type: 'image-placeholder', user: getUser(), data: { x, y, width: size.width, height: size.height, traceId } }))
		const cancel = () => {
			destroyPlaceholder()
			send(JSON.stringify({ type: 'image-cancel', user: getUser(), data: { traceId } }))
		}
		const uploaded = await declareImage(file)
		if (!uploaded) return cancel()
		const image = new Image()
		image.crossOrigin = 'anonymous'
		image.onload = () => {
			destroyPlaceholder()
			const imageNode = new Konva.Image({
				id: uploaded.imageId,
				image: image,
				x,
				y,
				width: image.width,
				height: image.height,
			})
			layer.add(imageNode)
			layer.batchDraw()
			const data = { ...imageNode.toObject(), traceId }
			send(JSON.stringify({ type: 'image-new', user: getUser(), data }))
			recordEvent({ type: 'image-new', user: getUser(), data })
		}
		image.onerror = () => {
			cancel()
			quickNotice.value = { message: 'Error loading image', type: 'error' }
		}
		image.src = uploaded.url
	}

	const receiveRemoteImage = (event: BoardEvent) => {
		const layer = options.getLayer()
		if (!layer) return
		const traceId = event.data?.traceId as string | undefined
		if (event.type === 'image-placeholder' && traceId) {
			const { x, y, width, height } = event.data
			traces.set(traceId, createPlaceholder(layer, x, y, width, height))
			return
		}
		if (traceId) {
			traces.get(traceId)?.()
			traces.delete(traceId)
		}
		if (event.type === 'image-new' && event.data?.attrs) {
			const imageNode = Konva.Node.create(event.data) as KonvaTypes.Image
			layer.add(imageNode)
			void restoreImage(imageNode)
		}
	}

	const restoreImage = async (imageNode: KonvaTypes.Image) => {
		const layer = imageNode.getLayer()
		if (!layer) return
		const destroyPlaceholder = createPlaceholder(layer, imageNode.x(), imageNode.y(), imageNode.width(), imageNode.height())
		const url = await getImageUrl(imageNode.id())
		if (!url) return destroyPlaceholder()
		const image = new Image()
		image.crossOrigin = 'anonymous'
		image.onload = () => {
			destroyPlaceholder()
			imageNode.image(image)
			layer.batchDraw()
		}
		image.onerror = () => {
			destroyPlaceholder()
			quickNotice.value = { message: 'Error loading image', type: 'error' }
		}
		image.src = url
	}


	const getImageUrl = async (imageId: string): Promise<string | undefined> => {
		try {
			const response = await options.fetch<Pick<UploadedImage, 'url'>>(`/api/images?imageId=${imageId}&room=${room.value}`, {
				method: 'GET',
			})
			return response?.url
		} catch {
			quickNotice.value = { message: 'Error loading image', type: 'error' }
			return undefined
		}
	}

	const createImage = async (e: ClipboardEvent) => {
		const file = Array.from(e.clipboardData?.files ?? []).find((file) => isSupportedImageType(file.type))
		if (!file) return
		e.preventDefault()
		await addImage(file, options.getStage()?.getPointerPosition() ?? undefined)
	}

	const { open: openImagePicker, onChange: onImagePicked } = useFileDialog({
		accept: SUPPORTED_IMAGE_TYPES.join(','),
		multiple: false,
		reset: true,
	})

	onImagePicked((files) => {
		const file = files?.[0]
		if (file) void addImage(file)
	})

	const declareImage = async (file: File): Promise<UploadedImage | void> => {
		try {
			return await $csrfFetch(`/api/images?room=${room.value}`, {
				method: 'POST',
				body: file,
			})
		} catch {
			quickNotice.value = { message: 'Error uploading image', type: 'error' }
		}
	}

	onMounted(() => {
		window.addEventListener('paste', createImage)
	})

	onUnmounted(() => {
		window.removeEventListener('paste', createImage)
	})

	return {
		openImagePicker: () => openImagePicker(),
		restoreImage,
		receiveRemoteImage,
	}
}
