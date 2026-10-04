import { randomUUID } from 'node:crypto'
import { registrationRoles, type RegistrationRole } from '#shared/types'
import { cookieBase } from '#server/utils/auth/session'
import { githubCallbackPath, githubRedirectUri, githubStateCookieName, type GithubOAuthState } from '#server/utils/auth/github'

export default defineEventHandler(async (event) => {
	const { role: requestedRole } = getQuery(event)
	const role = (requestedRole ?? 'student') as RegistrationRole
	if (!registrationRoles.includes(role)) {
		throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Please choose a valid account type.' })
	}
	const clientId = process.env.GITHUB_CLIENT_ID
	if (!clientId) {
		throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: 'GitHub sign-in is not available right now.' })
	}

	const state = randomUUID()
	setCookie(event, githubStateCookieName, JSON.stringify({ state, role } satisfies GithubOAuthState), {
		...cookieBase,
		path: githubCallbackPath,
		maxAge: 60 * 10,
	})
	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: githubRedirectUri(),
		scope: 'read:user user:email',
		state,
	})
	return { url: `https://github.com/login/oauth/authorize?${params}` }
})
