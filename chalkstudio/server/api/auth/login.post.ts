export default defineEventHandler(async (event) => {
	const body: { email?: string, password?: string } = await readBody(event)
	const email = body?.email?.trim() ?? ''
	const password = body?.password?.trim() ?? ''
	if (email === '' || password === '') {
		throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Please fill in all fields.' })
	}

	const { login } = await useDatabase()
	const token = await login(email, password)
	// An unknown address and a wrong password are the same rejection on purpose: the
	// response must not tell the caller which half of the pair was wrong.
	if (!token) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Invalid credentials.' })
	}
	return { token }
})
