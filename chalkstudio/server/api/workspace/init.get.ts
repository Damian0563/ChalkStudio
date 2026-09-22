import type { Workspace } from '#shared/types'

export default defineEventHandler(async (event): Promise<Workspace> => {

	return {
		boards: [],
		userIdentity: event.context.user!,
		schedule: [],
		isNew: false,
	}
})
