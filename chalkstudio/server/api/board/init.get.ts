import { validate as isUuid } from 'uuid'

const notFound = () =>
	createError({ statusCode: 404, statusMessage: 'Not Found', message: 'This board does not exist.' })

export default defineEventHandler(async (event): Promise<{ username: string; isOwner: boolean }> => {
	const { room, mail } = getQuery(event)
	if (typeof room !== 'string' || !isUuid(room)) throw notFound()

	const { getRoomDetails } = await useDatabase()
	const board = await getRoomDetails(room)
	if (!board) throw notFound()

	const user = await resolveBoardAccess(event, board, mail)
	if (!user) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Please sign in to open this board.' })
	}
	return {
		username: user.username,
		isOwner: !!event.context.user && board.ownerId === Number(event.context.user.userId),
	}
})
