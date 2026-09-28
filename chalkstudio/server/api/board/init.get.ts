import { validate as isUuid } from 'uuid'

const notFound = () =>
	createError({ statusCode: 404, statusMessage: 'Not Found', message: 'This board does not exist.' })

// event.context.user is set by the auth middleware from the access token, or from the
// refresh token once that has expired, so its absence means neither token was usable.
export default defineEventHandler(async (event): Promise<string> => {
	const { room } = getQuery(event)
	if (typeof room !== 'string' || !isUuid(room)) throw notFound()

	const { getRoomDetails, getUserEmail } = await useDatabase()
	const board = await getRoomDetails(room)
	if (!board) throw notFound()

	const user = event.context.user
	if (board.authorization !== 'public' && board.authorization !== 'link') {
		const isOwner = !!user && board.ownerId === Number(user.userId)
		const isInvited = !!user && !isOwner && board.authorization === 'invite'
			&& board.allowedUsers?.includes(await getUserEmail(user.userId) ?? '')
		if (!isOwner && !isInvited) {
			throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: "You don't have access to this board." })
		}
	}
	if (!user) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Please sign in to open this board.' })
	}
	return user.username
})
