<template>
	<AnimatePresence>
		<motion.div v-if="open"
			class="fixed inset-0 z-[60] flex h-full w-full items-center justify-center bg-board/80 p-4 backdrop-blur-md"
			:initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :exit="{ opacity: 0, transition: { duration: 0.2 } }"
			:transition="{ duration: 0.25 }" @click.self="emits('cancel')">
			<motion.div
				class="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-xl border border-chalk/10 bg-board-raised shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)]"
				role="alertdialog" aria-modal="true" aria-labelledby="delete-board-title"
				aria-describedby="delete-board-message" :initial="{ opacity: 0, scale: 0.96, y: 20 }"
				:animate="{ opacity: 1, scale: 1, y: 0 }"
				:exit="{ opacity: 0, scale: 0.97, y: 10, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }"
				:transition="{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }">
				<div class="h-px w-full chalk-line opacity-55" aria-hidden="true" />

				<div class="flex items-start gap-3.5 px-6 pt-7 pb-6 sm:px-8">
					<span
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-coral/25 bg-coral/10 text-coral-soft"
						aria-hidden="true">
						<Icon name="lucide:trash" class="h-5 w-5" />
					</span>
					<div class="min-w-0">
						<h2 id="delete-board-title" class="font-display text-xl font-semibold tracking-tight text-chalk">
							Delete board?
						</h2>
						<p id="delete-board-message" class="mt-1 break-words font-sans text-sm text-chalk-faint">
							<span class="font-semibold text-chalk">{{ title }}</span> and everything drawn on it will be
							permanently deleted. This can't be undone.
						</p>
					</div>
				</div>

				<div class="flex items-center justify-end gap-2.5 border-t border-chalk/10 bg-board/40 px-6 py-4 sm:px-8">
					<button ref="cancelButton" type="button"
						class="rounded-lg px-4 py-2.5 font-sans text-sm font-semibold text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
						@click="emits('cancel')">
						Cancel
					</button>
					<button type="button"
						class="flex items-center justify-center gap-2 rounded-lg bg-coral px-4 py-2.5 font-sans text-sm font-semibold text-chalk transition-colors hover:bg-coral-soft"
						@click="emits('confirm')">
						<Icon name="lucide:trash" class="h-4 w-4 shrink-0" aria-hidden="true" />
						Delete board
					</button>
				</div>
			</motion.div>
		</motion.div>
	</AnimatePresence>
</template>

<script setup lang="ts">
import { motion, AnimatePresence } from 'motion-v'

const props = defineProps<{ open: boolean; title: string }>()
const emits = defineEmits<{
	(e: 'cancel'): void
	(e: 'confirm'): void
}>()

const cancelButton = ref<HTMLButtonElement | null>(null)

watch(() => props.open, (isOpen) => {
	if (isOpen) nextTick(() => cancelButton.value?.focus())
})
</script>
