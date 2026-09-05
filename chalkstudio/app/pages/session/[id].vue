<template>
	<ClientOnly>
		<div class="relative h-screen w-screen overflow-hidden chalk-grain bg-[#1a2332]">
			<Notice :message="quickNotice" />
			<Spinner :loading="loading" />
			<v-stage ref="stageRef" :config="stageConfig" @contextmenu="handleContextMenu" @mousedown="handleMouseDown"
				@mousemove="handleMouseMove" @mouseup="handleMouseUp" @mouseleave="handleMouseUp" @touchstart="handleMouseDown"
				@touchmove="handleMouseMove" @touchend="handleMouseUp">
				<v-layer ref="layerRef" />
			</v-stage>
			<BoardToolbar v-model:color="color" v-model:stroke-width="strokeWidth" v-model:pen-panel-open="penPanelOpen"
				v-model:tool="tool" @add-note="positionNote($event)" />
			<BoardUsersPannel v-model:users="users" :main-user="user" :settings="settings"
				@navigate="displayUserLocation($event, users)" v-if="!settings.focusMode" />
			<Settings v-model:settings="settings" />
			<BoardZoom :zoom-percent="zoomPercent" :increase-zoom="increaseZoom" :decrease-zoom="decreaseZoom"
				v-if="!settings.focusMode" />
			<StickyNotePlacer v-if="isSetupStickyNote && pendingNote" :note="pendingNote" :note-width="NOTE_WIDTH"
				@place="placeNote($event, user)" @cancel="cancelNotePlacement" />
			<StickyNoteEditor v-model:is-editing="isEditing" v-model:note-config="noteConfig" :max-length="maxLength"
				@close="cancelNoteEdit" />
		</div>
	</ClientOnly>
</template>

<script setup lang="ts">
import type KonvaTypes from 'konva'
import type { BoardEvent, Tool, BoardSettings } from '~/types/board'
import type { QuickNotice } from '~/types/general'

definePageMeta({
	layout: 'blank',
})
useHead({
	bodyAttrs: { class: 'overflow-hidden' },
})

const BOARD_WIDTH = 3840
const BOARD_HEIGHT = 1080
const viewportWidth = ref(BOARD_WIDTH)
const viewportHeight = ref(BOARD_HEIGHT)
const loading = ref(false)
const quickNotice = ref<QuickNotice | undefined>(undefined)

const route = useRoute()
const room = computed(() => route.params.id as string)
const Konva = useKonva()

type VueKonvaComponentRef = {
	getNode: () => KonvaTypes.Stage | KonvaTypes.Layer
}

const settings = ref<BoardSettings>({
	focusMode: false,
	consolidateParticipantsPanel: false,
	showSprites: true,
})
const { enterFullscreen, exitFullscreen, syncFocusModeWithFullscreen } = useFullscreen(settings)
watch(() => settings.value.focusMode, (focusMode) => {
	if (focusMode) enterFullscreen()
	else exitFullscreen()
})

const penPanelOpen = ref(false)
const color = ref('#f5f0e8')
const strokeWidth = ref(5)
const tool = ref<Tool>('pen')

const { user, users, applyRoster, trackPresence, updatePan } = useBoardUsers()

const stageRef = ref<VueKonvaComponentRef>()
const layerRef = ref<VueKonvaComponentRef>()
const isDrawing = ref(false)
const currentLine = ref<KonvaTypes.Line>()
const stageConfig = computed(() => ({
	width: viewportWidth.value,
	height: viewportHeight.value,
	draggable: tool.value === 'pan',
}))
const getStage = () => stageRef.value?.getNode() as KonvaTypes.Stage | undefined
const getLayer = () => layerRef.value?.getNode() as KonvaTypes.Layer | undefined
const getBoardPointer = () => {
	const stage = getStage()
	const layer = getLayer()
	const pos = stage?.getPointerPosition()
	if (!stage || !layer || !pos) return undefined
	return layer.getAbsoluteTransform().copy().invert().point(pos)
}

const { popUpSprite, displayUserLocation } = useBoardPopUp({
	getLayer,
	getStage,
	getViewportSize: () => ({ width: viewportWidth.value, height: viewportHeight.value }),
})

const zoom = ref(1)
const zoomPercent = computed(() => Math.round(zoom.value * 100))
const { increaseZoom, decreaseZoom } = useZoom({ getStage, getLayer, zoom })
useKeyboard({
	zoom: { increaseZoom, decreaseZoom },
	settings,
})

const remoteLines = new Map<string, KonvaTypes.Line>()
const userSpritePops = new Map<string, number>()

const handleBoardEvent = (event: BoardEvent) => {
	if (event.type === 'drawStart' || event.type === 'draw' || event.type === 'drawEnd') {
		const isEraser = event.data?.attrs?.globalCompositeOperation === 'destination-out'
		const points = event.data?.attrs?.points
		const x = event.type === 'drawStart' ? points[0] : points[points.length - 2]
		const y = event.type === 'drawStart' ? points[1] : points[points.length - 1]
		if (!isEraser && points && points.length >= 2 && settings.value.showSprites) {
			const lastPop = userSpritePops.get(event.user)
			if (lastPop === undefined || lastPop + 900 < Date.now()) {
				popUpSprite({ user: event.user, x, y, color: event?.color || color.value })
				userSpritePops.set(event.user, Date.now())
			}
		}
		const lineId = event.data?.attrs?.id as string | undefined
		const layer = getLayer()
		if (!lineId || !event.data || !layer) return
		let line = remoteLines.get(lineId)
		if (!line) {
			line = Konva.Node.create(event.data) as KonvaTypes.Line
			layer.add(line)
			remoteLines.set(lineId, line)
		} else {
			line.setAttrs(event.data.attrs)
		}
		layer.batchDraw()
		trackPresence(event.user, { x, y, color: event.color })
		if (event.type === 'drawEnd') remoteLines.delete(lineId)
	} else if (event.type === 'join' || event.type === 'leave') {
		applyRoster(event)
	} else if (event.type === 'pan') {
		updatePan(event.user, event.data.x, event.data.y)
	} else if (event.type === 'stickyNote-new') {
		const note = Konva.Node.create(event.data) as KonvaTypes.Group
		const layer = getLayer()
		if (!layer || !note) return
		attachStickyNoteHandlers(note)
		trackPresence(event.user, { x: note.attrs.x, y: note.attrs.y, color: event.color })
		layer.add(note)
		layer.batchDraw()
	} else if (event.type === 'stickyNote-edit') {
		const layer = getLayer()
		const group = layer?.findOne(`#${event.data?.id}`) as KonvaTypes.Group | undefined
		if (!layer || !group) return
		applyNoteEdit(group, event.data.note)
	} else if (event.type === 'stickyNote-move') {
		const layer = getLayer()
		const group = layer?.findOne(`#${event.data?.id}`) as KonvaTypes.Group | undefined
		if (!layer || !group) return
		group.x(event.data.x)
		group.y(event.data.y)
		trackPresence(event.user, { x: event.data.x, y: event.data.y })
		layer.batchDraw()
	}
}

const { send, join, leave } = useBoardWebSocket({
	room,
	userId: user.value,
	onEvent: handleBoardEvent,
	onError: (error) => {
		console.error(error)
		quickNotice.value = { message: 'Error parsing remote event', type: 'error' }
	},
})

const { isSetupStickyNote, NOTE_WIDTH, maxLength, pendingNote, isEditing, noteConfig, updateNote, cancelNoteEdit, positionNote, placeNote, cancelNotePlacement, attachStickyNoteHandlers, applyNoteEdit, isStickyNoteTarget } =
	useStickyNotes({ getLayer, getStage, send, getUser: () => user.value })

watch(noteConfig, () => {
	if (isEditing.value) updateNote(user.value)
}, { deep: true })

const setViewportSize = () => {
	viewportWidth.value = window.innerWidth
	viewportHeight.value = window.innerHeight
}

onMounted(() => {
	loading.value = true
	setViewportSize()
	window.addEventListener('resize', setViewportSize)
	document.addEventListener('fullscreenchange', syncFocusModeWithFullscreen)
	join()
	loading.value = false
})

onUnmounted(() => {
	if (settings.value.focusMode) exitFullscreen()
	window.removeEventListener('resize', setViewportSize)
	document.removeEventListener('fullscreenchange', syncFocusModeWithFullscreen)
	leave()
})

const handleContextMenu = (e: KonvaTypes.KonvaEventObject<MouseEvent>) => {
	e.evt.preventDefault()
}

const handleMouseDown = (e: KonvaTypes.KonvaEventObject<MouseEvent>) => {
	if (e.evt.button === 2 || tool.value === 'pan') return
	if (isStickyNoteTarget(e.target, getStage())) return
	if (isEditing.value) {
		cancelNoteEdit()
		return
	}
	if (penPanelOpen.value) {
		penPanelOpen.value = false
		return
	}
	e.evt.preventDefault()
	const layer = getLayer()
	const pos = getBoardPointer()
	if (!layer || !pos) return
	const isEraser = tool.value === 'eraser'
	isDrawing.value = true
	currentLine.value = new Konva.Line({
		id: crypto.randomUUID(),
		points: [pos.x, pos.y, pos.x, pos.y],
		stroke: isEraser ? '#000000' : color.value,
		strokeWidth: strokeWidth.value,
		tension: 0.5,
		lineCap: 'round',
		lineJoin: 'round',
		globalCompositeOperation: isEraser ? 'destination-out' : 'source-over',
	})
	send(JSON.stringify({ type: 'drawStart', user: user.value, data: currentLine.value?.toObject() }))
	layer.add(currentLine.value)
}

const lastWsMessage = ref(Date.now())
const handleMouseMove = () => {
	if (!isDrawing.value || !currentLine.value) return
	const pos = getBoardPointer()
	if (!pos) return
	const line = currentLine.value
	const points = line.points()
	points.push(pos.x, pos.y)
	line.points(points)
	getLayer()?.batchDraw()
	if (Date.now() - lastWsMessage.value < 50) return
	lastWsMessage.value = Date.now()
	send(JSON.stringify({ type: 'draw', user: user.value, data: currentLine.value.toObject() }))
}

const handleMouseUp = () => {
	const pos = getBoardPointer()
	if (tool.value === 'pan' && pos) {
		send(JSON.stringify({ type: 'pan', user: user.value, data: { x: pos.x, y: pos.y } }))
		return
	}
	if (!currentLine.value) return
	isDrawing.value = false
	send(JSON.stringify({ type: 'drawEnd', user: user.value, data: currentLine.value.toObject() }))
	currentLine.value = undefined
}
</script>
