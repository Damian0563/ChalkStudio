import type { UploadedImage } from '#shared/types'

const { uploadImage, signImageUrl } = useBucket()
const maxBytes = 10 * 1024 * 1024

export default defineEventHandler(async (event): Promise<UploadedImage> => {
	if (!event.context.user) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Please sign in to add images.' })
	}
	const room = getQuery(event).room
	if (typeof room !== 'string' || room.trim() === '') {
		throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Missing board.' })
	}
	const contentType = getHeader(event, 'content-type') ?? ''
	if (!isSupportedImageType(contentType)) {
		throw createError({ statusCode: 415, statusMessage: 'Unsupported Media Type', message: 'Only PNG, JPEG, GIF and WebP images can be added to a board.' })
	}
	const body = await readRawBody(event, false)
	if (!body?.length) {
		throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Empty image.' })
	}
	if (body.length > maxBytes) {
		throw createError({ statusCode: 413, statusMessage: 'Payload Too Large', message: 'This image is too large.' })
	}

	const { imageId, objectName } = await uploadImage(room, body, contentType)
	return { imageId, url: await signImageUrl(objectName) }
})
