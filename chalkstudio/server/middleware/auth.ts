import { accessCookieName, endSession, refreshCookieName, startSession } from '#server/utils/auth/session'

const harmlessPaths = ['/api/health', '/api/login', '/api/logout', '/']

export default defineEventHandler(async (event) => {
	if (harmlessPaths.includes(event.path)) return
	const accessToken = getCookie(event, accessCookieName)
	if (accessToken) {
		const payload = authService.verifyJWT(accessToken)
		if (!(payload instanceof Error)) {
			const { exp, iat, ...identity } = payload
			event.context.user = identity
			return
		}
	}

	const refreshToken = getCookie(event, refreshCookieName)
	if (!refreshToken) return

	const session = await (await useDatabase()).findByRefreshToken(refreshToken)
	if (!session) return endSession(event)

	startSession(event, session)
	event.context.user = session.identity
})
