export default defineEventHandler((event) => {
	return {
		status: 'ok',
		authenticated: !!event.context.user,
	}
})
