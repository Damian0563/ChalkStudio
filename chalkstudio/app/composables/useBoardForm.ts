import type { FetchError } from 'ofetch'
import { boardDescriptionMax, boardTitleMax, emailPattern, type BoardCreationPayload } from '#shared/types'
import type { QuickNotice } from '@/types/general'

type BoardFormOptions = {
	baseline?: () => BoardCreationPayload | null | undefined
	onLoad: () => void
	onMessage: (notice: QuickNotice) => void
}

const TITLE_MAX = boardTitleMax
const DESCRIPTION_MAX = boardDescriptionMax
const inputClass = 'w-full rounded-lg border border-chalk/10 bg-board/60 py-2.5 font-sans text-sm text-chalk placeholder:text-chalk-faint/50 transition-[border-color,box-shadow] focus:border-coral-soft/60 focus:outline-none focus:ring-2 focus:ring-coral/20 focus-visible:outline-none'

const toBoardForm = (source?: BoardCreationPayload | null): BoardCreationPayload => ({
	title: source?.title ?? '',
	description: source?.description ?? '',
	authorization: source?.authorization ?? 'public',
	allowedUsers: [...(source?.allowedUsers ?? [])],
})

export function useBoardForm(options: BoardFormOptions) {
	const form = reactive<BoardCreationPayload>(toBoardForm(options.baseline?.()))
	const inviteDraft = ref('')
	const inviteError = ref('')

	const isReady = computed(() =>
		!!form.title.trim() && (form.authorization !== 'invite' || form.allowedUsers.length > 0 || !!inviteDraft.value.trim())
	)

	const hasChanges = computed(() => {
		const saved = toBoardForm(options.baseline?.())
		return form.title !== saved.title
			|| form.description !== saved.description
			|| form.authorization !== saved.authorization
			|| form.allowedUsers.length !== saved.allowedUsers.length
			|| form.allowedUsers.some((email, index) => email !== saved.allowedUsers[index])
			|| (form.authorization === 'invite' && !!inviteDraft.value.trim())
	})

	const resetForm = () => {
		Object.assign(form, toBoardForm(options.baseline?.()))
		inviteDraft.value = ''
		inviteError.value = ''
	}

	const addInvites = () => {
		const entries = inviteDraft.value.split(/[\s,;]+/).map((entry) => entry.toLowerCase()).filter(Boolean)
		const invalid = entries.filter((entry) => !emailPattern.test(entry))
		for (const email of entries) {
			if (emailPattern.test(email) && !form.allowedUsers.includes(email)) form.allowedUsers.push(email)
		}
		inviteDraft.value = invalid.join(', ')
		inviteError.value = invalid.length ? `${invalid.join(', ')} ${invalid.length > 1 ? "aren't valid emails" : "isn't a valid email"}.` : ''
	}

	const removeInvite = (email: string) => {
		form.allowedUsers = form.allowedUsers.filter((entry) => entry !== email)
	}

	const onInviteKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter' || event.key === ',') {
			event.preventDefault()
			addInvites()
		} else if (event.key === 'Backspace' && !inviteDraft.value) {
			form.allowedUsers.pop()
		}
	}

	watch(inviteDraft, (draft) => {
		if (!draft) inviteError.value = ''
	})

	const runRequest = async (action: () => Promise<void>, errorMessage: string) => {
		options.onLoad()
		try {
			await action()
		} catch (error) {
			options.onMessage({ message: (error as FetchError).data?.message ?? errorMessage, type: 'error' })
		} finally {
			options.onLoad()
		}
	}

	const submitForm = async (action: (board: BoardCreationPayload) => Promise<void>, errorMessage: string) => {
		if (form.authorization === 'invite') addInvites()
		if (!isReady.value || inviteError.value) return
		await runRequest(() => action(toBoardForm(form)), errorMessage)
	}

	return {
		TITLE_MAX,
		DESCRIPTION_MAX,
		inputClass,
		form,
		inviteDraft,
		inviteError,
		isReady,
		hasChanges,
		resetForm,
		addInvites,
		removeInvite,
		onInviteKeydown,
		runRequest,
		submitForm,
	}
}
