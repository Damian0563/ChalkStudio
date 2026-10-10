import { v4 as uuid } from "uuid";
import type { UserSignUpPayload, UserIdentity, RegistrationRole } from "#shared/types";
import { users } from "./schema";
import { sql } from "drizzle-orm";
import { authService } from "../auth/auth";
import type { Session } from "../auth/session";
import { getPool } from "./connection";

export const useUserRepository = async () => {
	const pool = await getPool();

	const toIdentity = (row: { id: number; name: string; role: string }): UserIdentity => ({
		userId: String(row.id),
		username: row.name,
		role: row.role as UserIdentity["role"],
	});

	const invalidateRefreshToken = async (userId: string | undefined) => {
		if (!userId) return;
		await pool
			.update(users)
			.set({ refreshToken: null })
			.where(sql`${users.id} = ${userId}`);
	};

	const createUser = async (
		user: Omit<UserSignUpPayload, "code">,
	): Promise<Session | undefined> => {
		const { name, email, password, role } = user;
		const normalizedEmail = email.trim().toLowerCase();
		const refreshToken = String(uuid());
		const [created] = await pool
			.insert(users)
			.values({
				name: name.trim(),
				email: normalizedEmail,
				password: await authService.hashPassword(password),
				role,
				createdAt: sql`current_date`,
				refreshToken: refreshToken,
			})
			.onConflictDoNothing({ target: users.email })
			.returning({ id: users.id, name: users.name, role: users.role });
		if (!created) return;
		return { identity: toIdentity(created), refreshToken };
	};

	const login = async (email: string, assertedPassword: string): Promise<Session | undefined> => {
		const [user] = await pool
			.select({
				id: users.id,
				name: users.name,
				role: users.role,
				password: users.password,
				refreshToken: users.refreshToken,
			})
			.from(users)
			.where(sql`${users.email} = ${email.trim().toLowerCase()}`);
		if (!user?.password) return;
		if (!(await authService.comparePassword(user.password, assertedPassword))) return;
		return sessionFor(user);
	};

	const sessionFor = async (user: {
		id: number;
		name: string;
		role: string;
		refreshToken: string | null;
	}): Promise<Session> => {
		const refreshToken = user.refreshToken ?? String(uuid());
		if (!user.refreshToken) {
			await pool
				.update(users)
				.set({ refreshToken })
				.where(sql`${users.id} = ${user.id}`);
		}
		return { identity: toIdentity(user), refreshToken };
	};

	const loginWithOAuth = async (user: {
		name: string;
		email: string;
		role: RegistrationRole;
	}): Promise<Session & { isNew: boolean }> => {
		const email = user.email.trim().toLowerCase();
		const findUser = () =>
			pool
				.select({
					id: users.id,
					name: users.name,
					role: users.role,
					refreshToken: users.refreshToken,
				})
				.from(users)
				.where(sql`${users.email} = ${email}`);
		let [existing] = await findUser();
		if (!existing) {
			const refreshToken = String(uuid());
			const [created] = await pool
				.insert(users)
				.values({
					name: user.name.trim(),
					email,
					role: user.role,
					createdAt: sql`current_date`,
					refreshToken,
				})
				.onConflictDoNothing({ target: users.email })
				.returning({ id: users.id, name: users.name, role: users.role });
			if (created) return { identity: toIdentity(created), refreshToken, isNew: true };
			existing = (await findUser())[0];
		}
		return { ...(await sessionFor(existing)), isNew: false };
	};

	const findByRefreshToken = async (refreshToken: string): Promise<Session | undefined> => {
		const [user] = await pool
			.select({ id: users.id, name: users.name, role: users.role })
			.from(users)
			.where(sql`${users.refreshToken} = ${refreshToken}`);
		if (!user) return;
		return { identity: toIdentity(user), refreshToken };
	};

	const getUserEmail = async (userId: string): Promise<string | undefined> => {
		const [user] = await pool
			.select({ email: users.email })
			.from(users)
			.where(sql`${users.id} = ${Number(userId)}`);
		return user?.email;
	};

	const getUserByMail = async (mail: string): Promise<UserIdentity | undefined> => {
		const [user] = await pool
			.select({ id: users.id, name: users.name, role: users.role })
			.from(users)
			.where(sql`${users.email} = ${mail}`);
		return user ? toIdentity(user) : undefined;
	};

	const checkUserExists = async (email: string): Promise<boolean> => {
		const [exists] = await pool
			.select({ id: users.id })
			.from(users)
			.where(sql`${users.email} = ${email.trim().toLowerCase()}`);
		return exists !== undefined;
	};

	return {
		createUser,
		login,
		loginWithOAuth,
		findByRefreshToken,
		checkUserExists,
		getUserEmail,
		getUserByMail,
		invalidateRefreshToken,
	};
};
