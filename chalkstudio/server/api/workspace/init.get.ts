import type { Workspace } from '#shared/types'

export default defineEventHandler(async (event): Promise<Workspace> => {
	if (!event.context.user) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Please sign in to open your workspace.' })
	}
	const { isnew } = getQuery(event)
	const { getUserBoardsById } = await useBoardRepository()
	const boards = await getUserBoardsById(event.context.user.userId)
	return {
		boards: boards,
		userIdentity: event.context.user,
		schedule: [],
		isNew: isnew === 'true'
	}
})
