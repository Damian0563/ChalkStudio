import type KonvaTypes from 'konva'
import type { BoardEvent, StickyNote } from '~/types/board'

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
	{ name: 'Teal paper', value: '#6eb8b0' },
	{ name: 'Plum paper', value: '#a87ea8' },
	{ name: 'Rust paper', value: '#c07a5c' },
	{ name: 'Graphite paper', value: '#6e7580' },
	{ name: 'Slate paper', value: '#9ba8b8' },
	{ name: 'Transparent', value: '#00000000' },
] as const

const isTransparentPaper = (value: string): boolean => /^#[0-9a-f]{6}00$/i.test(value)

const TRANSPARENT_PAPER_STRIPES = 'repeating-linear-gradient(45deg, rgba(245, 240, 232, 0.85) 0 1px, rgba(245, 240, 232, 0) 1px 5px)'

const paperBackgroundStyle = (value: string): { backgroundColor: string; backgroundImage?: string } =>
	isTransparentPaper(value)
		? { backgroundColor: 'transparent', backgroundImage: TRANSPARENT_PAPER_STRIPES }
		: { backgroundColor: value }


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

const availableTextAlignments: { name: string; value: StickyNote['align']; icon: string }[] = [
	{ name: 'Align left', value: 'left', icon: 'lucide:text-align-start' },
	{ name: 'Align center', value: 'center', icon: 'lucide:text-align-center' },
	{ name: 'Align right', value: 'right', icon: 'lucide:text-align-end' },
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

const serializeNote = (group: KonvaTypes.Group): Record<string, any> => {
	const data = group.toObject() as { attrs?: Record<string, any>; children?: { attrs?: Record<string, any> }[] }
	if (data.attrs) data.attrs.draggable = false
	if (Array.isArray(data.children)) data.children = data.children.filter((child) => child.attrs?.name !== DISCARD_BUTTON_NAME)
	return data
}

const NOTE_MAX_LENGTH = 500
const NOTE_WIDTH = 160
const NOTE_MIN_WIDTH = 120
const NOTE_MAX_WIDTH = 480
const NOTE_MIN_HEIGHT = 80
const NOTE_PADDING = 12
const STICKY_NOTE_NAME = 'sticky-note'
const STICKY_TRANSFORMER_NAME = 'sticky-transformer'
const NOTE_TEXTAREA_EVENT = 'draw.noteTextarea'
const isSetupStickyNote: Ref<boolean> = ref(false)
type NoteNodes = { rect: KonvaTypes.Rect; text: KonvaTypes.Text }
const noteNodes = (group: KonvaTypes.Group): NoteNodes | null => {
	const rect = group.findOne('Rect') as KonvaTypes.Rect | undefined
	const text = group.findOne('Text') as KonvaTypes.Text | undefined
	return rect && text ? { rect, text } : null
}

const minNoteHeight = (text: KonvaTypes.Text, width: number): number => {
	const previous = text.width()
	text.width(width - NOTE_PADDING * 2)
	const height = text.height()
	text.width(previous)
	return Math.max(NOTE_MIN_HEIGHT, Math.ceil(height) + NOTE_PADDING * 2)
}

const layoutNote = (
	group: KonvaTypes.Group,
	size?: { width: number; height: number },
): { width: number; height: number } | null => {
	const nodes = noteNodes(group)
	if (!nodes) return null
	const { rect, text } = nodes
	const width = Math.min(NOTE_MAX_WIDTH, Math.max(NOTE_MIN_WIDTH, size?.width || group.width() || NOTE_WIDTH))
	const height = Math.max(minNoteHeight(text, width), size?.height || group.height() || 0)
	group.scale({ x: 1, y: 1 })
	if (size) group.size({ width, height })
	rect.size({ width, height })
	text.width(width - NOTE_PADDING * 2)
	return { width, height }
}

type StickyNoteOptions = {
	getLayer: () => KonvaTypes.Layer | undefined
	getStage: () => KonvaTypes.Stage | undefined
	send: (message: string) => void
	getUser?: () => string
	recordEvent?: (event: BoardEvent, before?: object | null) => void
	getNoteTextarea?: () => HTMLTextAreaElement | undefined
}

const stickyNotePosition: Ref<{ x: number; y: number } | null> = ref(null)
const pendingNote: Ref<StickyNote | null> = ref(null)
const isEditing: Ref<boolean> = ref(false)
let editingGroup: KonvaTypes.Group | null = null
let noteTransformer: KonvaTypes.Transformer | null = null
const createDefaultNote = (): StickyNote => ({
	text: '',
	font: '"Source Sans 3", system-ui, sans-serif',
	fontSize: 14,
	fontWeight: { label: 'Regular', value: 500 },
	textColor: '#000000',
	bgColor: '#f5f0e8',
	draggable: false,
	resizeable: false,
	align: 'left',
})

export const useStickyNotes = (options?: StickyNoteOptions) => {
	const Konva = useKonva()
	const { showDiscardButton: showGroupDiscardButton, hideDiscardButton } = useDiscardButton({
		getLayer: () => options?.getLayer(),
	})
	const noteConfig: Ref<StickyNote> = ref(createDefaultNote())
	const isValid = computed(() => noteConfig.value.text.trim().length > 0)
	const submit = (): StickyNote | null => {
		noteConfig.value.text = noteConfig.value.text.trim()
		return { ...noteConfig.value, fontWeight: { ...noteConfig.value.fontWeight } }
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
			align: note.align,
			listening: false,
		})
		const rect = new Konva.Rect({
			width: NOTE_WIDTH,
			height: NOTE_MIN_HEIGHT,
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
		layoutNote(group)
		attachStickyNoteHandlers(group, owner)
		layer.add(group)
		layer.batchDraw()
		send(JSON.stringify({ type: 'stickyNote-new', user: owner, data: group.toObject() }))
		options?.recordEvent?.({ type: 'stickyNote-new', user: owner, data: group.toObject() })
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

	const showDiscardButton = (group: KonvaTypes.Group) => {
		showGroupDiscardButton(group, {
			onDiscard: (note) => {
				const data = serializeNote(note)
				options?.recordEvent?.({ type: 'stickyNote-delete', user: options?.getUser?.() || "", data })
				options?.send?.(JSON.stringify({ type: 'stickyNote-delete', user: options?.getUser?.() || "", data }))
				if (editingGroup === note) cancelNoteEdit()
			},
		})
	}

	const detachNoteTransformer = (): void => {
		if (!noteTransformer) return
		noteTransformer.destroy()
		noteTransformer = null
		options?.getLayer()?.batchDraw()
	}

	const attachNoteTransformer = (group: KonvaTypes.Group): void => {
		const layer = options?.getLayer()
		const nodes = noteNodes(group)
		if (!layer || !nodes) return
		if (noteTransformer?.nodes()[0] === group) return
		detachNoteTransformer()
		hideDiscardButton(group)
		noteTransformer = new Konva.Transformer({
			name: STICKY_TRANSFORMER_NAME,
			nodes: [group],
			rotateEnabled: false,
			flipEnabled: false,
			keepRatio: false,
			enabledAnchors: [
				'top-left', 'top-center', 'top-right', 'middle-left', 'middle-right',
				'bottom-left', 'bottom-center', 'bottom-right',
			],
			padding: 2,
			anchorSize: 8,
			anchorCornerRadius: 2,
			anchorFill: '#1a2332',
			anchorStroke: '#f5f0e8',
			borderStroke: '#f5f0e8',
			borderDash: [4, 4],
			boundBoxFunc: (_, newBox) => {
				const scale = group.getAbsoluteScale()
				const sx = scale.x || 1
				const sy = scale.y || 1
				const width = Math.min(NOTE_MAX_WIDTH, Math.max(NOTE_MIN_WIDTH, newBox.width / sx))
				const height = Math.max(minNoteHeight(nodes.text, width), newBox.height / sy)
				const box = { ...newBox, width: width * sx, height: height * sy }
				const anchor = noteTransformer?.getActiveAnchor() || ''
				if (anchor.includes('left')) box.x = newBox.x + (newBox.width - box.width)
				if (anchor.includes('top')) box.y = newBox.y + (newBox.height - box.height)
				return box
			},
		})
		layer.add(noteTransformer)
		layer.batchDraw()
	}

	const syncNoteTransformer = (group: KonvaTypes.Group): void => {
		if (noteConfig.value.resizeable) attachNoteTransformer(group)
		else if (noteTransformer) {
			detachNoteTransformer()
		}
	}

	const describeNote = (group: KonvaTypes.Group): StickyNote | null => {
		const nodes = noteNodes(group)
		if (!nodes) return null
		const { rect, text } = nodes
		const weight = Number(text.fontStyle()) || 500
		return {
			groupId: group.id(),
			text: text.text(),
			font: text.fontFamily(),
			fontSize: text.fontSize(),
			fontWeight: availableWeights.find((w) => w.value === weight) ?? { label: 'Regular', value: weight },
			textColor: (text.fill() as string) || '#000000',
			bgColor: (rect.fill() as string) || STICKY_PAPERS[0]!.value,
			draggable: group.draggable(),
			resizeable: false,
			width: group.width(),
			height: group.height(),
			align: text.align() as 'left' | 'center' | 'right',
		}
	}

	const syncNoteTextarea = (): void => {
		const textarea = options?.getNoteTextarea?.()
		const nodes = editingGroup && noteNodes(editingGroup)
		const container = options?.getStage()?.container()
		if (!textarea || !nodes || !container) return
		const { rect, text } = nodes
		const [a, b, c, d, e, f] = text.getAbsoluteTransform().getMatrix()
		const box = container.getBoundingClientRect()
		Object.assign(textarea.style, {
			width: `${text.width()}px`,
			height: `${Math.max(0, rect.height() - text.y() - NOTE_PADDING)}px`,
			transform: `translate(${box.left}px, ${box.top}px) matrix(${a}, ${b}, ${c}, ${d}, ${e}, ${f})`,
			fontFamily: text.fontFamily(),
			fontSize: `${text.fontSize()}px`,
			fontWeight: text.fontStyle(),
			lineHeight: String(text.lineHeight()),
			letterSpacing: `${text.letterSpacing()}px`,
			textAlign: text.align(),
			caretColor: String(text.fill()),
		})
		textarea.scrollTop = 0
	}

	const openNoteTextarea = (text: string): void => {
		const textarea = options?.getNoteTextarea?.()
		const layer = options?.getLayer()
		if (!textarea || !layer) return
		textarea.value = text
		syncNoteTextarea()
		textarea.focus({ preventScroll: true })
		textarea.setSelectionRange(text.length, text.length)
		layer.off(NOTE_TEXTAREA_EVENT)
		layer.on(NOTE_TEXTAREA_EVENT, syncNoteTextarea)
	}

	const closeNoteTextarea = (): void => {
		options?.getLayer()?.off(NOTE_TEXTAREA_EVENT)
		options?.getNoteTextarea?.()?.blur()
	}

	const attachStickyNoteHandlers = (group: KonvaTypes.Group, owner?: string) => {
		detachStickyNoteHandlers(group)
		hideDiscardButton(group)
		const send = options?.send
		const stage = options?.getStage()
		if (!send || !stage) return
		const wsThrottle = 50
		let lastWsMessage = Date.now()
		let resizeOrigin: object | null = null
		const editor = options?.getUser?.() || owner || ''
		group.listening(true)
		group.name(STICKY_NOTE_NAME)
		for (const child of group.getChildren()) {
			child.listening(child.getClassName() === 'Rect' || child.name() === DISCARD_BUTTON_NAME)
		}
		group.on('mousedown.sticky touchstart.sticky', (e) => {
			e.cancelBubble = true
		})
		group.on('mouseenter.sticky', (_) => {
			if (noteConfig.value.draggable) stage.container().style.cursor = 'grab'
		})
		group.on('dragstart.sticky', (e) => {
			e.cancelBubble = true
			stage.container().style.cursor = 'grabbing'
			const data = serializeNote(group)
			options?.recordEvent?.({ type: 'stickyNote-dragStart', user: editor, data })
			send(JSON.stringify({ type: 'stickyNote-dragStart', user: editor, data }))
		})
		group.on('transformstart.sticky', (e) => {
			e.cancelBubble = true
			resizeOrigin = serializeNote(group)
			hideDiscardButton(group)
			stage.container().style.cursor = 'nwse-resize'
		})
		group.on('transform.sticky', (e) => {
			e.cancelBubble = true
			const nodes = noteNodes(group)
			if (!nodes) return
			layoutNote(group, {
				width: nodes.rect.width() * group.scaleX(),
				height: nodes.rect.height() * group.scaleY(),
			})
		})
		group.on('transformend.sticky', (e) => {
			e.cancelBubble = true
			stage.container().style.cursor = 'default'
			const note = describeNote(group)
			options?.recordEvent?.({ type: 'stickyNote-edit', user: editor, data: serializeNote(group) }, resizeOrigin)
			if (note) send(JSON.stringify({
				type: 'stickyNote-transform',
				user: editor,
				data: { id: group.id(), note, pos: { x: group.x(), y: group.y() } },
			}))
			noteConfig.value.resizeable = false
			resizeOrigin = null
		})
		group.on('dragmove.sticky', (e) => {
			e.cancelBubble = true
			if (Date.now() - lastWsMessage < wsThrottle) return
			lastWsMessage = Date.now()
			send(JSON.stringify({ type: 'stickyNote-move', user: editor, data: { id: group.id(), x: group.x(), y: group.y() } }))
		})
		group.on('dragend.sticky', (_) => {
			noteConfig.value.draggable = false
			group.draggable(false)
			stage.container().style.cursor = 'default'
			const data = serializeNote(group)
			options?.recordEvent?.({ type: 'stickyNote-dragEnd', user: editor, data })
			send(JSON.stringify({ type: 'stickyNote-dragEnd', user: editor, data }))
		})
		group.on('click.sticky tap.sticky', () => {
			const textNode = group.findOne('Text') as KonvaTypes.Text | undefined
			const rect = group.findOne('Rect') as KonvaTypes.Rect | undefined
			if (!textNode || !rect) return
			if (editingGroup && editingGroup !== group) {
				hideDiscardButton(editingGroup)
				detachNoteTransformer()
			}
			editingGroup = group
			showDiscardButton(group)
			noteConfig.value.text = textNode.text()
			noteConfig.value.groupId = group.id()
			noteConfig.value.font = textNode.fontFamily()
			noteConfig.value.fontSize = textNode.fontSize()
			noteConfig.value.fontWeight.value = Number(textNode.fontStyle())
			noteConfig.value.textColor = (textNode.fill() as string) || '#000000'
			noteConfig.value.align = (textNode.align() as StickyNote['align']) || 'left'
			noteConfig.value.bgColor = (rect?.fill() as string) || STICKY_PAPERS[0]!.value
			noteConfig.value.resizeable = false
			if (noteConfig.value.bgColor === "#00000000") (rect.stroke("#f5f0e8"), rect.strokeWidth(1))
			isEditing.value = true
			openNoteTextarea(noteConfig.value.text)
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
		const before = serializeNote(group)
		const font = typeof data.font === 'string' ? data.font : textNode.fontFamily()
		const fontSize = typeof data.fontSize === 'number' ? data.fontSize : textNode.fontSize()
		const fontWeight = data.fontWeight !== undefined ? data.fontWeight.value : Number(textNode.fontStyle())
		await ensureNoteFont(font, fontSize, fontWeight)
		if (typeof data.text === 'string') textNode.text(data.text)
		if (typeof data.font === 'string') textNode.fontFamily(data.font)
		if (data.fontWeight !== undefined) textNode.fontStyle(String(fontWeight))
		if (typeof data.fontSize === 'number') textNode.fontSize(data.fontSize)
		if (typeof data.textColor === 'string') textNode.fill(data.textColor)
		if (typeof data.align === 'string') textNode.align(data.align)
		if (typeof data.bgColor === 'string') rect.fill(data.bgColor)
		if (typeof data.draggable === 'boolean') group.draggable(data.draggable)
		if (data.bgColor === "#00000000") (rect.stroke("#f5f0e8"), rect.strokeWidth(1))
		else rect.strokeWidth(0)
		layoutNote(group, typeof data.width === 'number' && typeof data.height === 'number'
			? { width: data.width, height: data.height }
			: undefined)
		layer.batchDraw()
		options?.recordEvent?.({ type: 'stickyNote-edit', user: options?.getUser?.() || "", data: serializeNote(group) }, before)
	}

	const cancelNoteEdit = () => {
		closeNoteTextarea()
		detachNoteTransformer()
		hideDiscardButton(editingGroup)
		const rect = editingGroup?.findOne('Rect') as KonvaTypes.Rect | undefined
		if (rect) rect.strokeWidth(0)
		noteConfig.value.resizeable = false
		editingGroup = null
		isEditing.value = false
	}

	const updateNote = (owner?: string) => {
		const group = editingGroup
		const layer = options?.getLayer()
		const send = options?.send
		if (!group || !layer || !send) return
		const editor = options?.getUser?.() || owner || ''
		syncNoteTransformer(group)
		void applyNoteEdit(group, noteConfig.value).then(() => {
			send(JSON.stringify({
				type: 'stickyNote-edit',
				user: editor,
				data: { id: group.id(), note: noteConfig.value, pos: { x: group.x(), y: group.y() } },
			}))
		})
	}

	const isStickyNoteTarget = (node: KonvaTypes.Node | null, stage: KonvaTypes.Stage | undefined): boolean => {
		while (node && node !== stage) {
			if (node.hasName(STICKY_NOTE_NAME) || node.hasName(STICKY_TRANSFORMER_NAME)) return true
			node = node.getParent()
		}
		return false
	}

	const restoreStickyNote = (node: KonvaTypes.Node): void => {
		if (noteTransformer && noteTransformer.nodes().length === 0) detachNoteTransformer()
		if (isStickyNoteTarget(node, options?.getStage())) attachStickyNoteHandlers(node as KonvaTypes.Group)
	}


	return {
		papers: STICKY_PAPERS,
		paperBackgroundStyle,
		maxLength: NOTE_MAX_LENGTH,
		availableTextColors,
		availableFonts,
		availableFontSizes,
		availableWeights,
		availableTextAlignments,
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
		restoreStickyNote,
	}
}
