<template>
	<Teleport to="body">
		<textarea ref="textareaRef" :value="noteConfig.text" :maxlength="maxLength" :tabindex="isEditing ? 0 : -1"
			class="fixed left-0 top-0 z-20 m-0 origin-top-left resize-none overflow-hidden whitespace-pre-wrap break-words border-0 bg-transparent p-0 text-transparent outline-none selection:bg-coral/30"
			:class="isEditing && !noteConfig.draggable ? 'pointer-events-auto' : 'pointer-events-none'"
			aria-label="Sticky note text" spellcheck="false" autocomplete="off" @input="onInput" />
		<Transition enter-active-class="transition duration-150 ease-out motion-reduce:transition-none"
			enter-from-class="-translate-x-3 opacity-0" enter-to-class="translate-x-0 opacity-100"
			leave-active-class="transition duration-100 ease-in motion-reduce:transition-none"
			leave-from-class="translate-x-0 opacity-100" leave-to-class="-translate-x-3 opacity-0">
			<div v-if="isEditing"
				class="fixed left-6 top-6 z-30 w-60 rounded-3xl border border-chalk/10 bg-board-raised/95 p-5 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.7)] backdrop-blur-sm"
				role="dialog" aria-label="Sticky note options" @mousedown.prevent>
				<div class="mb-3 flex items-center justify-between">
					<h2 class="font-display text-lg text-chalk">Sticky note</h2>
					<button type="button"
						class="flex h-8 w-8 items-center justify-center rounded-lg text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
						aria-label="Done" @click="emit('close')">
						<Icon name="lucide:x" class="h-4 w-4 shrink-0" aria-hidden="true" />
					</button>
				</div>

				<div class="flex items-start justify-between gap-2">
					<p class="text-xs leading-relaxed text-chalk-faint">
						Type to edit the note directly ·
						<span class="font-semibold text-chalk">Esc</span> to finish
					</p>
					<p class="shrink-0 pt-0.5 text-[0.6rem] tabular-nums text-chalk-faint/70" aria-hidden="true">
						{{ noteConfig.text.length }}/{{ maxLength }}
					</p>
				</div>

				<p class="mb-1.5 mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-chalk-faint">Arrange</p>
				<div class="grid grid-cols-2 gap-1.5" role="group" aria-label="Arrange note">
					<button type="button"
						class="flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors"
						:class="noteConfig.draggable
							? 'bg-coral text-chalk ring-1 ring-coral-soft hover:bg-coral-soft'
							: 'text-chalk-faint ring-1 ring-chalk/10 hover:bg-chalk/[0.06] hover:text-chalk'"
						:aria-label="noteConfig.draggable ? 'Stop moving note' : 'Move note'" :aria-pressed="noteConfig.draggable"
						@click="noteConfig.draggable = !noteConfig.draggable">
						<Icon name="lucide:move" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
						{{ noteConfig.draggable ? 'Moving' : 'Move' }}
					</button>
					<button type="button" @click="noteConfig.resizeable = !noteConfig.resizeable"
						class="flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors"
						:class="noteConfig.resizeable
							? 'bg-coral text-chalk ring-1 ring-coral-soft hover:bg-coral-soft'
							: 'text-chalk-faint ring-1 ring-chalk/10 hover:bg-chalk/[0.06] hover:text-chalk'"
						:aria-label="noteConfig.resizeable ? 'Stop resizing note' : 'Resize note'"
						:aria-pressed="noteConfig.resizeable">
						<Icon name="lucide:scaling" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
						{{ noteConfig.resizeable ? 'Resizing' : 'Resize' }}
					</button>
				</div>

				<p class="mb-1.5 mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-chalk-faint">Paper</p>
				<div class="flex flex-wrap items-center gap-2" role="group" aria-label="Note color">
					<button v-for="paper in papers" :key="paper.value" type="button"
						class="h-8 w-8 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
						:class="noteConfig.bgColor === paper.value ? 'ring-2 ring-chalk/70 ring-offset-1 ring-offset-board-raised' : 'ring-1 ring-chalk/10'"
						:style="paperBackgroundStyle(paper.value)" :aria-label="paper.name"
						:aria-pressed="noteConfig.bgColor === paper.value" @click="noteConfig.bgColor = paper.value">
					</button>
				</div>

				<p class="mb-1.5 mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-chalk-faint">Ink</p>
				<div class="flex flex-wrap items-center gap-2" role="group" aria-label="Text color">
					<button v-for="ink in availableTextColors" :key="ink.value" type="button"
						class="h-6 w-6 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
						:class="noteConfig.textColor === ink.value ? 'ring-2 ring-chalk/70 ring-offset-1 ring-offset-board-raised' : 'ring-1 ring-chalk/15'"
						:style="{ backgroundColor: ink.value }" :aria-label="ink.name"
						:aria-pressed="noteConfig.textColor === ink.value" @click="noteConfig.textColor = ink.value">
					</button>
				</div>

				<p class="mb-1.5 mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-chalk-faint">Font</p>
				<div class="grid grid-cols-4 gap-1.5" role="group" aria-label="Font">
					<button v-for="font in availableFonts" :key="font.value" type="button"
						class="flex h-9 items-center justify-center rounded-lg text-sm transition-colors" :class="noteConfig.font === font.value
							? 'bg-chalk/10 text-chalk ring-1 ring-chalk/15'
							: 'text-chalk-faint hover:bg-chalk/[0.06] hover:text-chalk'" :style="{ fontFamily: font.value }"
						:aria-label="font.name" :aria-pressed="noteConfig.font === font.value"
						@click="noteConfig.font = font.value">
						Ag
					</button>
				</div>

				<p class="mb-1.5 mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-chalk-faint">Text alignment
				</p>
				<div class="flex h-9 items-center gap-0.5 rounded-lg p-0.5 ring-1 ring-chalk/10" role="group"
					aria-label="Text alignment">
					<button v-for="alignment in availableTextAlignments" :key="alignment.value" type="button"
						class="flex h-full flex-1 items-center justify-center rounded-md transition-colors" :class="noteConfig.align === alignment.value
							? 'bg-chalk/10 text-chalk ring-1 ring-chalk/15'
							: 'text-chalk-faint hover:bg-chalk/[0.06] hover:text-chalk'" :aria-label="alignment.name"
						:title="alignment.name" :aria-pressed="noteConfig.align === alignment.value"
						@click="noteConfig.align = alignment.value">
						<Icon :name="alignment.icon" class="h-4 w-4 shrink-0" aria-hidden="true" />
					</button>
				</div>

				<p class="mb-1.5 mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-chalk-faint">Weight</p>
				<div class="flex h-9 items-center overflow-hidden rounded-lg ring-1 ring-chalk/10" role="group"
					aria-label="Font weight">
					<button type="button"
						class="flex h-full w-9 shrink-0 items-center justify-center text-chalk-faint transition-colors enabled:hover:bg-chalk/[0.06] enabled:hover:text-chalk disabled:opacity-30"
						:disabled="noteConfig.fontWeight.value <= availableWeights[0]!.value" aria-label="Decrease font weight"
						@click="stepStickyNote(noteConfig, 'fontWeight', -1)">
						<Icon name="lucide:minus" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
					</button>
					<div class="h-4 w-px shrink-0 bg-chalk/10" aria-hidden="true" />
					<span class="min-w-0 flex-1 truncate px-2 text-center text-xs leading-none text-chalk"
						:style="{ fontFamily: noteConfig.font, fontWeight: noteConfig.fontWeight.value }" aria-live="polite">
						{{ noteConfig.fontWeight.label }}
					</span>
					<div class="h-4 w-px shrink-0 bg-chalk/10" aria-hidden="true" />
					<button type="button"
						class="flex h-full w-9 shrink-0 items-center justify-center text-chalk-faint transition-colors enabled:hover:bg-chalk/[0.06] enabled:hover:text-chalk disabled:opacity-30"
						:disabled="noteConfig.fontWeight.value >= availableWeights[availableWeights.length - 1]!.value"
						aria-label="Increase font weight" @click="stepStickyNote(noteConfig, 'fontWeight', 1)">
						<Icon name="lucide:plus" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
					</button>
				</div>
				<p class="mb-1.5 mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-chalk-faint">Size</p>
				<div class="flex h-9 items-center overflow-hidden rounded-lg ring-1 ring-chalk/10" role="group"
					aria-label="Font size">
					<button type="button"
						class="flex h-full w-9 shrink-0 items-center justify-center text-chalk-faint transition-colors enabled:hover:bg-chalk/[0.06] enabled:hover:text-chalk disabled:opacity-30"
						:disabled="noteConfig.fontSize <= availableFontSizes[0]!" aria-label="Decrease font size"
						@click="stepStickyNote(noteConfig, 'fontSize', -1)">
						<Icon name="lucide:minus" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
					</button>
					<div class="h-4 w-px shrink-0 bg-chalk/10" aria-hidden="true" />
					<span class="flex-1 text-center text-sm tabular-nums text-chalk" aria-live="polite">
						{{ noteConfig.fontSize }}
					</span>
					<div class="h-4 w-px shrink-0 bg-chalk/10" aria-hidden="true" />
					<button type="button"
						class="flex h-full w-9 shrink-0 items-center justify-center text-chalk-faint transition-colors enabled:hover:bg-chalk/[0.06] enabled:hover:text-chalk disabled:opacity-30"
						:disabled="noteConfig.fontSize >= availableFontSizes[availableFontSizes.length - 1]!"
						aria-label="Increase font size" @click="stepStickyNote(noteConfig, 'fontSize', 1)">
						<Icon name="lucide:plus" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
					</button>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<script setup lang="ts">
import type { StickyNote } from '~/types/board'
const { papers, paperBackgroundStyle, availableTextColors, availableFonts, availableFontSizes, availableWeights, availableTextAlignments, stepStickyNote } = useStickyNotes()
const isEditing = defineModel<boolean>('isEditing', { required: true })
const noteConfig = defineModel<StickyNote>('noteConfig', { required: true })

defineProps<{
	maxLength: number
}>()

const emit = defineEmits<{
	move: [value: void]
	close: [value: void]
}>()


const textareaRef = ref<HTMLTextAreaElement>()
defineExpose({ textarea: textareaRef })
const onInput = (e: Event) => {
	noteConfig.value.text = (e.target as HTMLTextAreaElement).value
}

const onKeydown = (e: KeyboardEvent) => {
	if (e.key !== 'Escape' || e.isComposing) return
	e.preventDefault()
	emit('close')
}

watch(isEditing, (open) => {
	if (open) window.addEventListener('keydown', onKeydown)
	else window.removeEventListener('keydown', onKeydown)
}, { immediate: true })

onUnmounted(() => {
	window.removeEventListener('keydown', onKeydown)
})
</script>
