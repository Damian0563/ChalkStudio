import type { BoardAccess, BoardCreationPayload, BoardMeta } from '#shared/types'
import type { NuxtApp } from '#app'

type useWorkspaceOptions = {
	fetch: ReturnType<typeof useRequestFetch>
	csrfFetch: NuxtApp['$csrfFetch']
}

export type AccessOption = { value: BoardAccess; label: string; hint: string; icon: string }

export function useWorkspace(options: useWorkspaceOptions) {
	const accessOptions: AccessOption[] = [
		{ value: 'public', label: 'Public', hint: 'Anyone can join, even without an account.', icon: 'lucide:globe' },
		{ value: 'link', label: 'Anyone with the link', hint: 'Signed-in users who have the link.', icon: 'lucide:link' },
		{ value: 'invite', label: 'Invite only', hint: 'Only the people you add by email.', icon: 'lucide:user-plus' },
		{ value: 'private', label: 'Private', hint: 'Just you.', icon: 'lucide:lock' },
	]

	const initWorkspace = async (isNew: boolean) => {
		return await options.fetch('/api/workspace/init', {
			method: 'GET',
			query: { isnew: String(isNew) },
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
		accessOptions,
		initWorkspace,
		createBoard,
	}

}
