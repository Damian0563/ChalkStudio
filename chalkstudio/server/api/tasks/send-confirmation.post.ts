import { assertTaskRequest } from '#server/utils/tasks/tasks'
import { useMail, type ConfirmationMail } from '#server/utils/mailing/mail'

export default defineEventHandler(async (event) => {
	await assertTaskRequest(event)
	const payload: ConfirmationMail = await readBody(event)
	if (!payload?.email || !payload?.code) {
		console.error('Discarding malformed confirmation task', payload)
		return null
	}
	await useMail().sendConfirmation(payload)
	return null
})
