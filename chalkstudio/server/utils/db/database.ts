import pg from 'pg'
import { AuthTypes, Connector } from '@google-cloud/cloud-sql-connector'
import type { UserSignUpPayload, UserJWTId } from '#shared/types'
import { drizzle } from 'drizzle-orm/node-postgres'
import { boards, users } from './schema'
import { pushSchema } from 'drizzle-kit/api-postgres'
import { sql } from 'drizzle-orm'
import { authService } from '../auth/auth'

const { Pool } = pg
let poolPromise: any

const getClientOpts = async () => {
	if (process.env.PG_HOST) {
		return {
			host: process.env.PG_HOST,
			port: Number(process.env.PG_PORT ?? 5432),
		}
	}
	const connector = new Connector()
	return await connector.getOptions({
		instanceConnectionName: process.env.PG_CONNECTION_NAME!,
		authType: AuthTypes.PASSWORD,
	})
}

const createPool = async () => {
	const clientOpts = await getClientOpts()

	const db = drizzle({
		client: new Pool({
			...clientOpts,
			password: process.env.PG_PASS,
			user: process.env.PG_USER,
			database: process.env.PG_NAME,
		}),
	})
	const { apply } = await pushSchema({ users, boards }, db)
	await apply()
	return db
}

const getPool = () => {
	poolPromise ??= createPool().catch((e) => {
		poolPromise = undefined
		throw e
	})
	return poolPromise
}

export const useDatabase = async () => {
	const pool = await getPool()

	const initConnection = async () => {
		await pool.execute(sql`select 1`)
	}

	const createUser = async (user: Omit<UserSignUpPayload, 'code'>): Promise<Omit<UserJWTId, "exp" | "iat">> => {
		const { name, email, password, role } = user
		const normalizedEmail = email.trim().toLowerCase()

		const [created] = await pool.insert(users).values({
			name: name.trim(),
			email: normalizedEmail,
			password: await authService.hashPassword(password),
			role,
			createdAt: sql`current_date`,
		}).onConflictDoNothing({ target: users.email }).returning({ id: users.id, name: users.name, role: users.role })
		if (!created) throw new Error('Email already registered')

		return {
			userId: String(created.id),
			username: created.name,
			role: created.role as UserJWTId['role'],
		}
	}

	return {
		initConnection,
		createUser,
	}
}
