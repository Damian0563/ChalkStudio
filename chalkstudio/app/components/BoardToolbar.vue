<template>
	<div class="fixed top-4 left-1/2 z-10 max-w-[calc(100vw-6rem)] -translate-x-1/2" role="toolbar"
		aria-label="Drawing tools" ref="toolbarRef">
		<div
			class="flex flex-col overflow-hidden rounded-xl border border-chalk/10 bg-board-raised/92 shadow-[0_10px_36px_-10px_rgba(0,0,0,0.55)] backdrop-blur-sm">
			<div class="h-px w-full chalk-line opacity-55" aria-hidden="true" />
			<div class="flex items-center gap-1 overflow-x-auto px-2 py-1.5 sm:gap-1.5 sm:px-3">
				<div class="flex shrink-0 items-center gap-0.5" role="group" aria-label="Tools">
					<button ref="penButtonRef" type="button" title="Pen"
						class="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors" :class="tool === 'pen'
							? 'bg-chalk/10 text-chalk ring-1 ring-chalk/15'
							: 'text-chalk-faint hover:bg-chalk/[0.06] hover:text-chalk'" aria-label="Pen" :aria-pressed="tool === 'pen'"
						:aria-expanded="penPanelOpen && tool === 'pen'" aria-haspopup="true" @click="selectTool('pen')"
						@dblclick="openPanel('pen')" aria-controls="pen-panel">
						<Icon name="lucide:pencil" class="h-4 w-4 shrink-0" aria-hidden="true" />
						<span class="absolute bottom-1 h-0.5 w-4 rounded-full transition-colors"
							:style="tool === 'pen' ? { backgroundColor: color } : undefined" aria-hidden="true" />
					</button>
					<button ref="eraserButtonRef" type="button" title="Eraser"
						class="flex h-9 w-9 items-center justify-center rounded-lg transition-colors" :class="tool === 'eraser'
							? 'bg-chalk/10 text-chalk ring-1 ring-chalk/15'
							: 'text-chalk-faint hover:bg-chalk/[0.06] hover:text-chalk'" aria-label="Eraser"
						:aria-pressed="tool === 'eraser'" :aria-expanded="penPanelOpen && tool === 'eraser'" aria-haspopup="true"
						@click="selectTool('eraser')" @dblclick="openPanel('eraser')">
						<Icon name="lucide:eraser" class="h-4 w-4 shrink-0" aria-hidden="true" />
					</button>
					<button ref="stickyButtonRef" type="button" title="Sticky notes"
						class="flex h-9 w-9 items-center justify-center rounded-lg transition-colors" :class="stickyPanelOpen
							? 'bg-chalk/10 text-chalk ring-1 ring-chalk/15'
							: 'text-chalk-faint hover:bg-chalk/[0.06] hover:text-chalk'" aria-label="Sticky notes"
						:aria-expanded="stickyPanelOpen" aria-haspopup="true" aria-controls="sticky-panel"
						@click="toggleStickyPanel">
						<Icon name="lucide:square-text" class="h-4 w-4 shrink-0" aria-hidden="true" />
					</button>
					<button type="button" class="flex h-9 w-9 items-center justify-center rounded-lg transition-colors" :class="tool === 'pan'
						? 'bg-chalk/10 text-chalk ring-1 ring-chalk/15'
						: 'text-chalk-faint hover:bg-chalk/[0.06] hover:text-chalk'" aria-label="Pan" :aria-pressed="tool === 'pan'"
						@click="selectTool('pan')" title="Pan">
						<Icon name="lucide:hand" class="h-4 w-4 shrink-0" aria-hidden="true" />
					</button>
				</div>
				<div class="mx-1 h-6 w-px shrink-0 bg-chalk/10" aria-hidden="true" />
				<div class="flex shrink-0 items-center gap-0.5" role="group" aria-label="History">
					<button type="button" title="Undo"
						class="flex h-9 w-9 items-center justify-center rounded-lg text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
						aria-label="Undo">
						<Icon name="lucide:undo-2" class="h-4 w-4 shrink-0" aria-hidden="true" />
					</button>
					<button type="button"
						class="flex h-9 w-9 items-center justify-center rounded-lg text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
						aria-label="Redo" title="Redo">
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
				role="group" :aria-label="tool === 'eraser' ? 'Eraser options' : 'Pen options'">
				<span class="absolute -top-1 h-2 w-2 rotate-45 border-l border-t border-chalk/10 bg-board-raised"
					:class="tool === 'eraser' ? 'left-14' : 'left-4'" aria-hidden="true" />

				<template v-if="tool === 'pen'">
					<p class="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-chalk-faint">Color</p>
					<div class="grid grid-cols-6 gap-1.5" role="group" aria-label="Pen color">
						<button v-for="chalk in chalks" :key="chalk.value" type="button"
							class="h-7 w-7 rounded-lg transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
							:class="color === chalk.value ? 'ring-2 ring-chalk/70 ring-offset-1 ring-offset-board-raised' : 'ring-1 ring-chalk/10'"
							:style="{ backgroundColor: chalk.value }" :aria-label="chalk.name" :aria-pressed="color === chalk.value"
							@click="color = chalk.value">
						</button>
					</div>

					<div class="my-2.5 h-px w-full chalk-line opacity-40" aria-hidden="true" />
				</template>

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
					<path d="M6 22 C 40 6, 76 30, 110 16 S 180 8, 210 18" :stroke="tool === 'eraser' ? '#9ba8b8' : color"
						:stroke-width="strokeWidth" stroke-linecap="round" opacity="0.9" />
				</svg>
			</div>
		</Transition>

		<Teleport to="body">
			<Transition enter-active-class="transition duration-150 ease-out motion-reduce:transition-none"
				enter-from-class="opacity-0" enter-to-class="opacity-100"
				leave-active-class="transition duration-100 ease-in motion-reduce:transition-none"
				leave-from-class="opacity-100" leave-to-class="opacity-0">
				<div v-if="stickyPanelOpen" class="fixed inset-0 z-20 flex items-center justify-center bg-board/60 p-4"
					@click.self="closeStickyPanel">
					<div id="sticky-panel"
						class="w-full max-w-sm rounded-2xl border border-chalk/10 bg-board-raised/95 p-5 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.7)] backdrop-blur-sm"
						role="dialog" aria-modal="true" aria-label="New sticky note">
						<div class="mb-4 flex items-center justify-between">
							<h2 class="font-display text-lg text-chalk">New sticky note</h2>
							<button type="button"
								class="flex h-8 w-8 items-center justify-center rounded-lg text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
								aria-label="Close" @click="closeStickyPanel">
								<Icon name="lucide:x" class="h-4 w-4 shrink-0" aria-hidden="true" />
							</button>
						</div>

						<form @submit.prevent="submitNote">
							<div class="relative">
								<textarea ref="noteTextareaRef" v-model="noteText" rows="4" :maxlength="maxLength"
									placeholder="Jot something down…"
									class="w-full resize-none rounded-lg p-3 text-sm leading-snug text-board shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] outline-none transition-shadow placeholder:text-board/40 focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.15),0_0_0_2px_rgba(245,240,232,0.35)]"
									:style="{ backgroundColor: noteColor }" aria-label="Note text" />
								<span class="pointer-events-none absolute bottom-2.5 right-2.5 text-[0.6rem] tabular-nums text-board/40"
									aria-hidden="true">{{ noteText.length }}/{{ maxLength }}</span>
							</div>

							<p class="mb-1.5 mt-3 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-chalk-faint">Paper</p>
							<div class="flex items-center gap-2" role="group" aria-label="Note color">
								<button v-for="paper in papers" :key="paper.value" type="button"
									class="h-8 w-8 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
									:class="noteColor === paper.value ? 'ring-2 ring-chalk/70 ring-offset-1 ring-offset-board-raised' : 'ring-1 ring-chalk/10'"
									:style="{ backgroundColor: paper.value }" :aria-label="paper.name"
									:aria-pressed="noteColor === paper.value" @click="noteColor = paper.value">
								</button>
							</div>

							<div class="mt-5 flex items-center justify-end gap-2">
								<button type="button"
									class="rounded-lg px-3 py-2 text-sm text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
									@click="closeStickyPanel">
									Cancel
								</button>
								<button type="submit" :disabled="!isValid"
									class="flex items-center gap-1.5 rounded-lg backdrop-blur-sm/10 px-4 py-2 text-sm font-medium text-chalk ring-1 ring-chalk/15 transition-colors enabled:hover:bg-chalk/15 disabled:cursor-not-allowed disabled:opacity-40">
									<Icon name="lucide:plus" class="h-4 w-4 shrink-0" aria-hidden="true" />
									Add to board
								</button>
							</div>
						</form>
					</div>
				</div>
			</Transition>
		</Teleport>
	</div>
</template>

<script setup lang="ts">
import type { StickyNote, Tool } from '~/types/board'
const color = defineModel<string>('color', { required: true })
const strokeWidth = defineModel<number>('strokeWidth', { required: true })
const penPanelOpen = defineModel<boolean>('penPanelOpen', { required: true })
const tool = defineModel<Tool>('tool', { required: true })
const penButtonRef = ref<HTMLButtonElement>()
const eraserButtonRef = ref<HTMLButtonElement>()
const stickyButtonRef = ref<HTMLButtonElement>()
const { chalks, strokes } = useStrokeConfig()
const { papers, maxLength, noteText, noteColor, isValid, submit } = useStickyNotes()

const emit = defineEmits<{
	addNote: [note: StickyNote]
}>()


const stickyPanelOpen = ref(false)

const selectTool = (next: Tool) => {
	tool.value = next
	penPanelOpen.value = false
	stickyPanelOpen.value = false
}

const openPanel = (next: Tool) => {
	tool.value = next
	penPanelOpen.value = true
	stickyPanelOpen.value = false
}
const noteTextareaRef = ref<HTMLTextAreaElement>()
const toggleStickyPanel = () => {
	stickyPanelOpen.value = !stickyPanelOpen.value
	if (stickyPanelOpen.value) {
		penPanelOpen.value = false
		nextTick(() => noteTextareaRef.value?.focus())
	}
}

const closePanel = (panelOpen: Ref<boolean>, ref: Ref<HTMLButtonElement | undefined>) => {
	panelOpen.value = false
	ref.value?.focus()
}
const closeStickyPanel = () => closePanel(stickyPanelOpen, stickyButtonRef)

const submitNote = () => {
	const note = submit()
	if (!note) return
	emit('addNote', note)
	stickyPanelOpen.value = false
}

const handleKeydown = (e: KeyboardEvent) => {
	if (e.key !== 'Escape') return
	if (stickyPanelOpen.value) {
		closePanel(stickyPanelOpen, stickyButtonRef)
	} else if (penPanelOpen.value) {
		closePanel(penPanelOpen, tool.value === 'eraser' ? eraserButtonRef : penButtonRef)
	}
}

onMounted(() => {
	window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
	window.removeEventListener('keydown', handleKeydown)
})
</script>
