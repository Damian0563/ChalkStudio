import type { Workspace } from '#shared/types'

export default defineEventHandler(async (event): Promise<Workspace> => {
	if (!event.context.user) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Please sign in to open your workspace.' })
	}

	return {
		boards: [],
		userIdentity: event.context.user,
		schedule: [],
		isNew: false,
	}
})
