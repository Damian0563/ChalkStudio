<template>
	<div
		class="fixed bottom-4 right-4 z-10 flex flex-col overflow-hidden rounded-sm border border-chalk/10 bg-board-raised/92 shadow-[0_10px_36px_-10px_rgba(0,0,0,0.55)] backdrop-blur-sm"
		role="group"
		aria-label="Canvas zoom">
		<div class="h-px w-full chalk-line opacity-55" aria-hidden="true" />
		<div class="flex items-stretch">
			<button
				type="button"
				class="flex h-10 w-10 shrink-0 items-center justify-center text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk active:bg-coral/15 active:text-coral-soft"
				aria-label="Zoom out"
				@click="decreaseZoom">
				<Icon name="lucide:minus" class="h-3.5 w-3.5" aria-hidden="true" />
			</button>
			<div
				class="flex min-w-[5rem] flex-col items-center justify-center gap-0.5 border-x border-chalk/10 px-3 py-1.5">
				<span
					class="font-display text-[0.9375rem] font-semibold tabular-nums leading-none tracking-tight text-chalk">
					{{ zoomPercent }}%
				</span>
			</div>
			<button
				type="button"
				class="flex h-10 w-10 shrink-0 items-center justify-center text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk active:bg-coral/15 active:text-coral-soft"
				aria-label="Zoom in"
				@click="increaseZoom">
				<Icon name="lucide:plus" class="h-3.5 w-3.5" aria-hidden="true" />
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import type KonvaTypes from 'konva'

const props = defineProps<{
	getStage: () => KonvaTypes.Stage | undefined
	getLayer: () => KonvaTypes.Layer | undefined
}>()

const zoom = ref(1)
const zoomPercent = computed(() => Math.round(zoom.value * 100))
const { increaseZoom, decreaseZoom } = useZoom({
	getStage: props.getStage,
	getLayer: props.getLayer,
	zoom,
})
</script>
