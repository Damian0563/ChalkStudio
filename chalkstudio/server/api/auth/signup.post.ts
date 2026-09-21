import { registrationRoles, type UserSignUpPayload } from '#shared/types'
import { startSession } from '#server/utils/auth/session'

const invalidCode = () =>
	createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'Invalid code.' })

export default defineEventHandler(async (event) => {
	const body: UserSignUpPayload = await readBody(event)
	const { name, email, password, role, code } = body
	if (name.trim() === '' || email.trim() === '' || code.trim().length !== 6 || password.trim().length < 8) {
		throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Please fill in all fields.' })
	}
	if (!registrationRoles.includes(role)) {
		throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Please choose a valid account type.' })
	}

	const { createUser, consumeLoginCode } = await useDatabase()
	if (!await consumeLoginCode(email, code)) throw invalidCode()

	const session = await createUser({ name, email, password, role })
	if (!session) throw invalidCode()
	startSession(event, session)
	return null
})
