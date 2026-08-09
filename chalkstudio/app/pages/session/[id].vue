<template>
	<ClientOnly>
		<div class="relative h-screen w-screen overflow-hidden chalk-grain bg-[#1a2332]">
			<v-stage ref="stageRef" :config="stageConfig" @contextmenu="handleContextMenu" @mousedown="handleMouseDown"
				@mousemove="handleMouseMove" @mouseup="handleMouseUp" @mouseleave="handleMouseUp" @touchstart="handleMouseDown"
				@touchmove="handleMouseMove" @touchend="handleMouseUp">
				<v-layer ref="layerRef" />
			</v-stage>
		</div>
	</ClientOnly>
</template>

<script setup lang="ts">
import type KonvaTypes from 'konva'
import type { BoardEvent } from '~/types/board'

definePageMeta({
	layout: 'blank',
})

const route = useRoute()
const room = computed(() => route.params.id as string)
const Konva = useKonva()

type VueKonvaComponentRef = {
	getNode: () => KonvaTypes.Stage | KonvaTypes.Layer
}
const color: Ref<string> = ref('#f5f0e8')
const strokeWidth: Ref<number> = ref(5)
const user: Ref<string> = ref('Damian')
const width: Ref<number> = ref(0)
const height: Ref<number> = ref(0)
const stageRef = ref<VueKonvaComponentRef>()
const layerRef = ref<VueKonvaComponentRef>()
const isDrawing: Ref<boolean> = ref(false)
const isPanning: Ref<boolean> = ref(false)
const currentLine = ref<KonvaTypes.Line>()
const stageConfig = computed(() => ({
	width: width.value,
	height: height.value,
	draggable: false,
}))
const getStage = () => stageRef.value?.getNode() as KonvaTypes.Stage | undefined
const getLayer = () => layerRef.value?.getNode() as KonvaTypes.Layer | undefined
const { popUpSprite } = useBoardPopUp({ getLayer })
const remoteLines = new Map<string, KonvaTypes.Line>()
let LAST_SPRITEPOP: undefined | number = undefined
const SPRITEPOP_INTERVAL: number = 1000
const updateSize = () => {
	width.value = window.innerWidth
	height.value = window.innerHeight
}

const { send } = useWebSocket(computed(() => `/ws/session/${room.value}`), {
	onMessage(_ws, messageEvent) {
		const event: BoardEvent = JSON.parse(messageEvent.data as string) as BoardEvent
		if (event.type === 'drawStart' || event.type === 'draw' || event.type === 'drawEnd') {
			if (event.type === 'drawStart' || event.type === 'drawEnd') {
				const points = event.data?.attrs?.points
				if (points && points.length >= 2) {
					const x = event.type === 'drawStart' ? points[0] : points[points.length - 2]
					const y = event.type === 'drawStart' ? points[1] : points[points.length - 1]
					if (LAST_SPRITEPOP === undefined || LAST_SPRITEPOP + SPRITEPOP_INTERVAL < Date.now()) {
						popUpSprite({ user: event.user, x, y, color: event?.color || color.value })
						LAST_SPRITEPOP = Date.now()
					}
				}
			}
			const lineId = event.data?.attrs?.id as string | undefined
			if (!lineId) return
			const layer = getLayer()
			if (!layer) return
			let line = remoteLines.get(lineId)
			if (!line) {
				line = Konva.Node.create(event.data) as KonvaTypes.Line
				layer.add(line)
				remoteLines.set(lineId, line)
			} else {
				line.setAttrs(event.data.attrs)
			}
			layer.batchDraw()
			if (event.type === 'drawEnd') remoteLines.delete(lineId)
		}
	},
})

onMounted(() => {
	updateSize()
	window.addEventListener('resize', updateSize)
})
onUnmounted(() => {
	window.removeEventListener('resize', updateSize)
})

const handleContextMenu = (e: KonvaTypes.KonvaEventObject<MouseEvent>) => {
	e.evt.preventDefault()
}

const handleMouseDown = (e: KonvaTypes.KonvaEventObject<MouseEvent>) => {
	if (e.evt.button === 2 || isPanning.value) return
	e.evt.preventDefault()
	const stage = getStage()
	const layer = getLayer()
	const pos = stage?.getPointerPosition()
	if (!stage || !layer || !pos) return

	isDrawing.value = true
	currentLine.value = new Konva.Line({
		id: crypto.randomUUID(),
		points: [pos.x, pos.y, pos.x, pos.y],
		stroke: color.value,
		strokeWidth: strokeWidth.value,
		tension: 0.5,
		lineCap: 'round',
		lineJoin: 'round',
		globalCompositeOperation: 'source-over',
	})
	send(JSON.stringify({ type: 'drawStart', user: user.value, data: currentLine.value?.toObject() }))
	layer.add(currentLine.value)
}

const lastWsMessage: Ref<number> = ref<number>(Date.now())
const handleMouseMove = () => {
	if (!isDrawing.value || !currentLine.value) return
	const stage = getStage()
	const pos = stage?.getPointerPosition()
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
	if (!currentLine.value) return
	isDrawing.value = false
	send(JSON.stringify({ type: 'drawEnd', user: user.value, data: currentLine.value.toObject() }))
	currentLine.value = undefined
}
</script>
