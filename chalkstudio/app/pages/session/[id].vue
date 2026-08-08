<template>
	<ClientOnly>
		<div class="relative h-screen w-screen overflow-hidden chalk-grain bg-[#1a2332]">
			<v-stage ref="stageRef" :config="stageConfig" @mousedown="handleMouseDown" @mousemove="handleMouseMove"
				@mouseup="handleMouseUp" @mouseleave="handleMouseUp" @touchstart="handleMouseDown" @touchmove="handleMouseMove"
				@touchend="handleMouseUp">
				<v-layer ref="layerRef" />
			</v-stage>
		</div>
	</ClientOnly>
</template>

<script setup lang="ts">
import type Konva from 'konva'

definePageMeta({
	layout: 'blank',
})

const route = useRoute()
const room = computed(() => route.params.id as string)

type VueKonvaComponentRef = {
	getNode: () => Konva.Stage | Konva.Layer
}

const color: Ref<string> = ref('#f5f0e8')
const width: Ref<number> = ref(0)
const height: Ref<number> = ref(0)
const stageRef = ref<VueKonvaComponentRef>()
const layerRef = ref<VueKonvaComponentRef>()
const isDrawing: Ref<boolean> = ref(false)
const isPanning: Ref<boolean> = ref(false)
const currentLine = ref<Konva.Line>()
const stageConfig = computed(() => ({
	width: width.value,
	height: height.value,
	draggable: false,
}))
const getStage = () => stageRef.value?.getNode() as Konva.Stage | undefined
const getLayer = () => layerRef.value?.getNode() as Konva.Layer | undefined
const updateSize = () => {
	width.value = window.innerWidth
	height.value = window.innerHeight
}

const { data, send } = useWebSocket(computed(() => `/ws/session/${room.value}`), {
	onMessage(_ws, event) {
		console.log(typeof event.data === 'string' ? event.data : event.data)
	},
})

watch(data, (newData) => {
	if (newData != null) console.log(newData)
})

onMounted(() => {
	updateSize()
	window.addEventListener('resize', updateSize)
})
onUnmounted(() => {
	window.removeEventListener('resize', updateSize)
})

const handleMouseDown = (e: any) => {
	if (e.evt.button === 2 || isPanning.value) return
	const Konva = useKonva()
	const stage = getStage()
	const layer = getLayer()
	const pos = stage?.getPointerPosition()
	if (!stage || !layer || !pos) return

	isDrawing.value = true
	currentLine.value = new Konva.Line({
		points: [pos.x, pos.y, pos.x, pos.y],
		stroke: color.value,
		strokeWidth: 5,
		tension: 0.5,
		lineCap: 'round',
		lineJoin: 'round',
		globalCompositeOperation: 'source-over',
	})
	send(JSON.stringify({ type: 'draw', data: currentLine.value.toObject() }))
	layer.add(currentLine.value)
}

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
}

const handleMouseUp = () => {
	isDrawing.value = false
	currentLine.value = undefined
}
</script>
