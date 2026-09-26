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
				v-model:tool="tool" @save-board-state="saveBoardState(boardMeta)" @add-note="positionNote($event)"
				@undo="closeEditorFor(undo())" @redo="closeEditorFor(redo())" @add-image="openImagePicker" />
			<BoardUsersPannel v-model:users="users" :main-user="user" :settings="settings"
				@navigate="displayUserLocation($event, users)" v-if="!settings.focusMode" />
			<Settings v-model:settings="settings" />
			<BoardZoom :zoom-percent="zoomPercent" :increase-zoom="increaseZoom" :decrease-zoom="decreaseZoom"
				v-if="!settings.focusMode" />
			<StickyNotePlacer v-if="isSetupStickyNote && pendingNote" :note="pendingNote" :note-width="NOTE_WIDTH"
				@place="placeNote($event, user)" @cancel="cancelNotePlacement" />
			<StickyNoteEditor ref="noteEditorRef" v-model:is-editing="isEditing" v-model:note-config="noteConfig"
				:max-length="maxLength" @close="cancelNoteEdit" />
		</div>
	</ClientOnly>
</template>

<script setup lang="ts">
import type KonvaTypes from 'konva'
import type { BoardEvent, Tool, BoardSettings, HistoryEvent } from '~/types/board'
import type { BoardMeta } from '#shared/types'
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
let websocketStateTimeout: any
const stageConfig = computed(() => ({
	width: viewportWidth.value,
	height: viewportHeight.value,
	draggable: tool.value === 'pan',
}))
const noteEditorRef = ref<{ textarea?: HTMLTextAreaElement }>()
const getStage = () => stageRef.value?.getNode() as KonvaTypes.Stage | undefined
const getLayer = () => layerRef.value?.getNode() as KonvaTypes.Layer | undefined

const { popUpSprite, displayUserLocation } = useBoardPopUp({
	getLayer,
	getStage,
	getViewportSize: () => ({ width: viewportWidth.value, height: viewportHeight.value }),
})

const zoom = ref(1)
const zoomPercent = computed(() => Math.round(zoom.value * 100))
const remoteLines = new Map<string, KonvaTypes.Line>()
const userSpritePops = new Map<string, number>()

const handleBoardEvent = (event: BoardEvent | HistoryEvent) => {
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
	} else if (event.type === 'join') {
		applyRoster(event)
		if (event.user === user.value && rosterPeers(event).length === 0) void loadPage()
		else if (isStateProvider(event)) {
			send(JSON.stringify({ type: 'state', user: user.value, target: event.user, data: saveBoard() }))
			websocketStateTimeout = setTimeout(() => void loadPage(saveBoard()), wsTimeout)
		}
	} else if (event.type === 'leave') {
		applyRoster(event)
	} else if (event.type === 'state' && event.target === user.value && event.data) {
		clearTimeout(websocketStateTimeout)
		void loadPage(event.data)
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
	} else if (event.type === 'stickyNote-edit' || event.type === 'stickyNote-transform') {
		const layer = getLayer()
		const group = layer?.findOne(`#${event.data?.id}`) as KonvaTypes.Group | undefined
		if (!layer || !group) return
		event.type === 'stickyNote-transform' ? group.position({ x: event.data.pos.x, y: event.data.pos.y }) : null
		applyNoteEdit(group, event.data.note)
		trackPresence(event.user, event.data.pos as { x: number; y: number })
	} else if (event.type === 'stickyNote-move' || event.type === 'stickyNote-dragStart' || event.type === 'stickyNote-dragEnd') {
		const layer = getLayer()
		const pos = event.type === 'stickyNote-move' ? event.data : event.data?.attrs
		const group = layer?.findOne(`#${pos?.id}`) as KonvaTypes.Group | undefined
		if (!layer || !group) return
		group.position({ x: pos.x, y: pos.y })
		if (event.type === 'stickyNote-dragEnd') group.draggable(false)
		trackPresence(event.user, { x: pos.x, y: pos.y })
		layer.batchDraw()
	} else if (event.type === 'stickyNote-delete') {
		const layer = getLayer()
		const group = layer?.findOne(`#${event.data?.attrs?.id}`) as KonvaTypes.Group | undefined
		if (!layer || !group) return
		closeEditorFor(group.id())
		group.destroy()
		layer.batchDraw()
	} else if (event.type === 'undo' || event.type === 'redo') {
		closeEditorFor(receiveRemoteEvent(event))
	}
	if (event.type !== 'undo' && event.type !== 'redo') recordEvent(event as BoardEvent)
}

const closeEditorFor = (id: string | undefined) => {
	if (id && id === noteConfig.value.groupId) cancelNoteEdit()
}


const { send, join, leave, rosterPeers, isStateProvider } = useBoardWebSocket({
	room,
	user: user.value,
	onEvent: handleBoardEvent,
	onError: (error) => {
		console.error(error)
		quickNotice.value = { message: 'Error parsing remote event', type: 'error' }
	},
})


const restoreNode = (node: KonvaTypes.Node) => restoreStickyNote(node)
const { undo, redo, recordEvent, receiveRemoteEvent } = useHistory({
	getLayer,
	getStage,
	send,
	onRestore: restoreNode,
})

const { isSetupStickyNote, NOTE_WIDTH, maxLength, pendingNote, isEditing, noteConfig, updateNote, cancelNoteEdit, positionNote, placeNote, cancelNotePlacement, attachStickyNoteHandlers, applyNoteEdit, isStickyNoteTarget, restoreStickyNote } =
	useStickyNotes({ getLayer, getStage, send, recordEvent, getUser: () => user.value, getNoteTextarea: () => noteEditorRef.value?.textarea })

const { openImagePicker, restoreImage } = useImages({ quickNotice, room, getLayer, getStage, fetch: useRequestFetch() })

const { handleMouseDown, handleMouseMove, handleMouseUp } = useDrawing({
	getStage,
	getLayer,
	send,
	recordEvent,
	getUser: () => user.value,
	tool,
	color,
	strokeWidth,
	penPanelOpen,
	isEditing,
	cancelNoteEdit,
	isStickyNoteTarget,
})

const { increaseZoom, decreaseZoom } = useZoom({ getStage, getLayer, zoom })
useKeyboard({
	zoom: { increaseZoom, decreaseZoom },
	history: { undo: () => closeEditorFor(undo()), redo: () => closeEditorFor(redo()) },
	settings,
})
const boardMeta = useState<BoardMeta | undefined>('boardMeta')
const { $csrfFetch } = useNuxtApp()
const { loadPage, saveBoard, saveBoardState, autoSaveBoardState, wsTimeout } = useBoardState({ getStage, getLayer, quickNotice, loading, room, onRestore: restoreNode, onRestoreImage: restoreImage, fetch: $csrfFetch })


watch(noteConfig, () => {
	if (isEditing.value) updateNote(user.value)
}, { deep: true })

const setViewportSize = () => {
	viewportWidth.value = window.innerWidth
	viewportHeight.value = window.innerHeight
}

let interval: any
onMounted(() => {
	loading.value = true
	join()
	setViewportSize()
	window.addEventListener('resize', setViewportSize)
	window.addEventListener('beforeunload', autoSaveBoardState)
	document.addEventListener('fullscreenchange', syncFocusModeWithFullscreen)
	loading.value = false
	interval = setInterval(autoSaveBoardState, 60_000)
})

onUnmounted(() => {
	if (settings.value.focusMode) exitFullscreen()
	window.removeEventListener('resize', setViewportSize)
	window.removeEventListener('beforeunload', autoSaveBoardState)
	document.removeEventListener('fullscreenchange', syncFocusModeWithFullscreen)
	clearInterval(interval)
	autoSaveBoardState()
	leave()
})

const handleContextMenu = (e: KonvaTypes.KonvaEventObject<MouseEvent>) => {
	e.evt.preventDefault()
}
</script>
