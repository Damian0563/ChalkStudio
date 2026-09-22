import type { UploadedImage } from '#shared/types'
import type { QuickNotice } from '~/types/general'
type ImageOptions = {
	quickNotice: Ref<QuickNotice | undefined>
	room: ComputedRef<string>
}

export const useImages = (options: ImageOptions) => {
	const { $csrfFetch } = useNuxtApp()
	const { quickNotice, room } = options

	const createImage = async (e: ClipboardEvent) => {
		const files = Array.from(e.clipboardData?.files ?? []).filter((file) => file.type.startsWith('image/'))
		if (!files.length) return
		e.preventDefault()
		const file = files[0]
		if (file) {
			const uploaded = await declareImage(file)
			if (!uploaded) return
			const image = new Image()
			image.crossOrigin = 'anonymous'
			image.src = uploaded.url
			image.onload = () => {
				console.log(uploaded.imageId, image)
			}
		}
	}


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

	}
}
