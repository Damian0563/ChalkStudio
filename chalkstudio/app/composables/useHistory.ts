import type KonvaTypes from 'konva'
import type { BoardEvent, HistoryEvent } from '~/types/board'
// `before` / `after` hold the serialized node on each side of the change,
// `null` meaning the node did not exist at that point in time
type HistoryEntry = {
	id: string
	before: object | null
	after: object | null
}
type UseHistoryOptions = {
	getLayer: () => KonvaTypes.Layer | undefined
	getStage: () => KonvaTypes.Stage | undefined
	send: (message: string) => void
	onRestore?: (node: KonvaTypes.Node) => void
}
type HistoryStep = {
	type: 'undo' | 'redo'
	source: HistoryEntry[]
	target: HistoryEntry[]
	stateOf: (entry: HistoryEntry) => object | null
}
const useHistory = (options: UseHistoryOptions) => {
	const MAX_HISTORY = 10
	const history: HistoryEntry[] = []
	const redoBuffer: HistoryEntry[] = []
	const recordEvent = (event: BoardEvent, before?: object | null) => {
		const layer = options.getLayer()
		if (!layer) return
		const id = event.data?.attrs?.id as string | undefined
		if (!id) return
		if (event.type === 'drawEnd' || event.type === 'stickyNote-new') history.push({ id, before: null, after: event.data })
		else if (event.type === 'stickyNote-edit') {
			if (before && JSON.stringify(before) === JSON.stringify(event.data)) return
			history.push({ id, before: before ?? null, after: event.data })
		} else if (event.type === 'stickyNote-delete') history.push({ id, before: event.data, after: null })
		if (history.length > MAX_HISTORY) history.shift()
	}

	const restore = (layer: KonvaTypes.Layer, id: string, state: object | null) => {
		layer.findOne(`#${id}`)?.destroy()
		if (state) {
			const Konva = useKonva()
			const node = Konva.Node.create(state)
			layer.add(node)
			options.onRestore?.(node)
		}
		layer.batchDraw()
	}

	const applyStep = (step: HistoryStep, predicate?: HistoryEntry): string | undefined => {
		const layer = options.getLayer()
		if ((step.source.length === 0 && !predicate) || !layer) return
		const last = predicate || step.source[step.source.length - 1]
		if (!last) return
		step.target.push(last)
		if (step.target.length > MAX_HISTORY) step.target.shift()
		restore(layer, last.id, step.stateOf(last))
		if (!predicate) {
			step.source.pop()
			// this means it was created by the user so we need to send it to other users
			options.send(JSON.stringify({ type: step.type, id: last.id, before: last.before, after: last.after }))
		}
		return last.id
	}

	const undo = (predicate?: HistoryEntry): string | undefined => {
		return applyStep({
			type: 'undo',
			source: history,
			target: redoBuffer,
			stateOf: (entry) => entry.before,
		}, predicate)
	}

	const redo = (predicate?: HistoryEntry): string | undefined => {
		return applyStep({
			type: 'redo',
			source: redoBuffer,
			target: history,
			stateOf: (entry) => entry.after,
		}, predicate)
	}

	const receiveRemoteEvent = (remote: HistoryEvent) => {
		const entry: HistoryEntry = { id: remote.id, before: remote.before, after: remote.after }
		remote.type === 'undo' ? undo(entry) : redo(entry)
	}
	return { undo, redo, recordEvent, receiveRemoteEvent }
}


export default useHistory
