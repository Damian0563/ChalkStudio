import type KonvaTypes from 'konva'
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

const NOTE_WIDTH = 160
const NOTE_MIN_HEIGHT = 80
const NOTE_PADDING = 12
const isSetupStickyNote: Ref<boolean> = ref(false)

type StickyNoteOptions = {
	getLayer: () => KonvaTypes.Layer | undefined
	getStage: () => KonvaTypes.Stage | undefined
	send: (message: string) => void
}

const stickyNotePosition: Ref<{ x: number; y: number } | null> = ref(null)
const pendingNote: Ref<StickyNote | null> = ref(null)

export const useStickyNotes = (options?: StickyNoteOptions) => {
	const Konva = useKonva()
	const noteText = ref('')
	const noteColor = ref<string>(STICKY_PAPERS[0].value)

	const isValid = computed(() => noteText.value.trim().length > 0)

	const submit = (): StickyNote | null => {
		const text = noteText.value.trim()
		if (!text) return null
		noteText.value = ''
		return { text, color: noteColor.value }
	}

	const addNote = (note: StickyNote, owner: string, pos: { x: number; y: number }) => {
		const layer = options?.getLayer()
		const stage = options?.getStage()
		const send = options?.send
		if (!layer || !stage || !send) return

		const textNode = new Konva.Text({
			text: note.text,
			width: NOTE_WIDTH - NOTE_PADDING * 2,
			wrap: 'word',
			fontSize: 14,
			fontFamily: '"Source Sans 3", system-ui, sans-serif',
			fontStyle: '600',
			fill: '#1a2332',
			listening: false,
		})

		const noteHeight = Math.max(NOTE_MIN_HEIGHT, textNode.height() + NOTE_PADDING * 2)

		const rect = new Konva.Rect({
			width: NOTE_WIDTH,
			height: noteHeight,
			fill: note.color,
			cornerRadius: 4,
			shadowColor: '#000',
			shadowBlur: 8,
			shadowOpacity: 0.25,
			shadowOffsetY: 2,
			listening: false,
		})

		textNode.setAttrs({ x: NOTE_PADDING, y: NOTE_PADDING })

		const group = new Konva.Group({
			x: pos.x,
			y: pos.y,
			listening: false,
		})
		group.add(rect)
		group.add(textNode)
		layer.add(group)
		layer.batchDraw()
		send(JSON.stringify({ type: 'stickyNote-new', user: owner, data: { text: note.text, color: note.color } }))
		stickyNotePosition.value = null
	}

	const positionNote = (note: StickyNote) => {
		pendingNote.value = note
		isSetupStickyNote.value = true
	}

	const cancelNotePlacement = () => {
		pendingNote.value = null
		isSetupStickyNote.value = false
	}

	const placeNote = (screenPos: { x: number; y: number }, owner: string) => {
		const layer = options?.getLayer()
		if (!layer || !pendingNote.value) return cancelNotePlacement()
		const boardPos = layer.getAbsoluteTransform().copy().invert().point(screenPos)
		stickyNotePosition.value = boardPos
		addNote(pendingNote.value, owner, boardPos)
		cancelNotePlacement()
	}

	return {
		papers: STICKY_PAPERS,
		maxLength: NOTE_MAX_LENGTH,
		NOTE_WIDTH,
		isSetupStickyNote,
		noteText,
		noteColor,
		isValid,
		stickyNotePosition,
		pendingNote,
		submit,
		addNote,
		positionNote,
		placeNote,
		cancelNotePlacement,
	}
}
