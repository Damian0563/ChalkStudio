import type { UploadedImage } from '#shared/types'
import type { QuickNotice } from '~/types/general'
import type KonvaTypes from 'konva'
type ImageOptions = {
	quickNotice: Ref<QuickNotice | undefined>
	room: ComputedRef<string>
	getLayer: () => KonvaTypes.Layer | undefined
	getStage: () => KonvaTypes.Stage | undefined
}

export const useImages = (options: ImageOptions) => {
	const { $csrfFetch } = useNuxtApp()
	const { quickNotice, room } = options
	const Konva = useKonva()

	const addImage = async (file: File, screenPos?: { x: number; y: number }) => {
		const layer = options.getLayer()
		const stage = options.getStage()
		if (!layer || !stage) return
		const center = screenPos ?? { x: stage.width() / 2, y: stage.height() / 2 }
		const boardPos = layer.getAbsoluteTransform().copy().invert().point(center)
		const uploaded = await declareImage(file)
		if (!uploaded) return
		const image = new Image()
		image.crossOrigin = 'anonymous'
		image.onload = () => {
			const imageNode = new Konva.Image({
				id: uploaded.imageId,
				image: image,
				x: boardPos.x - image.width / 2,
				y: boardPos.y - image.height / 2,
				width: image.width,
				height: image.height,
			})
			layer.add(imageNode)
			layer.batchDraw()
		}
		image.onerror = () => {
			quickNotice.value = { message: 'Error loading image', type: 'error' }
		}
		image.src = uploaded.url
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
	}
}
