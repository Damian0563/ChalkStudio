import { test, expect, beforeAll, vi } from 'vitest'
import type { UserJWTId } from '#shared/types'
import { AuthService } from '../../server/utils/auth/auth'

const auth = new AuthService()
const shortDelta = 1000
const userIds: UserJWTId[] = [
	{
		userId: 'usr_student_1',
		username: 'ada',
		role: 'student',
		exp: Date.now() + AuthService.refreshDelta,
		iat: Date.now(),
	},
	{
		userId: 'usr_teacher_basic_1',
		username: 'grace',
		role: 'teacher-basic',
		exp: Date.now() + AuthService.refreshDelta,
		iat: Date.now(),
	},
	{
		userId: 'usr_teacher_pro_1',
		username: 'alan',
		role: 'teacher-pro',
		exp: Date.now() + AuthService.refreshDelta,
		iat: Date.now(),
	},
	{
		userId: 'usr_teacher_ultra_1',
		username: 'katherine',
		role: 'teacher-ultra',
		exp: Date.now() + AuthService.refreshDelta,
		iat: Date.now(),
		opts: { seats: 30 },
	},
	{
		userId: 'usr_admin_1',
		username: 'edsger',
		role: 'admin',
		exp: Date.now() + shortDelta,
		iat: Date.now(),
	},
]

beforeAll(() => {
	process.env.JWT_SECRET = 'test-secret'
})

test('jwt-headers', () => {
	for (const user of userIds) {
		const token = auth.generateJWT(user)
		expect(token).not.toBeInstanceOf(Error)
		const [header, payload, signature] = (token as string).split('.')

		// a generated token carries exactly the HS256/JWT header
		expect(JSON.parse(Buffer.from(header!, 'base64url').toString('utf-8'))).toEqual({
			alg: 'HS256',
			typ: 'JWT',
		})

		// and that header is accepted on the way back in
		expect(auth.verifyJWT(token as string)).toMatchObject({
			userId: user.userId,
			username: user.username,
			role: user.role,
		})

		// rejected headers — each is caught before the signature is ever checked,
		// so an untouched signature still yields "Invalid header"
		const invalid: unknown[] = [
			{ alg: 'RS256', typ: 'JWT' },   // wrong algorithm
			{ alg: 'none', typ: 'JWT' },    // unsigned-token attack
			{ alg: 'hs256', typ: 'JWT' },   // alg is case-sensitive
			{ alg: 'HS256', typ: 'JWS' },   // wrong type
			{ alg: 'HS256', typ: 'jwt' },   // typ is case-sensitive
			{ typ: 'JWT' },                 // missing alg
			{ alg: 'HS256' },               // missing typ
			{},                             // empty header
			[],                             // valid JSON, not a header object
		]
		for (const swapped of invalid) {
			const result = auth.verifyJWT(
				`${Buffer.from(JSON.stringify(swapped), 'utf-8').toString('base64url')}.${payload}.${signature}`
			)
			expect(result).toBeInstanceOf(Error)
			expect((result as Error).message).toBe('Invalid header')
		}

		// headers that cannot be read at all fall through to the generic catch:
		// base64url for "not-json" and for "null"
		for (const unreadable of ['bm90LWpzb24', 'bnVsbA']) {
			const result = auth.verifyJWT(`${unreadable}.${payload}.${signature}`)
			expect(result).toBeInstanceOf(Error)
			expect((result as Error).message).toBe('Error verifying JWT')
		}

		// a header segment only counts once the token has three of them
		for (const malformed of ['', header!, `${header}.`, `.${token}`, `${token}.extra`]) {
			const result = auth.verifyJWT(malformed)
			expect(result).toBeInstanceOf(Error)
			expect((result as Error).message).toBe('Malformed token')
		}
	}

	// without a secret there is nothing to verify a header against
	delete process.env.JWT_SECRET
	const result = auth.verifyJWT('a.b.c')
	expect(result).toBeInstanceOf(Error)
	expect((result as Error).message).toBe('JWT_SECRET is not set')
	process.env.JWT_SECRET = 'test-secret'
})

test('jwt-signature', () => {
	for (const [index, user] of userIds.entries()) {
		const token = auth.generateJWT(user)
		expect(token).not.toBeInstanceOf(Error)
		const [header, payload, signature] = (token as string).split('.')

		// HMAC-SHA256 digest, base64url, unpadded
		expect(signature).toMatch(/^[A-Za-z0-9_-]{43}$/)

		// the untouched token verifies
		expect(auth.verifyJWT(token as string)).toMatchObject({
			userId: user.userId,
			role: user.role,
		})

		// payload rewritten to escalate the role, original signature kept
		let result = auth.verifyJWT(
			`${header}.${Buffer.from(JSON.stringify({ ...user, role: 'admin' }), 'utf-8').toString('base64url')}.${signature}`
		)
		expect(result).toBeInstanceOf(Error)
		expect((result as Error).message).toBe('Invalid signature')

		// a signature lifted from another user's token
		const other = auth.generateJWT(userIds[(index + 1) % userIds.length]!)
		result = auth.verifyJWT(`${header}.${payload}.${(other as string).split('.')[2]}`)
		expect(result).toBeInstanceOf(Error)
		expect((result as Error).message).toBe('Invalid signature')

		// wrong-length digests are rejected before the constant-time comparison
		for (const resized of [signature!.slice(0, -1), `${signature}AA`, 'AAAA']) {
			result = auth.verifyJWT(`${header}.${payload}.${resized}`)
			expect(result).toBeInstanceOf(Error)
			expect((result as Error).message).toBe('Invalid signature')
		}

		// a well-formed token signed with a different secret
		process.env.JWT_SECRET = 'other-secret'
		const foreign = auth.generateJWT(user)
		process.env.JWT_SECRET = 'test-secret'
		result = auth.verifyJWT(foreign as string)
		expect(result).toBeInstanceOf(Error)
		expect((result as Error).message).toBe('Invalid signature')

		// an empty signature segment never reaches the comparison
		result = auth.verifyJWT(`${header}.${payload}.`)
		expect(result).toBeInstanceOf(Error)
		expect((result as Error).message).toBe('Malformed token')
	}

	// signing is impossible without a secret
	delete process.env.JWT_SECRET
	const unsigned = auth.generateJWT(userIds[0]!)
	expect(unsigned).toBeInstanceOf(Error)
	expect((unsigned as Error).message).toBe('JWT_SECRET is not set')
	process.env.JWT_SECRET = 'test-secret'
})

test('jwt-expiry', () => {
	vi.useFakeTimers()
	for (const user of userIds) {
		vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
		const issued = Date.now()
		const token = auth.generateJWT(user)
		expect(token).not.toBeInstanceOf(Error)

		// exp sits one refresh window past iat
		expect(auth.verifyJWT(token as string)).toMatchObject({
			iat: issued,
			exp: issued + AuthService.refreshDelta,
		})

		// valid right up to the expiry instant — the check is `exp < now`,
		// so the token still passes at exactly exp
		vi.setSystemTime(issued + AuthService.refreshDelta - 1)
		expect(auth.verifyJWT(token as string)).not.toBeInstanceOf(Error)
		vi.setSystemTime(issued + AuthService.refreshDelta)
		expect(auth.verifyJWT(token as string)).not.toBeInstanceOf(Error)

		// refreshing before expiry mints a token carrying the same identity
		// and a window measured from the refresh, not from the original iat
		const refreshed = auth.refreshJWT(token as string)
		expect(refreshed).not.toBeInstanceOf(Error)
		expect(auth.verifyJWT(refreshed as string)).toMatchObject({
			userId: user.userId,
			username: user.username,
			role: user.role,
			iat: Date.now(),
			exp: Date.now() + AuthService.refreshDelta,
		})

		// one millisecond later the original token is spent
		vi.setSystemTime(issued + AuthService.refreshDelta + 1)
		let result = auth.verifyJWT(token as string)
		expect(result).toBeInstanceOf(Error)
		expect((result as Error).message).toBe('Token expired')

		// and stays spent however far the clock runs on
		vi.setSystemTime(issued + AuthService.refreshDelta * 100)
		result = auth.verifyJWT(token as string)
		expect(result).toBeInstanceOf(Error)
		expect((result as Error).message).toBe('Token expired')

		// an expired token cannot be refreshed back into a valid one
		result = auth.refreshJWT(token as string)
		expect(result).toBeInstanceOf(Error)
		expect((result as Error).message).toBe('Token expired')
	}
	vi.useRealTimers()
})
