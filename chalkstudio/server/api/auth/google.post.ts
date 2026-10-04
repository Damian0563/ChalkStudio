import { OAuth2Client, type TokenPayload } from 'google-auth-library'
import { registrationRoles, type GoogleAuthPayload } from '#shared/types'
import { startSession } from '#server/utils/auth/session'

const googleFailed = () =>
	createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Google sign-in failed. Please try again.' })

export default defineEventHandler(async (event) => {
	const body: Partial<GoogleAuthPayload> = await readBody(event)
	const code = body?.code?.trim() ?? ''
	const role = body?.role ?? 'student'
	if (code === '') {
		throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Missing Google authorization code.' })
	}
	if (!registrationRoles.includes(role)) {
		throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Please choose a valid account type.' })
	}

	const clientId = useRuntimeConfig(event).public.googleSignIn.clientId
	const clientSecret = process.env.GOOGLE_AUTH_SECRET
	if (!clientId || !clientSecret) {
		throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: 'Google sign-in is not available right now.' })
	}

	const client = new OAuth2Client({ clientId, clientSecret, redirectUri: 'postmessage' })
	let profile: TokenPayload | undefined
	try {
		const { tokens } = await client.getToken(code)
		if (!tokens.id_token) throw googleFailed()
		const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: clientId })
		profile = ticket.getPayload()
	} catch (error) {
		console.error('Google code exchange failed', error instanceof Error ? error.message : error)
		throw googleFailed()
	}
	if (!profile?.email || !profile.email_verified) throw googleFailed()

	const { loginWithOAuth } = await useDatabase()
	const { isNew, ...session } = await loginWithOAuth({
		name: profile.name ?? profile.given_name ?? profile.email.split('@')[0]!,
		email: profile.email,
		role,
	})
	startSession(event, session)
	return sendRedirect(event, isNew ? '/workspace?new=true' : '/workspace')
})
