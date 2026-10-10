import { validate as isUuid } from 'uuid'

const badRequest = (message: string) =>
	createError({ statusCode: 400, statusMessage: 'Bad Request', message })

const notFound = () =>
	createError({ statusCode: 404, statusMessage: 'Not Found', message: 'This board does not exist.' })

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
	if (!event.context.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'You must be logged in to save a board.' })
	const { room } = getQuery(event)
	if (typeof room !== 'string' || !isUuid(room)) throw notFound()

	const body = await readBody(event) ?? {}
	if (typeof body.board !== 'string') throw badRequest('Missing board.')
	if (!Array.isArray(body.imageIds) || body.imageIds.some((id: unknown) => typeof id !== 'string')) {
		throw badRequest('Invalid image list.')
	}
	let data: unknown
	try {
		data = JSON.parse(body.board)
	} catch {
		throw badRequest('The board is not valid.')
	}

	const { getRoomDetails, saveBoard } = await useBoardRepository()
	const board = await getRoomDetails(room)
	if (!board) throw notFound()

	await saveBoard(room, data)
	await useBucket().pruneImages(room, body.imageIds)
	return { ok: true }
})
