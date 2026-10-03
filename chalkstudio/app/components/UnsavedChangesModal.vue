<template>
	<AnimatePresence>
		<motion.div v-if="open"
			class="fixed inset-0 z-50 flex h-full w-full items-center justify-center bg-board/80 p-4 backdrop-blur-md"
			:initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :exit="{ opacity: 0, transition: { duration: 0.2 } }"
			:transition="{ duration: 0.25 }" @click.self="emits('stay')">
			<motion.div
				class="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-xl border border-chalk/10 bg-board-raised shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)]"
				role="alertdialog" aria-modal="true" aria-labelledby="unsaved-changes-title"
				aria-describedby="unsaved-changes-message" :initial="{ opacity: 0, scale: 0.96, y: 20 }"
				:animate="{ opacity: 1, scale: 1, y: 0 }"
				:exit="{ opacity: 0, scale: 0.97, y: 10, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }"
				:transition="{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }">
				<div class="h-px w-full chalk-line opacity-55" aria-hidden="true" />

				<div class="flex items-start gap-3.5 px-6 pt-7 pb-6 sm:px-8">
					<span
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-coral/25 bg-coral/10 text-coral-soft"
						aria-hidden="true">
						<Icon name="lucide:triangle-alert" class="h-5 w-5" />
					</span>
					<div>
						<h2 id="unsaved-changes-title" class="font-display text-xl font-semibold tracking-tight text-chalk">
							Unsaved changes
						</h2>
						<p id="unsaved-changes-message" class="mt-1 font-sans text-sm text-chalk-faint">
							This board has changes that haven't been saved. If you leave now, they won't be kept on the board.
						</p>
					</div>
				</div>

				<div class="flex items-center justify-end gap-2.5 border-t border-chalk/10 bg-board/40 px-6 py-4 sm:px-8">
					<button type="button"
						class="rounded-lg px-4 py-2.5 font-sans text-sm font-semibold text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
						@click="emits('leave')">
						Leave anyway
					</button>
					<button ref="stayButton" type="button"
						class="flex items-center justify-center gap-2 rounded-lg bg-coral px-4 py-2.5 font-sans text-sm font-semibold text-chalk transition-colors hover:bg-coral-soft"
						@click="emits('stay')">
						Keep editing
					</button>
				</div>
			</motion.div>
		</motion.div>
	</AnimatePresence>
</template>

<script setup lang="ts">
import { motion, AnimatePresence } from 'motion-v'

const props = defineProps<{ open: boolean }>()
const emits = defineEmits<{
	(e: 'stay'): void
	(e: 'leave'): void
}>()

const stayButton = ref<HTMLButtonElement | null>(null)

watch(() => props.open, (isOpen) => {
	if (isOpen) nextTick(() => stayButton.value?.focus())
})
</script>
