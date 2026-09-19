export default defineEventHandler(() => {
	throw createError({ statusCode: 404, statusMessage: 'API route not found' })
})
