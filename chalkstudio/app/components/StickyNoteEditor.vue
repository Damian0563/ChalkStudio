<template>
	<Teleport to="body">
		<Transition enter-active-class="transition duration-150 ease-out motion-reduce:transition-none"
			enter-from-class="-translate-x-3 opacity-0" enter-to-class="translate-x-0 opacity-100"
			leave-active-class="transition duration-100 ease-in motion-reduce:transition-none"
			leave-from-class="translate-x-0 opacity-100" leave-to-class="-translate-x-3 opacity-0">
			<div v-if="isEditing"
				class="fixed left-6 top-6 z-30 w-60 rounded-2xl border border-chalk/10 bg-board-raised/95 p-5 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.7)] backdrop-blur-sm"
				role="dialog" aria-label="Sticky note options">
				<div class="mb-3 flex items-center justify-between">
					<h2 class="font-display text-lg text-chalk">Sticky note</h2>
					<button type="button"
						class="flex h-8 w-8 items-center justify-center rounded-lg text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
						aria-label="Done" @click="emit('close')">
						<Icon name="lucide:x" class="h-4 w-4 shrink-0" aria-hidden="true" />
					</button>
				</div>

				<p class="text-xs leading-relaxed text-chalk-faint">
					Type to edit the note directly ·
					<span class="font-semibold text-chalk">Esc</span> to finish
				</p>
				<p class="mt-1.5 text-[0.6rem] tabular-nums text-chalk-faint/70" aria-hidden="true">
					{{ text.length }}/{{ maxLength }}
				</p>

				<p class="mb-1.5 mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-chalk-faint">Paper</p>
				<div class="flex flex-wrap items-center gap-2" role="group" aria-label="Note color">
					<button v-for="paper in papers" :key="paper.value" type="button"
						class="h-8 w-8 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
						:class="color === paper.value ? 'ring-2 ring-chalk/70 ring-offset-1 ring-offset-board-raised' : 'ring-1 ring-chalk/10'"
						:style="{ backgroundColor: paper.value }" :aria-label="paper.name" :aria-pressed="color === paper.value"
						@click="emit('pickColor', paper.value)">
					</button>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<script setup lang="ts">
import { STICKY_PAPERS } from '~/composables/useStickyNotes'

const isEditing = defineModel<boolean>('isEditing', { required: true })
const text = defineModel<string>('text', { required: true })

const props = defineProps<{
	color: string
	maxLength: number
}>()

const emit = defineEmits<{
	pickColor: [color: string]
	close: []
}>()

const papers = STICKY_PAPERS
const onKeydown = (e: KeyboardEvent) => {
	if (e.key === 'Escape') {
		e.preventDefault()
		emit('close')
		return
	}
	if (e.metaKey || e.ctrlKey || e.altKey) return
	if (e.key === 'Backspace') {
		text.value = text.value.slice(0, -1)
	} else if (e.key === 'Enter') {
		if (text.value.length < props.maxLength) text.value += '\n'
	} else if (e.key.length === 1) {
		if (text.value.length < props.maxLength) text.value += e.key
	} else {
		return
	}
	e.preventDefault()
}

watch(isEditing, (open) => {
	if (open) window.addEventListener('keydown', onKeydown)
	else window.removeEventListener('keydown', onKeydown)
}, { immediate: true })

onUnmounted(() => {
	window.removeEventListener('keydown', onKeydown)
})
</script>
