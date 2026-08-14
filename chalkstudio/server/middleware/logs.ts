export default defineEventHandler((event) => {
	event.path !== "/" ? console.log(`

	${event.method} ${event.path} Header: ${JSON.stringify(event.headers) === "{}" ? undefined : JSON.stringify(event.headers)} Body: ${JSON.stringify(event._requestBody)}
	`) : ''
})
