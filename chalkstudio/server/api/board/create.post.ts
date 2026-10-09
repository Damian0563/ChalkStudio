import type { BoardMeta } from '#shared/types'
import { useTasks } from '#server/utils/tasks/tasks'

export default defineEventHandler(async (event): Promise<Pick<BoardMeta, 'id'>> => {
	if (!event.context.user) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Please sign in to create a board.' })
	}
	const board = parseBoardPayload(await readBody(event))

	const { createBoard } = await useDatabase()
	const id = await createBoard(event.context.user.userId, board)
	const { enqueue } = useTasks()
	await Promise.all(board.allowedUsers.map((email) => enqueue('send-invites', { email, room: id })))
	return { id }
})
