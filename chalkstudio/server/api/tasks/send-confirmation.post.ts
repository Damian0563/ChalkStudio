import { assertTaskRequest } from '#server/utils/tasks/tasks'
import { useMail, type ConfirmationMail } from '#server/utils/mailing/mail'

// Unlike the request-facing endpoints, a task handler answers with a real HTTP status:
// Cloud Tasks retries anything that is not 2xx and reads nothing else, so returning a
// body that merely says 500 while the response itself is 200 would silently drop the
// task. The inverse holds too - a payload that can never succeed is acknowledged, not
// rejected, because a retry cannot repair it and would only burn the retry budget.
export default defineEventHandler(async (event) => {
	await assertTaskRequest(event)

	const payload: ConfirmationMail = await readBody(event)
	if (!payload?.email || !payload?.code) {
		console.error('Discarding malformed confirmation task', payload)
		return { status: 200 }
	}

	await useMail().sendConfirmation(payload)
	return { status: 200 }
})
