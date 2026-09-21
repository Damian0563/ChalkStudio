import { startSession } from '#server/utils/auth/session'

export default defineEventHandler(async (event) => {
	const body: { email?: string, password?: string } = await readBody(event)
	const email = body?.email?.trim() ?? ''
	const password = body?.password?.trim() ?? ''
	if (email === '' || password === '') {
		throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Please fill in all fields.' })
	}

	const { login } = await useDatabase()
	const session = await login(email, password)
	if (!session) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Invalid credentials.' })
	}
	startSession(event, session)
	return null
})
