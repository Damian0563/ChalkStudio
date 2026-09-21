import { randomInt } from 'node:crypto'
import { validateEmail } from '#server/utils/mailing/validate'
import { useTasks } from '#server/utils/tasks/tasks'

const getRandomCode = (): string => Array.from({ length: 6 }, () => randomInt(10)).join('')

export default defineEventHandler(async (event) => {
	const body: { email?: string } = await readBody(event)
	const email = body?.email ?? ''
	if (!validateEmail(email)) {
		throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Please provide a valid email address.' })
	}

	const { checkUserExists, insertLoginCode } = await useDatabase()
	// Both branches answer with the same empty 204. An address that is already registered
	// simply gets no code minted for it, so the reply cannot be read as an account probe.
	if (await checkUserExists(email)) return null

	const code: string = getRandomCode()
	await insertLoginCode(email, code)
	await useTasks().enqueue('send-confirmation', { email, code })
	return null
})
