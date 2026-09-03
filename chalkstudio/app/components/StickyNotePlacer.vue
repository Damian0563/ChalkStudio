<template>
	<Teleport to="body">
		<div class="fixed inset-0 z-30 bg-board/55 backdrop-brightness-75" role="dialog" aria-modal="true"
			aria-label="Place sticky note" @contextmenu.prevent>
			<p
				class="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 rounded-lg border border-chalk/10 bg-board-raised/90 px-4 py-2 text-sm text-chalk-faint shadow-[0_10px_36px_-10px_rgba(0,0,0,0.55)] backdrop-blur-sm">
				Drag the note into place, then press <span class="font-semibold text-chalk">Enter</span> or click
				<span class="font-semibold text-chalk">Place</span> · <span class="font-semibold text-chalk">Esc</span> to
				cancel
			</p>

			<div class="absolute touch-none select-none" :class="dragging ? 'cursor-grabbing' : 'cursor-grab'" :style="{
				left: `${position.x}px`,
				top: `${position.y}px`,
				width: `${noteWidth}px`,
				minHeight: `${noteMinHeight}px`,
				backgroundColor: note.bgColor,
			}" style="border-radius: 4px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);" @pointerdown="startDrag">
				<p class="whitespace-pre-wrap break-words p-3" :style="{
					color: note.textColor,
					fontFamily: note.font,
					fontSize: `${note.fontSize}px`,
					fontWeight: note.fontWeight.value,
					lineHeight: 1,
				}">
					{{ note.text }}
				</p>
			</div>

			<div class="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2">
				<button type="button"
					class="rounded-lg border border-chalk/10 bg-board-raised/90 px-4 py-2 text-sm text-chalk-faint backdrop-blur-sm transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
					@click="emit('cancel')">
					Cancel
				</button>
				<button type="button"
					class="flex items-center gap-1.5 rounded-lg border border-chalk/15 bg-board-raised/90 px-4 py-2 text-sm font-medium text-chalk backdrop-blur-sm transition-colors hover:bg-chalk/15"
					@click="confirm">
					<Icon name="lucide:check" class="h-4 w-4 shrink-0" aria-hidden="true" />
					Place note
				</button>
			</div>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import type { StickyNote } from '~/types/board'
const props = defineProps<{
	note: StickyNote
	noteWidth: number
	noteMinHeight?: number
}>()

const emit = defineEmits<{
	place: [pos: { x: number; y: number }]
	cancel: []
}>()

const noteMinHeight = computed(() => props.noteMinHeight ?? 80)

const position = ref({ x: 0, y: 0 })
const dragging = ref(false)
const dragOffset = { x: 0, y: 0 }

onMounted(() => {
	position.value = {
		x: Math.round(window.innerWidth / 2 - props.noteWidth / 2),
		y: Math.round(window.innerHeight / 2 - noteMinHeight.value / 2),
	}
	window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
	window.removeEventListener('keydown', handleKeydown)
})

const startDrag = (e: PointerEvent) => {
	dragging.value = true
	dragOffset.x = e.clientX - position.value.x
	dragOffset.y = e.clientY - position.value.y
	const target = e.currentTarget as HTMLElement
	target.setPointerCapture(e.pointerId)
	target.addEventListener('pointermove', onDrag)
	target.addEventListener('pointerup', endDrag, { once: true })
}

const onDrag = (e: PointerEvent) => {
	if (!dragging.value) return
	position.value = {
		x: e.clientX - dragOffset.x,
		y: e.clientY - dragOffset.y,
	}
}

const endDrag = (e: PointerEvent) => {
	dragging.value = false
	const target = e.currentTarget as HTMLElement
	target.removeEventListener('pointermove', onDrag)
}

const confirm = () => {
	emit('place', { ...position.value })
}

const handleKeydown = (e: KeyboardEvent) => {
	if (e.key === 'Enter') confirm()
	else if (e.key === 'Escape') emit('cancel')
}
</script>
