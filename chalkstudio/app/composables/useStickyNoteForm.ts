import type { StickyNote } from '~/types/board'

export const STICKY_PAPERS = [
	{ name: 'Yellow paper', value: '#f0d86e' },
	{ name: 'Peach paper', value: '#f0b48e' },
	{ name: 'Pink paper', value: '#eda0b4' },
	{ name: 'Mint paper', value: '#a8e0c8' },
	{ name: 'Sky paper', value: '#a4cfe8' },
	{ name: 'Lavender paper', value: '#c4b4e8' },
] as const

export const NOTE_MAX_LENGTH = 280

export const useStickyNoteForm = () => {
	const noteText = ref('')
	const noteColor = ref<string>(STICKY_PAPERS[0].value)

	const isValid = computed(() => noteText.value.trim().length > 0)

	const submit = (): StickyNote | null => {
		const text = noteText.value.trim()
		if (!text) return null
		noteText.value = ''
		return { text, color: noteColor.value }
	}

	return {
		papers: STICKY_PAPERS,
		maxLength: NOTE_MAX_LENGTH,
		noteText,
		noteColor,
		isValid,
		submit,
	}
}
