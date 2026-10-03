import pg from 'pg'
import { v4 as uuid } from 'uuid'
import { AuthTypes, Connector } from '@google-cloud/cloud-sql-connector'
import type { UserSignUpPayload, UserIdentity, BoardCreationPayload, BoardInitDetails, BoardSummary } from '#shared/types'
import { drizzle } from 'drizzle-orm/node-postgres'
import { boards, users, codes } from './schema'
import { pushSchema } from 'drizzle-kit/api-postgres'
import { desc, sql } from 'drizzle-orm'
import { authService } from '../auth/auth'
import type { Session } from '../auth/session'

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
	const { apply } = await pushSchema({ users, boards, codes }, db)
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

	const toIdentity = (row: { id: number, name: string, role: string }): UserIdentity => ({
		userId: String(row.id),
		username: row.name,
		role: row.role as UserIdentity['role'],
	})

	const createUser = async (user: Omit<UserSignUpPayload, 'code'>): Promise<Session | undefined> => {
		const { name, email, password, role } = user
		const normalizedEmail = email.trim().toLowerCase()
		const refreshToken = String(uuid())
		const [created] = await pool.insert(users).values({
			name: name.trim(),
			email: normalizedEmail,
			password: await authService.hashPassword(password),
			role,
			createdAt: sql`current_date`,
			refreshToken: refreshToken,
		}).onConflictDoNothing({ target: users.email }).returning({ id: users.id, name: users.name, role: users.role })
		if (!created) return
		return { identity: toIdentity(created), refreshToken }
	}

	const login = async (email: string, assertedPassword: string): Promise<Session | undefined> => {
		const [user] = await pool.select({ id: users.id, name: users.name, role: users.role, password: users.password, refreshToken: users.refreshToken })
			.from(users).where(sql`${users.email} = ${email.trim().toLowerCase()}`)
		if (!user) return
		if (!await authService.comparePassword(user.password, assertedPassword)) return
		const refreshToken = user.refreshToken ?? String(uuid())
		if (!user.refreshToken) {
			await pool.update(users).set({ refreshToken }).where(sql`${users.id} = ${user.id}`)
		}
		return { identity: toIdentity(user), refreshToken }
	}

	const findByRefreshToken = async (refreshToken: string): Promise<Session | undefined> => {
		const [user] = await pool.select({ id: users.id, name: users.name, role: users.role })
			.from(users).where(sql`${users.refreshToken} = ${refreshToken}`)
		if (!user) return
		return { identity: toIdentity(user), refreshToken }
	}

	const getRoomDetails = async (room: string): Promise<(BoardInitDetails & { ownerId: number }) | undefined> => {
		const [board] = await pool.select({ id: boards.id, ownerId: boards.ownerId, title: boards.title, description: boards.description, authorization: boards.authorization, allowedUsers: boards.allowedUsers })
			.from(boards).where(sql`${boards.id} = ${room}`)
		if (!board) return
		return {
			ownerId: board.ownerId,
			title: board.title,
			description: board.description,
			authorization: board.authorization,
			allowedUsers: board.allowedUsers,
		}
	}

	const getUserBoardsById = async (userId: string): Promise<BoardSummary[]> => {
		const userBoards = await pool.select({ id: boards.id, title: boards.title, description: boards.description, authorization: boards.authorization, allowedUsers: boards.allowedUsers, modifiedAt: boards.modifiedAt })
			.from(boards)
			.where(sql`${boards.ownerId} = ${Number(userId)}`)
			.orderBy(desc(boards.modifiedAt))
		return userBoards.map((board: any) => ({
			id: board.id,
			title: board.title,
			description: board.description ?? '',
			authorization: board.authorization,
			allowedUsers: board.allowedUsers ?? [],
			modifiedAt: board.modifiedAt,
		}))
	}

	const getBoardState = async (room: string): Promise<unknown> => {
		const [board] = await pool.select({ data: boards.data }).from(boards).where(sql`${boards.id} = ${room}`)
		return board?.data
	}

	const getUserEmail = async (userId: string): Promise<string | undefined> => {
		const [user] = await pool.select({ email: users.email }).from(users).where(sql`${users.id} = ${Number(userId)}`)
		return user?.email
	}

	const getUserByMail = async (mail: string): Promise<UserIdentity | undefined> => {
		const [user] = await pool.select({ id: users.id, name: users.name, role: users.role }).from(users).where(sql`${users.email} = ${mail}`)
		return user ? toIdentity(user) : undefined
	}

	const insertLoginCode = async (email: string, code: string) => {
		const mail = sql.identifier(codes.mail.name)
		const codeCol = sql.identifier(codes.code.name)
		const expiresAt = sql.identifier(codes.expiresAt.name)
		const normalized = email.trim().toLowerCase()

		await pool.execute(sql`
			with pruned as (
				delete from ${codes} where ${codes.expiresAt} < now() and ${codes.mail} <> ${normalized}
			)
			insert into ${codes} (${mail}, ${codeCol}, ${expiresAt})
			values (${normalized}, ${code}, now() + interval '15 minutes')
			on conflict (${mail}) do update
			set ${codeCol} = excluded.${codeCol}, ${expiresAt} = excluded.${expiresAt}
		`)
	}

	const consumeLoginCode = async (email: string, code: string): Promise<boolean> => {
		const consumed = await pool.delete(codes).where(
			sql`${codes.mail} = ${email.trim().toLowerCase()} and ${codes.code} = ${code.trim()} and ${codes.expiresAt} > now()`
		).returning({ mail: codes.mail })
		return consumed.length > 0
	}

	const checkUserExists = async (email: string): Promise<boolean> => {
		const [exists] = await pool.select({ id: users.id }).from(users).where(sql`${users.email} = ${email.trim().toLowerCase()}`)
		return exists !== undefined
	}

	const createBoard = async (ownerId: string, board: BoardCreationPayload): Promise<string> => {
		const [created] = await pool.insert(boards).values({
			id: uuid(),
			ownerId: Number(ownerId),
			title: board.title,
			description: board.description || null,
			authorization: board.authorization,
			allowedUsers: board.authorization === 'invite' ? board.allowedUsers : [],
			modifiedAt: sql`current_date`,
		}).returning({ id: boards.id })
		return created.id
	}

	const saveBoard = async (room: string, data: unknown): Promise<void> => {
		await pool.update(boards).set({ data, modifiedAt: sql`current_date` }).where(sql`${boards.id} = ${room}`)
	}

	return {
		initConnection,
		createUser,
		login,
		findByRefreshToken,
		checkUserExists,
		insertLoginCode,
		consumeLoginCode,
		createBoard,
		saveBoard,
		getRoomDetails,
		getUserEmail,
		getUserByMail,
		getBoardState,
		getUserBoardsById,
	}
}
