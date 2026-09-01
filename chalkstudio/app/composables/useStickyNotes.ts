import type KonvaTypes from 'konva'
import type { StickyNote } from '~/types/board'

const STICKY_PAPERS: { name: string; value: string }[] = [
	{ name: 'Chalk white', value: '#f5f0e8' },
	{ name: 'Black paper', value: '#000000' },
	{ name: 'Yellow paper', value: '#f0d86e' },
	{ name: 'Peach paper', value: '#f0b48e' },
	{ name: 'Pink paper', value: '#eda0b4' },
	{ name: 'Mint paper', value: '#a8e0c8' },
	{ name: 'Sky paper', value: '#a4cfe8' },
	{ name: 'Lavender paper', value: '#c4b4e8' },
	{ name: 'Rose paper', value: '#d87e8e' },
	{ name: 'Sage paper', value: '#a8b88e' },
	{ name: 'Sand paper', value: '#d8c4a0' },
	{ name: 'Teal paper', value: '#6eb8b0' },
	{ name: 'Plum paper', value: '#a87ea8' },
	{ name: 'Rust paper', value: '#c07a5c' },
	{ name: 'Graphite paper', value: '#6e7580' },
	{ name: 'Slate paper', value: '#9ba8b8' },
] as const

const availableTextColors: { name: string; value: string }[] = [
	{ name: 'Ink black', value: '#000000' },
	{ name: 'Chalk white', value: '#f5f0e8' },
	{ name: 'Graphite', value: '#3d4452' },
	{ name: 'Brick red', value: '#8e3b2f' },
	{ name: 'Navy', value: '#2c3e66' },
	{ name: 'Forest', value: '#2f5d43' },
	{ name: 'Plum', value: '#5d3a66' },
	{ name: 'Rust', value: '#b05a2e' },
] as const

const availableFonts: { name: string; value: string }[] = [
	{ name: 'Sans', value: '"Source Sans 3", system-ui, sans-serif' },
	{ name: 'Serif', value: 'Fraunces, Georgia, serif' },
	{ name: 'Hand', value: 'Caveat, "Comic Sans MS", cursive' },
	{ name: 'Mono', value: '"Courier New", Courier, monospace' },
] as const

const availableFontSizes: number[] = [
	10,
	12,
	14,
	16,
	18,
	20,
	24,
	28,
	32,
	36,
	40,
	44,
	48,
	52,
	56,
	60,
	64,
] as const



const NOTE_MAX_LENGTH = 280
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
let editingGroup: KonvaTypes.Group | null = null

export const useStickyNotes = (options?: StickyNoteOptions) => {
	const Konva = useKonva()
	const noteConfig: Ref<StickyNote> = ref({
		text: '',
		font: '"Source Sans 3", system-ui, sans-serif',
		fontSize: 14,
		textColor: '#000000',
		bgColor: '#f5f0e8',
	})
	const isValid = computed(() => noteConfig.value.text.trim().length > 0)

	const submit = (): StickyNote | null => {
		const text = noteConfig.value.text.trim()
		if (!text) return null
		return noteConfig.value
	}

	const stepStickyNoteFontSize = (
		noteState: Ref<Pick<StickyNote, 'fontSize'>> | Pick<StickyNote, 'fontSize'>,
		dir: -1 | 1,
	) => {
		const fontSize = isRef(noteState) ? noteState.value.fontSize : noteState.fontSize
		const idx = availableFontSizes.indexOf(fontSize)
		const next = availableFontSizes[Math.min(availableFontSizes.length - 1, Math.max(0, (idx === -1 ? 0 : idx) + dir))]
		if (next === undefined) return
		if (isRef(noteState)) noteState.value.fontSize = next
		else noteState.fontSize = next
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
			fontSize: note.fontSize,
			fontFamily: note.font,
			fontStyle: '600',
			fill: note.textColor,
			listening: false,
		})
		const noteHeight = Math.max(NOTE_MIN_HEIGHT, textNode.height() + NOTE_PADDING * 2)
		const rect = new Konva.Rect({
			width: NOTE_WIDTH,
			height: noteHeight,
			fill: note.bgColor,
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
			noteConfig.value.text = textNode.text()
			noteConfig.value.font = textNode.fontFamily()
			noteConfig.value.fontSize = textNode.fontSize()
			noteConfig.value.textColor = (textNode.fill() as string) || '#000000'
			noteConfig.value.bgColor = (rect?.fill() as string) || STICKY_PAPERS[0]!.value
			isEditing.value = true
		})
	}

	const applyNoteEdit = (group: KonvaTypes.Group, data: Partial<StickyNote> & { color?: string }) => {
		const textNode = group.findOne('Text') as KonvaTypes.Text | undefined
		const rect = group.findOne('Rect') as KonvaTypes.Rect | undefined
		if (!textNode || !rect) return
		if (typeof data.text === 'string') textNode.text(data.text)
		if (typeof data.font === 'string') textNode.fontFamily(data.font)
		if (typeof data.fontSize === 'number') textNode.fontSize(data.fontSize)
		if (typeof data.textColor === 'string') textNode.fill(data.textColor)
		if (typeof data.color === 'string') rect.fill(data.color)
		rect.height(Math.max(NOTE_MIN_HEIGHT, textNode.height() + NOTE_PADDING * 2))
	}

	const cancelNoteEdit = () => {
		editingGroup = null
		isEditing.value = false
	}

	const updateNote = (owner: string) => {
		const group = editingGroup
		const layer = options?.getLayer()
		const send = options?.send
		if (!group || !layer || !send) return
		const { text, font, fontSize, textColor } = noteConfig.value
		applyNoteEdit(group, { text, font, fontSize, textColor })
		layer.batchDraw()
		send(JSON.stringify({
			type: 'stickyNote-edit',
			user: owner,
			data: { id: group.id(), text, font, fontSize, textColor },
		}))
	}

	const setNoteColor = (color: string, owner: string) => {
		noteConfig.value.bgColor = color
		const group = editingGroup
		const layer = options?.getLayer()
		const send = options?.send
		const rect = group?.findOne('Rect') as KonvaTypes.Rect | undefined
		if (!group || !rect || !layer || !send) return
		rect.fill(color)
		layer.batchDraw()
		send(JSON.stringify({ type: 'stickyNote-edit', user: owner, data: { id: group.id(), color } }))
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
		availableTextColors,
		availableFonts,
		availableFontSizes,
		NOTE_WIDTH,
		isSetupStickyNote,
		noteConfig,
		isValid,
		stickyNotePosition,
		pendingNote,
		stepStickyNoteFontSize,
		submit,
		addNote,
		positionNote,
		placeNote,
		cancelNotePlacement,
		attachStickyNoteHandlers,
		applyNoteEdit,
		isEditing,
		updateNote,
		setNoteColor,
		cancelNoteEdit,
		isStickyNoteTarget,
	}
}
