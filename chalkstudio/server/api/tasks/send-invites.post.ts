import { assertTaskRequest } from '#server/utils/tasks/tasks'
import { useMail, type InviteMail } from '#server/utils/mailing/mail'

export default defineEventHandler(async (event) => {
	await assertTaskRequest(event)
	const payload: InviteMail = await readBody(event)
	if (!payload?.email || !payload?.room) {
		console.error('Discarding malformed invite task', payload)
		return null
	}
	await useMail().sendInvite(payload)
	return null
})
