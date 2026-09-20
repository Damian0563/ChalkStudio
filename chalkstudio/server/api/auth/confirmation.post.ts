export default defineEventHandler(async (event) => {
	const body: { email: string } = await readBody(event)
	console.log(body)
	try {
		return { status: 200 }
	} catch {
		return { status: 500 }
	}
})
