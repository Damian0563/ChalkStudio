import { validate as isUuid } from 'uuid'

const notFound = () =>
	createError({ statusCode: 404, statusMessage: 'Not Found', message: 'This board does not exist.' })

export default defineEventHandler(async (event): Promise<string> => {
	const { room, mail } = getQuery(event)
	if (typeof room !== 'string' || !isUuid(room)) throw notFound()

	const { getRoomDetails } = await useDatabase()
	const board = await getRoomDetails(room)
	if (!board) throw notFound()

	const user = await resolveBoardAccess(event, board, mail)
	if (!user) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Please sign in to open this board.' })
	}
	return user.username
})
