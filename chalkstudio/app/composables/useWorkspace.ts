import type { BoardAccess, BoardCreationPayload, BoardMeta } from '#shared/types'
import type { NuxtApp } from '#app'

type useWorkspaceOptions = {
	fetch: ReturnType<typeof useRequestFetch>
	csrfFetch: NuxtApp['$csrfFetch']
}

export type AccessOption = { value: BoardAccess; label: string; hint: string; icon: string }
export type FormatModifiedAt = (modifiedAt: string, format: Intl.DateTimeFormatOptions) => string

export function useWorkspace(options: useWorkspaceOptions) {
	const accessOptions: AccessOption[] = [
		{ value: 'public', label: 'Public', hint: 'Anyone can join, even without an account.', icon: 'lucide:globe' },
		{ value: 'link', label: 'Anyone with the link', hint: 'Signed-in users who have the link.', icon: 'lucide:link' },
		{ value: 'invite', label: 'Invite only', hint: 'Only the people you add by email.', icon: 'lucide:user-plus' },
		{ value: 'private', label: 'Private', hint: 'Just you.', icon: 'lucide:lock' },
	]

	// Only the browser knows where the viewer is, so the zone is read on mount. A
	// server render would format in the server's zone and then flip on hydration.
	const localTimeZone = ref<string | null>(null)
	onMounted(() => {
		localTimeZone.value = Intl.DateTimeFormat().resolvedOptions().timeZone
	})

	const formatModifiedAt: FormatModifiedAt = (modifiedAt, format) => {
		if (!localTimeZone.value) return ''
		return new Intl.DateTimeFormat(undefined, { ...format, timeZone: localTimeZone.value }).format(new Date(modifiedAt))
	}

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
		formatModifiedAt,
		initWorkspace,
		createBoard,
	}

}
