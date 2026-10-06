
export default defineEventHandler(async (event) => {
	endSession(event)
	const { invalidateRefreshToken } = await useDatabase()
	await invalidateRefreshToken(event.context.user?.userId)
	setResponseStatus(event, 204)
})
