import { registrationRoles, type UserSignUpPayload, type UserJWTId } from '#shared/types'
import { authService } from '../../utils/auth/auth'


export default defineEventHandler(async (event) => {
	const body: UserSignUpPayload = await readBody(event)
	const { name, email, password, role, code } = body
	if (name.trim() === '' || email.trim() === '' || code.trim().length !== 6 || password.trim().length < 8) {
		return { status: 400, body: { message: 'Please fill in all fields.' } }
	}
	if (!registrationRoles.includes(role)) {
		return { status: 400, body: { message: 'Please choose a valid account type.' } }
	}
	if (code.trim() !== "111111") return { status: 403, body: { message: 'Invalid code.' } }
	const { createUser } = await useDatabase()
	let identity: Omit<UserJWTId, 'exp' | 'iat'>
	try {
		identity = await createUser({ name, email, password, role } as Omit<UserSignUpPayload, 'code'>)
		const token = authService.generateJWT(identity)
		return { status: 200, body: { token } }
	} catch (e: any) {
		if (e.message === 'Email already registered') {
			return { status: 200 }
		}
		return { status: 500, body: { message: 'An error occured while creating user. Please try again later.' } }
	}
})
