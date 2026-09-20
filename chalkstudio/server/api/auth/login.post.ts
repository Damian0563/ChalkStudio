
defineEventHandler(async (event) => {
	const body: { email: string, password: string } = await readBody(event)
	const { email, password } = body
	if (email.trim() === '' || password.trim() === '') {
		return { status: 400, body: { message: 'Please fill in all fields.' } }
	}
	const { login } = await useDatabase()
	const token = await login(email, password)
	if (!token) return { status: 403, body: { message: 'Invalid credentials' } }
	return { status: 200, body: { token } }
})
