import { AuthService } from '#server/utils/auth/auth'
import { accessCookieName, cookieBase, endSession, refreshCookieName, startSession } from '#server/utils/auth/session'

const harmlessPaths = ['/api/login', '/api/logout', '/']

export default defineEventHandler(async (event) => {
	if (harmlessPaths.includes(event.path)) return
	const accessToken = getCookie(event, accessCookieName)
	if (accessToken) {
		const refreshed = authService.refreshJWT(accessToken)
		if (!(refreshed instanceof Error)) {
			setCookie(event, accessCookieName, refreshed.token, { ...cookieBase, maxAge: AuthService.refreshDelta / 1000 })
			event.context.user = refreshed.identity
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
