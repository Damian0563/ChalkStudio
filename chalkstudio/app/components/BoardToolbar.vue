<template>
	<div ref="toolbarRef" class="fixed top-4 left-1/2 z-10 max-w-[calc(100vw-6rem)] -translate-x-1/2" role="toolbar"
		aria-label="Drawing tools">
		<div
			class="flex flex-col overflow-hidden rounded-xl border border-chalk/10 bg-board-raised/92 shadow-[0_10px_36px_-10px_rgba(0,0,0,0.55)] backdrop-blur-sm">
			<div class="h-px w-full chalk-line opacity-55" aria-hidden="true" />

			<div class="flex items-center gap-1 overflow-x-auto px-2 py-1.5 sm:gap-1.5 sm:px-3">
				<div class="flex shrink-0 items-center gap-0.5" role="group" aria-label="Tools">
					<button ref="penButtonRef" type="button"
						class="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors" :class="tool === 'pen'
							? 'bg-chalk/10 text-chalk ring-1 ring-chalk/15'
							: 'text-chalk-faint hover:bg-chalk/[0.06] hover:text-chalk'" aria-label="Pen" :aria-pressed="tool === 'pen'"
						:aria-expanded="penPanelOpen" aria-haspopup="true" @click="handlePenClick">
						<Icon name="lucide:pencil" class="h-4 w-4 shrink-0" aria-hidden="true" />
						<span class="absolute bottom-1 h-0.5 w-3 rounded-full transition-colors"
							:style="tool === 'pen' ? { backgroundColor: color } : undefined" aria-hidden="true" />
					</button>
					<button type="button" class="flex h-9 w-9 items-center justify-center rounded-lg transition-colors" :class="tool === 'eraser'
						? 'bg-chalk/10 text-chalk ring-1 ring-chalk/15'
						: 'text-chalk-faint hover:bg-chalk/[0.06] hover:text-chalk'" aria-label="Eraser"
						:aria-pressed="tool === 'eraser'" @click="selectTool('eraser')">
						<Icon name="lucide:eraser" class="h-4 w-4 shrink-0" aria-hidden="true" />
					</button>
					<button type="button" class="flex h-9 w-9 items-center justify-center rounded-lg transition-colors" :class="tool === 'pan'
						? 'bg-chalk/10 text-chalk ring-1 ring-chalk/15'
						: 'text-chalk-faint hover:bg-chalk/[0.06] hover:text-chalk'" aria-label="Pan" :aria-pressed="tool === 'pan'"
						@click="selectTool('pan')">
						<Icon name="lucide:hand" class="h-4 w-4 shrink-0" aria-hidden="true" />
					</button>
				</div>

				<div class="mx-1 h-6 w-px shrink-0 bg-chalk/10" aria-hidden="true" />

				<div class="flex shrink-0 items-center gap-0.5" role="group" aria-label="History">
					<button type="button"
						class="flex h-9 w-9 items-center justify-center rounded-lg text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
						aria-label="Undo">
						<Icon name="lucide:undo-2" class="h-4 w-4 shrink-0" aria-hidden="true" />
					</button>
					<button type="button"
						class="flex h-9 w-9 items-center justify-center rounded-lg text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
						aria-label="Redo">
						<Icon name="lucide:redo-2" class="h-4 w-4 shrink-0" aria-hidden="true" />
					</button>
				</div>
			</div>
		</div>

		<Transition enter-active-class="transition duration-150 ease-out motion-reduce:transition-none"
			enter-from-class="-translate-y-1 opacity-0" enter-to-class="translate-y-0 opacity-100"
			leave-active-class="transition duration-100 ease-in motion-reduce:transition-none"
			leave-from-class="translate-y-0 opacity-100" leave-to-class="-translate-y-1 opacity-0">
			<div v-if="penPanelOpen" id="pen-panel"
				class="absolute left-0 top-full mt-2 w-60 rounded-xl border border-chalk/10 bg-board-raised/95 p-3 shadow-[0_14px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-sm"
				role="group" aria-label="Pen options">
				<span class="absolute -top-1 left-4 h-2 w-2 rotate-45 border-l border-t border-chalk/10 bg-board-raised"
					aria-hidden="true" />

				<p class="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-chalk-faint">Chalk</p>
				<div class="flex items-end justify-between" role="group" aria-label="Pen color">
					<button v-for="chalk in chalks" :key="chalk.value" type="button"
						class="group flex flex-col items-center gap-1.5 rounded-md p-1 transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
						:aria-label="chalk.name" :aria-pressed="color === chalk.value" @click="color = chalk.value">
						<span
							class="block h-7 w-[9px] rounded-[3px] shadow-[inset_0_-3px_2px_rgba(0,0,0,0.18),inset_0_2px_1px_rgba(255,255,255,0.25)] transition-all"
							:class="color === chalk.value ? 'h-8' : 'opacity-80 group-hover:opacity-100'"
							:style="{ backgroundColor: chalk.value }" aria-hidden="true" />
						<span class="block h-1 w-1 rounded-full transition-colors"
							:class="color === chalk.value ? 'bg-coral' : 'bg-transparent'" aria-hidden="true" />
					</button>
				</div>

				<div class="my-2.5 h-px w-full chalk-line opacity-40" aria-hidden="true" />

				<p class="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-chalk-faint">Stroke</p>
				<div class="flex items-center gap-1" role="group" aria-label="Stroke width">
					<button v-for="stroke in strokes" :key="stroke.value" type="button"
						class="flex h-8 flex-1 items-center justify-center rounded-lg transition-colors" :class="strokeWidth === stroke.value
							? 'bg-chalk/10 text-chalk ring-1 ring-chalk/15'
							: 'text-chalk-faint hover:bg-chalk/[0.06] hover:text-chalk'" :aria-label="stroke.name"
						:aria-pressed="strokeWidth === stroke.value" @click="strokeWidth = stroke.value">
						<span class="block w-4 rounded-full bg-current" :style="{ height: `${Math.max(1, stroke.value / 3)}px` }"
							aria-hidden="true" />
					</button>
				</div>

				<svg class="mt-2.5 h-8 w-full" viewBox="0 0 216 32" fill="none" aria-hidden="true">
					<path d="M6 22 C 40 6, 76 30, 110 16 S 180 8, 210 18" :stroke="color" :stroke-width="strokeWidth"
						stroke-linecap="round" opacity="0.9" />
				</svg>
			</div>
		</Transition>
	</div>
</template>

<script setup lang="ts">
import type { Tool } from '~/types/board'
const color = defineModel<string>('color', { required: true })
const strokeWidth = defineModel<number>('strokeWidth', { required: true })
const penPanelOpen = defineModel<boolean>('penPanelOpen', { required: true })
const tool = defineModel<Tool>('tool', { required: true })

const toolbarRef = ref<HTMLElement>()
const penButtonRef = ref<HTMLButtonElement>()

const chalks = [
	{ name: 'Chalk white', value: '#f5f0e8' },
	{ name: 'Coral', value: '#e85d4c' },
	{ name: 'Slate', value: '#9ba8b8' },
	{ name: 'Yellow chalk', value: '#f0d86e' },
	{ name: 'Green chalk', value: '#7ec8a4' },
	{ name: 'Blue chalk', value: '#7eb3d8' },
]

const strokes = [
	{ name: 'Fine stroke', value: 2 },
	{ name: 'Thin stroke', value: 5 },
	{ name: 'Medium stroke', value: 9 },
	{ name: 'Thick stroke', value: 14 },
]

const handlePenClick = () => {
	if (tool.value === 'pen') {
		penPanelOpen.value = !penPanelOpen.value
	} else {
		tool.value = 'pen'
		penPanelOpen.value = true
	}
}

const selectTool = (next: Tool) => {
	tool.value = next
	penPanelOpen.value = false
}

const handlePointerDown = (e: PointerEvent) => {
	if (!penPanelOpen.value) return
	if (toolbarRef.value && !toolbarRef.value.contains(e.target as Node)) {
		penPanelOpen.value = false
	}
}

const handleKeydown = (e: KeyboardEvent) => {
	if (e.key === 'Escape' && penPanelOpen.value) {
		penPanelOpen.value = false
		penButtonRef.value?.focus()
	}
}

onMounted(() => {
	window.addEventListener('pointerdown', handlePointerDown)
	window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
	window.removeEventListener('pointerdown', handlePointerDown)
	window.removeEventListener('keydown', handleKeydown)
})
</script>
