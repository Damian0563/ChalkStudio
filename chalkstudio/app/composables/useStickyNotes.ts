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
const STICKY_NOTE_NAME = 'sticky-note'
const isSetupStickyNote: Ref<boolean> = ref(false)

type StickyNoteOptions = {
	getLayer: () => KonvaTypes.Layer | undefined
	getStage: () => KonvaTypes.Stage | undefined
	send: (message: string) => void
}

const stickyNotePosition: Ref<{ x: number; y: number } | null> = ref(null)
const pendingNote: Ref<StickyNote | null> = ref(null)
const isEditing: Ref<boolean> = ref(false)
const editText: Ref<string> = ref('')
const editColor: Ref<string> = ref(STICKY_PAPERS[0].value)
let editingGroup: KonvaTypes.Group | null = null

export const useStickyNotes = (options?: StickyNoteOptions) => {
	const Konva = useKonva()
	const noteText: Ref<string> = ref('')
	const noteColor: Ref<string> = ref(STICKY_PAPERS[0].value)
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
			listening: true,
		})

		textNode.setAttrs({ x: NOTE_PADDING, y: NOTE_PADDING })
		const group = new Konva.Group({ id: crypto.randomUUID(), x: pos.x, y: pos.y })
		group.add(rect)
		group.add(textNode)
		attachStickyNoteHandlers(group)
		layer.add(group)
		layer.batchDraw()
		send(JSON.stringify({ type: 'stickyNote-new', user: owner, data: group.toObject() }))
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

	const attachStickyNoteHandlers = (group: KonvaTypes.Group) => {
		group.listening(true)
		group.name(STICKY_NOTE_NAME)
		for (const child of group.getChildren()) {
			child.listening(child.getClassName() === 'Rect')
		}
		group.on('mousedown touchstart', (e) => {
			e.cancelBubble = true
		})
		group.on('click tap', () => {
			const textNode = group.findOne('Text') as KonvaTypes.Text | undefined
			const rect = group.findOne('Rect') as KonvaTypes.Rect | undefined
			if (!textNode) return
			editingGroup = group
			editText.value = textNode.text()
			editColor.value = (rect?.fill() as string) || STICKY_PAPERS[0].value
			isEditing.value = true
		})
	}

	const applyNoteText = (group: KonvaTypes.Group, text: string) => {
		const textNode = group.findOne('Text') as KonvaTypes.Text | undefined
		const rect = group.findOne('Rect') as KonvaTypes.Rect | undefined
		if (!textNode || !rect) return
		textNode.text(text)
		rect.height(Math.max(NOTE_MIN_HEIGHT, textNode.height() + NOTE_PADDING * 2))
	}

	const cancelNoteEdit = () => {
		editingGroup = null
		editText.value = ''
		isEditing.value = false
	}

	const updateNoteText = (owner: string) => {
		const group = editingGroup
		if (!group) return
		const textNode = group.findOne('Text') as KonvaTypes.Text | undefined
		if (!textNode || textNode.text() === editText.value) return
		applyNoteText(group, editText.value)
		options?.getLayer()?.batchDraw()
		options?.send?.(JSON.stringify({ type: 'stickyNote-edit', user: owner, data: { id: group.id(), text: editText.value } }))
	}

	const setNoteColor = (color: string, owner: string) => {
		editColor.value = color
		const group = editingGroup
		const rect = group?.findOne('Rect') as KonvaTypes.Rect | undefined
		if (!group || !rect) return
		rect.fill(color)
		options?.getLayer()?.batchDraw()
		options?.send?.(JSON.stringify({ type: 'stickyNote-edit', user: owner, data: { id: group.id(), color } }))
	}

	const isStickyNoteTarget = (node: KonvaTypes.Node | null, stage: KonvaTypes.Stage | undefined): boolean => {
		while (node && node !== stage) {
			if (node.name() === STICKY_NOTE_NAME) return true
			node = node.getParent()
		}
		return false
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
		attachStickyNoteHandlers,
		applyNoteText,
		isEditing,
		editText,
		editColor,
		updateNoteText,
		setNoteColor,
		cancelNoteEdit,
		isStickyNoteTarget,
	}
}
