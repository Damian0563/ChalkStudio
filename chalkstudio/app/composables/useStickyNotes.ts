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

const availableWeights: { label: string; value: number }[] = [
	{ label: 'Thin', value: 300 },
	{ label: 'Light', value: 400 },
	{ label: 'Regular', value: 500 },
	{ label: 'Semi bold', value: 600 },
	{ label: 'Bold', value: 700 },
	{ label: 'Extra bold', value: 800 },
] as const



const ensureNoteFont = async (font: string, fontSize: number, fontWeight: number): Promise<void> => {
	if (typeof document === 'undefined') return Promise.resolve()
	const family = font.trim().replaceAll('"', '').split(',')[0]?.trim()
	return document.fonts.load(`${fontWeight} ${fontSize}px "${family}"`).then(() => { })
}

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
	getUser?: () => string
}

const stickyNotePosition: Ref<{ x: number; y: number } | null> = ref(null)
const pendingNote: Ref<StickyNote | null> = ref(null)
const isEditing: Ref<boolean> = ref(false)
let editingGroup: KonvaTypes.Group | null = null
const defaultNote: StickyNote = {
	text: '',
	font: '"Source Sans 3", system-ui, sans-serif',
	fontSize: 14,
	fontWeight: { label: 'Regular', value: 500 },
	textColor: '#000000',
	bgColor: '#f5f0e8',
	draggable: false,
}

export const useStickyNotes = (options?: StickyNoteOptions) => {
	const Konva = useKonva()
	const noteConfig: Ref<StickyNote> = ref(defaultNote)
	const isValid = computed(() => noteConfig.value.text.trim().length > 0)

	const submit = (): StickyNote | null => {
		noteConfig.value.text = noteConfig.value.text.trim()
		return noteConfig.value
	}

	const stepStickyNote = (
		noteState: Ref<Pick<StickyNote, 'fontSize' | 'fontWeight'>> | Pick<StickyNote, 'fontSize' | 'fontWeight'>,
		predicate: 'fontSize' | 'fontWeight',
		dir: -1 | 1,
	) => {
		if (predicate === 'fontWeight') {
			const fontWeight = isRef(noteState) ? noteState.value.fontWeight : noteState.fontWeight
			const idx = availableWeights.map((w) => w.value).indexOf(fontWeight.value)
			const next = availableWeights[Math.min(availableWeights.length - 1, Math.max(0, (idx === -1 ? 0 : idx) + dir))]
			if (next === undefined) return
			if (isRef(noteState)) noteState.value.fontWeight = next
			else noteState.fontWeight = next
		} else {
			const fontSize = isRef(noteState) ? noteState.value.fontSize : noteState.fontSize
			const idx = availableFontSizes.indexOf(fontSize)
			const next = availableFontSizes[Math.min(availableFontSizes.length - 1, Math.max(0, (idx === -1 ? 0 : idx) + dir))]
			if (next === undefined) return
			if (isRef(noteState)) noteState.value.fontSize = next
			else noteState.fontSize = next
		}
	}

	const addNote = async (note: StickyNote, owner: string, pos: { x: number; y: number }) => {
		const layer = options?.getLayer()
		const stage = options?.getStage()
		const send = options?.send
		if (!layer || !stage || !send) return
		await ensureNoteFont(note.font, note.fontSize, note.fontWeight.value)
		const textNode = new Konva.Text({
			text: note.text,
			width: NOTE_WIDTH - NOTE_PADDING * 2,
			wrap: 'word',
			fontSize: note.fontSize,
			fontFamily: note.font,
			fontStyle: String(note.fontWeight.value),
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
			draggable: note.draggable,
		})
		textNode.setAttrs({ x: NOTE_PADDING, y: NOTE_PADDING })
		const group = new Konva.Group({ id: crypto.randomUUID(), x: pos.x, y: pos.y })
		group.add(rect)
		group.add(textNode)
		attachStickyNoteHandlers(group, owner)
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

	const detachStickyNoteHandlers = (group: KonvaTypes.Group) => {
		group.off('.sticky')
	}

	const attachStickyNoteHandlers = (group: KonvaTypes.Group, owner?: string) => {
		detachStickyNoteHandlers(group)
		const send = options?.send
		const stage = options?.getStage()
		if (!send || !stage) return
		const wsThrottle = 50
		let lastWsMessage = Date.now()
		const getMover = () => options?.getUser?.() || owner || ''
		group.listening(true)
		group.name(STICKY_NOTE_NAME)
		for (const child of group.getChildren()) {
			child.listening(child.getClassName() === 'Rect')
		}
		group.on('mousedown.sticky touchstart.sticky', (e) => {
			e.cancelBubble = true
		})
		group.on('mouseenter.sticky', (_) => {
			if (noteConfig.value.draggable) stage.container().style.cursor = 'grab'
		})
		group.on('dragstart.sticky dragmove.sticky', (e) => {
			if (!noteConfig.value.draggable || Date.now() - lastWsMessage < wsThrottle) return
			stage.container().style.cursor = 'grabbing'
			lastWsMessage = Date.now()
			send(JSON.stringify({ type: 'stickyNote-move', user: getMover(), data: { id: group.id(), x: group.x(), y: group.y() } }))
			e.cancelBubble = true
		})
		group.on('dragend.sticky', (_) => {
			noteConfig.value.draggable = false
			group.draggable(false)
			stage.container().style.cursor = 'default'
			send(JSON.stringify({ type: 'stickyNote-move', user: getMover(), data: { id: group.id(), x: group.x(), y: group.y() } }))
		})
		group.on('click.sticky tap.sticky', () => {
			const textNode = group.findOne('Text') as KonvaTypes.Text | undefined
			const rect = group.findOne('Rect') as KonvaTypes.Rect | undefined
			if (!textNode) return
			editingGroup = group
			noteConfig.value.text = textNode.text()
			noteConfig.value.font = textNode.fontFamily()
			noteConfig.value.fontSize = textNode.fontSize()
			noteConfig.value.fontWeight.value = Number(textNode.fontStyle())
			noteConfig.value.textColor = (textNode.fill() as string) || '#000000'
			noteConfig.value.bgColor = (rect?.fill() as string) || STICKY_PAPERS[0]!.value
			isEditing.value = true
		})
	}

	async function applyNoteEdit(
		group: KonvaTypes.Group,
		data: StickyNote,
	): Promise<void> {
		if (!group || !data) return
		const layer = options?.getLayer()
		if (!layer) return
		const textNode = group.findOne('Text') as KonvaTypes.Text | undefined
		const rect = group.findOne('Rect') as KonvaTypes.Rect | undefined
		if (!textNode || !rect) return
		const font = typeof data.font === 'string' ? data.font : textNode.fontFamily()
		const fontSize = typeof data.fontSize === 'number' ? data.fontSize : textNode.fontSize()
		const fontWeight = data.fontWeight !== undefined ? data.fontWeight.value : Number(textNode.fontStyle())
		await ensureNoteFont(font, fontSize, fontWeight)
		if (typeof data.text === 'string') textNode.text(data.text)
		if (typeof data.font === 'string') textNode.fontFamily(data.font)
		if (data.fontWeight !== undefined) textNode.fontStyle(String(fontWeight))
		if (typeof data.fontSize === 'number') textNode.fontSize(data.fontSize)
		if (typeof data.textColor === 'string') textNode.fill(data.textColor)
		if (typeof data.bgColor === 'string') rect.fill(data.bgColor)
		if (typeof data.draggable === 'boolean') group.draggable(data.draggable)
		rect.height(Math.max(NOTE_MIN_HEIGHT, textNode.height() + NOTE_PADDING * 2))
		layer.batchDraw()
	}

	const cancelNoteEdit = () => {
		editingGroup = null
		isEditing.value = false
	}

	const updateNote = (owner?: string) => {
		const group = editingGroup
		const layer = options?.getLayer()
		const send = options?.send
		if (!group || !layer || !send) return
		const editor = options?.getUser?.() || owner || ''
		void applyNoteEdit(group, noteConfig.value).then(() => {
			send(JSON.stringify({
				type: 'stickyNote-edit',
				user: editor,
				data: { id: group.id(), note: noteConfig.value },
			}))
		})
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
		availableWeights,
		NOTE_WIDTH,
		isSetupStickyNote,
		noteConfig,
		isValid,
		stickyNotePosition,
		pendingNote,
		stepStickyNote,
		submit,
		addNote,
		positionNote,
		placeNote,
		cancelNotePlacement,
		attachStickyNoteHandlers,
		detachStickyNoteHandlers,
		applyNoteEdit,
		isEditing,
		updateNote,
		cancelNoteEdit,
		isStickyNoteTarget,
	}
}
