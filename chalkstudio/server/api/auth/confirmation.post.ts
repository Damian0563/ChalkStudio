import { randomInt } from 'node:crypto'
import { validateEmail } from '#server/utils/mailing/validate'
import { useTasks } from '#server/utils/tasks/tasks'

const getRandomCode = (): string => Array.from({ length: 6 }, () => randomInt(10)).join('')

export default defineEventHandler(async (event) => {
	const body: { email: string } = await readBody(event)
	const { email } = body
	if (!validateEmail(email)) return new Response(JSON.stringify({ status: 400 }), { status: 400 })
	const { checkUserExists, insertLoginCode } = await useDatabase()
	try {
		const exists: boolean = await checkUserExists(email)
		if (exists) return new Response(JSON.stringify({ status: 200 }), { status: 200 })
		const code: string = getRandomCode()
		await insertLoginCode(email, code)
		await useTasks().enqueue('send-confirmation', { email, code })
		return new Response(JSON.stringify({ status: 200 }), { status: 200 })
	} catch {
		return new Response(JSON.stringify({ status: 500 }), { status: 500 })
	}
})
