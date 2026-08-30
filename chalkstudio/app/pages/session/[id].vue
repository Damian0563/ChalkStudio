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
				v-model:tool="tool" />
			<BoardUsersPannel v-model:users="users" :main-user="user" :settings="settings"
				@navigate="displayUserLocation($event, users)" v-if="!settings.focusMode" />
			<Settings v-model:settings="settings" />
			<BoardZoom :zoom-percent="zoomPercent" :increase-zoom="increaseZoom" :decrease-zoom="decreaseZoom"
				v-if="!settings.focusMode" />
		</div>
	</ClientOnly>
</template>

<script setup lang="ts">
import type KonvaTypes from 'konva'
import type { BoardEvent, BoardUser, Tool, BoardSettings } from '~/types/board'
import type { QuickNotice } from '~/types/general'
import { v4 as uuidv4 } from 'uuid'
const user: Ref<string> = ref(uuidv4().slice(0, 8))
definePageMeta({
	layout: 'blank',
})
useHead({
	bodyAttrs: { class: 'overflow-hidden' },
})
const BOARD_WIDTH: number = 3840
const BOARD_HEIGHT: number = 1080
const viewportWidth: Ref<number> = ref(BOARD_WIDTH)
const viewportHeight: Ref<number> = ref(BOARD_HEIGHT)
const loading: Ref<boolean> = ref(false)

const route = useRoute()
const room = computed(() => route.params.id as string)
const Konva = useKonva()

type VueKonvaComponentRef = {
	getNode: () => KonvaTypes.Stage | KonvaTypes.Layer
}

const settings: Ref<BoardSettings> = ref({
	focusMode: false,
	consolidateParticipantsPanel: false,
	showSprites: true,
})
const { enterFullscreen, exitFullscreen, syncFocusModeWithFullscreen } = useFullscreen(settings)
watch(() => settings.value.focusMode, (focusMode) => {
	if (focusMode) enterFullscreen()
	else exitFullscreen()
})

const penPanelOpen: Ref<boolean> = ref(false)
const color: Ref<string> = ref('#f5f0e8')
const strokeWidth: Ref<number> = ref(5)
const tool: Ref<Tool> = ref('pen')

const users: Ref<Map<string, BoardUser>> = ref(new Map<string, BoardUser>([[user.value, { name: user.value, color: color.value }]]))
const stageRef = ref<VueKonvaComponentRef>()
const layerRef = ref<VueKonvaComponentRef>()
const isDrawing: Ref<boolean> = ref(false)
const currentLine = ref<KonvaTypes.Line>()
const stageConfig = computed(() => ({
	width: viewportWidth.value,
	height: viewportHeight.value,
	draggable: tool.value === "pan",
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
const zoom: Ref<number> = ref(1)
const zoomPercent = computed(() => Math.round(zoom.value * 100))
const { increaseZoom, decreaseZoom } = useZoom({ getStage, getLayer, zoom })
useKeyboard({
	zoom: { increaseZoom, decreaseZoom },
	settings,
})
const remoteLines = new Map<string, KonvaTypes.Line>()
const userSpritePops = new Map<string, number>()
const quickNotice: Ref<QuickNotice | undefined> = ref(undefined)

const { send } = useWebSocket(computed(() => `/ws/session/${room.value}`), {
	onMessage(_ws, messageEvent) {
		try {
			const event: BoardEvent = JSON.parse(messageEvent.data as string) as BoardEvent
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
				users.value.set(event.user, {
					name: event.user,
					x,
					y,
					color: event.color || users.value.get(event.user)?.color || color.value,
				})
				if (event.type === 'drawEnd') remoteLines.delete(lineId)
			} else if (event.type === 'join' || event.type === 'leave') {
				const roster = event.others
					? new Map<string, BoardUser>(Object.entries(event.others))
					: new Map<string, BoardUser>()
				if (!roster.has(user.value)) {
					roster.set(user.value, users.value.get(user.value) ?? { name: user.value, color: color.value })
				}
				users.value = roster
			} else if (event.type === 'pan') {
				const user = event.user
				const x = event.data.x
				const y = event.data.y
				if (users.value.has(user)) {
					users.value.get(user)!.x = x
					users.value.get(user)!.y = y
				}
			}
		} catch (_) {
			quickNotice.value = { message: 'Error parsing remote event', type: 'error' }
		} finally {
			//DEBUG PURPOSES: mock roster to preview overflow behaviour
			// MOCK USERS
			// users.value = new Map<string, BoardUser>([
			// 	[user.value, { name: user.value, color: color.value }],
			// 	['mock-1', { name: 'Alice', color: '#e07a5f' }],
			// 	['mock-2', { name: 'Bartholomew-the-Long-Named', color: '#81b29a', x: 100, y: 100 }],
			// 	['mock-3', { name: 'Charlie', color: '#f2cc8f' }],
			// 	['mock-4', { name: 'Dominika', color: '#8ecae6' }],
			// 	['mock-5', { name: 'Edgar', color: '#c77dff' }],
			// 	['mock-6', { name: 'Fiona', color: '#ffb703' }],
			// 	['mock-7', { name: 'Grzegorz', color: '#90be6d' }],
			// 	['mock-8', { name: 'Helena', color: '#f28482' }],
			// ])
		}
	},
})

const setViewportSize = () => {
	viewportWidth.value = window.innerWidth
	viewportHeight.value = window.innerHeight
}

onMounted(() => {
	loading.value = true
	setViewportSize()
	window.addEventListener('resize', setViewportSize)
	document.addEventListener('fullscreenchange', syncFocusModeWithFullscreen)
	send(JSON.stringify({ type: 'join', user: user.value }))
	loading.value = false
})

onUnmounted(() => {
	if (settings.value.focusMode) exitFullscreen()
	window.removeEventListener('resize', setViewportSize)
	document.removeEventListener('fullscreenchange', syncFocusModeWithFullscreen)
	send(JSON.stringify({ type: 'leave', user: user.value }))
})

const handleContextMenu = (e: KonvaTypes.KonvaEventObject<MouseEvent>) => {
	e.evt.preventDefault()
}

const handleMouseDown = (e: KonvaTypes.KonvaEventObject<MouseEvent>) => {
	if (e.evt.button === 2) return
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

const lastWsMessage: Ref<number> = ref<number>(Date.now())
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
	if (tool.value === "pan" && pos) {
		send(JSON.stringify({ type: 'pan', user: user.value, data: { x: pos.x, y: pos.y } }))
		return
	}
	if (!currentLine.value) return
	isDrawing.value = false
	send(JSON.stringify({ type: 'drawEnd', user: user.value, data: currentLine.value.toObject() }))
	currentLine.value = undefined
}
</script>
