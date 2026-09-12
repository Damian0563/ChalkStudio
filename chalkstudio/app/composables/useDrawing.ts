import type KonvaTypes from 'konva'
import type { BoardEvent, Tool } from '~/types/board'
const DRAW_BROADCAST_MS = 50

type UseDrawingOptions = {
	getStage: () => KonvaTypes.Stage | undefined
	getLayer: () => KonvaTypes.Layer | undefined
	send: (message: string) => void
	recordEvent: (event: BoardEvent, before?: object | null) => void
	getUser: () => string
	tool: Ref<Tool>
	color: Ref<string>
	strokeWidth: Ref<number>
	penPanelOpen: Ref<boolean>
	isEditing: Ref<boolean>
	cancelNoteEdit: () => void
	isStickyNoteTarget: (node: KonvaTypes.Node | null, stage: KonvaTypes.Stage | undefined) => boolean
}

export const useDrawing = (options: UseDrawingOptions) => {
	const Konva = useKonva()
	const isDrawing = ref(false)
	const currentLine = ref<KonvaTypes.Line>()
	const lastWsMessage = ref(Date.now())

	const getBoardPointer = () => {
		const stage = options.getStage()
		const layer = options.getLayer()
		const pos = stage?.getPointerPosition()
		if (!stage || !layer || !pos) return undefined
		return layer.getAbsoluteTransform().copy().invert().point(pos)
	}

	const handleMouseDown = (e: KonvaTypes.KonvaEventObject<MouseEvent>) => {
		if (e.evt.button === 2 || options.tool.value === 'pan') return
		if (options.isStickyNoteTarget(e.target, options.getStage())) return
		if (options.isEditing.value) {
			options.cancelNoteEdit()
			return
		}
		if (options.penPanelOpen.value) {
			options.penPanelOpen.value = false
			return
		}
		e.evt.preventDefault()
		const layer = options.getLayer()
		const pos = getBoardPointer()
		if (!layer || !pos) return
		const isEraser = options.tool.value === 'eraser'
		isDrawing.value = true
		currentLine.value = new Konva.Line({
			id: crypto.randomUUID(),
			points: [pos.x, pos.y, pos.x, pos.y],
			stroke: isEraser ? '#000000' : options.color.value,
			strokeWidth: options.strokeWidth.value,
			tension: 0.5,
			lineCap: 'round',
			lineJoin: 'round',
			globalCompositeOperation: isEraser ? 'destination-out' : 'source-over',
		})
		options.send(JSON.stringify({ type: 'drawStart', user: options.getUser(), data: currentLine.value?.toObject() }))
		layer.add(currentLine.value)
	}

	const handleMouseMove = () => {
		if (!isDrawing.value || !currentLine.value) return
		const pos = getBoardPointer()
		if (!pos) return
		const line = currentLine.value
		const points = line.points()
		points.push(pos.x, pos.y)
		line.points(points)
		options.getLayer()?.batchDraw()
		if (Date.now() - lastWsMessage.value < DRAW_BROADCAST_MS) return
		lastWsMessage.value = Date.now()
		options.send(JSON.stringify({ type: 'draw', user: options.getUser(), data: currentLine.value.toObject() }))
	}

	const handleMouseUp = () => {
		const pos = getBoardPointer()
		if (options.tool.value === 'pan' && pos) {
			options.send(JSON.stringify({ type: 'pan', user: options.getUser(), data: { x: pos.x, y: pos.y } }))
			return
		}
		if (!currentLine.value) return
		isDrawing.value = false
		options.send(JSON.stringify({ type: 'drawEnd', user: options.getUser(), data: currentLine.value.toObject() }))
		options.recordEvent({ type: 'drawEnd', user: options.getUser(), data: currentLine.value.toObject() })
		currentLine.value = undefined
	}

	return {
		isDrawing,
		currentLine,
		getBoardPointer,
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
	}
}
