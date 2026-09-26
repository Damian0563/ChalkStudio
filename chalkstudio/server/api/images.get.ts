import type { UploadedImage } from '#shared/types'
const { signImageUrl, imageExists } = useBucket()


export default defineEventHandler(async (event): Promise<Pick<UploadedImage, 'url'> | undefined> => {
	if (!event.context.user) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Please sign in to add images.' })
	}
	const room = getQuery(event).room
	const imageId = getQuery(event).imageId
	if (typeof room !== 'string' || room.trim() === '' || typeof imageId !== 'string' || imageId.trim() === '') {
		throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Missing board or image.' })
	}
	const objectName = `boards/${room}/${imageId}`
	if (!(await imageExists(objectName))) {
		throw createError({ statusCode: 404, statusMessage: 'Not Found', message: 'Image not found.' })
	}
	return { url: await signImageUrl(objectName) }
})
