import { validate as isUuid } from 'uuid'

const notFound = () =>
	createError({ statusCode: 404, statusMessage: 'Not Found', message: 'This board does not exist.' })

export default defineEventHandler(async (event): Promise<{ board: string | null }> => {
	const { room, mail } = getQuery(event)
	if (typeof room !== 'string' || !isUuid(room)) throw notFound()

	const { getRoomDetails, getBoardState } = await useDatabase()
	const [board, state] = await Promise.all([getRoomDetails(room), getBoardState(room)])
	if (!board) throw notFound()

	await resolveBoardAccess(event, board, mail)
	return { board: state == null ? null : JSON.stringify(state) }
})
