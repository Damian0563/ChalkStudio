import { v4 as uuid } from "uuid";
import type { BoardCreationPayload, BoardInitDetails, BoardSummary } from "#shared/types";
import { boards } from "./schema";
import { desc, sql } from "drizzle-orm";
import { getPool } from "./connection";

export const useBoardRepository = async () => {
	const pool = await getPool();

	const getRoomDetails = async (
		room: string,
	): Promise<(BoardInitDetails & { ownerId: number }) | undefined> => {
		const [board] = await pool
			.select({
				id: boards.id,
				ownerId: boards.ownerId,
				title: boards.title,
				description: boards.description,
				authorization: boards.authorization,
				allowedUsers: boards.allowedUsers,
			})
			.from(boards)
			.where(sql`${boards.id} = ${room}`);
		if (!board) return;
		return {
			ownerId: board.ownerId,
			title: board.title,
			description: board.description,
			authorization: board.authorization,
			allowedUsers: board.allowedUsers,
		};
	};

	const getUserBoardsById = async (userId: string): Promise<BoardSummary[]> => {
		const userBoards = await pool
			.select({
				id: boards.id,
				title: boards.title,
				description: boards.description,
				authorization: boards.authorization,
				allowedUsers: boards.allowedUsers,
				modifiedAt: boards.modifiedAt,
			})
			.from(boards)
			.where(sql`${boards.ownerId} = ${Number(userId)}`)
			.orderBy(desc(boards.modifiedAt));
		return userBoards.map((board: any) => ({
			id: board.id,
			title: board.title,
			description: board.description ?? "",
			authorization: board.authorization,
			allowedUsers: board.allowedUsers ?? [],
			modifiedAt: board.modifiedAt.toISOString(),
		}));
	};

	const getBoardState = async (room: string): Promise<unknown> => {
		const [board] = await pool
			.select({ data: boards.data })
			.from(boards)
			.where(sql`${boards.id} = ${room}`);
		return board?.data;
	};

	const createBoard = async (ownerId: string, board: BoardCreationPayload): Promise<string> => {
		const [created] = await pool
			.insert(boards)
			.values({
				id: uuid(),
				ownerId: Number(ownerId),
				title: board.title,
				description: board.description || null,
				authorization: board.authorization,
				allowedUsers: board.authorization === "invite" ? board.allowedUsers : [],
				modifiedAt: sql`now()`,
			})
			.returning({ id: boards.id });
		return created.id;
	};

	const updateBoard = async (
		room: string,
		board: BoardCreationPayload,
	): Promise<void | string[]> => {
		const [updated] = await pool
			.update(boards)
			.set({
				title: board.title,
				description: board.description || null,
				authorization: board.authorization,
				allowedUsers: board.authorization === "invite" ? board.allowedUsers : [],
				modifiedAt: sql`now()`,
			})
			.where(sql`${boards.id} = ${room}`)
			.returning({ allowedUsers: sql<string[] | null>`old.allowed_users` });
		return updated?.allowedUsers ?? [];
	};

	const deleteBoard = async (room: string): Promise<void> => {
		await pool.delete(boards).where(sql`${boards.id} = ${room}`);
	};

	const saveBoard = async (room: string, data: unknown): Promise<void> => {
		await pool
			.update(boards)
			.set({ data, modifiedAt: sql`now()` })
			.where(sql`${boards.id} = ${room}`);
	};

	return {
		createBoard,
		saveBoard,
		deleteBoard,
		updateBoard,
		getRoomDetails,
		getBoardState,
		getUserBoardsById,
	};
};
