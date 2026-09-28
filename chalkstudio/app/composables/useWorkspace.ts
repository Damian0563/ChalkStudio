import type { BoardCreationPayload, BoardMeta } from '#shared/types'
import type { NuxtApp } from '#app'

type useWorkspaceOptions = {
	fetch: ReturnType<typeof useRequestFetch>
	csrfFetch: NuxtApp['$csrfFetch']
}

export function useWorkspace(options: useWorkspaceOptions) {
	const initWorkspace = async () => {
		return await options.fetch('/api/workspace/init', {
			method: 'GET',
		})
	}

	const createBoard = async (board: BoardCreationPayload): Promise<string> => {
		const { id } = await options.csrfFetch<Pick<BoardMeta, 'id'>>('/api/board/create', {
			method: 'POST',
			body: board,
		})
		return id
	}

	return {
		initWorkspace,
		createBoard,
	}

}
