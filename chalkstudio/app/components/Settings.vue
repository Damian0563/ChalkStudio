<template>
	<div v-if="!open"
		class="fixed top-4 right-4 z-10 overflow-hidden rounded-xl border border-chalk/10 bg-board-raised/92 shadow-[0_10px_36px_-10px_rgba(0,0,0,0.55)] backdrop-blur-sm">
		<div class="h-px w-full chalk-line opacity-55" aria-hidden="true" />
		<button type="button"
			class="flex h-10 w-10 items-center justify-center text-chalk transition-colors hover:bg-chalk/[0.06] hover:text-chalk active:bg-coral/15 active:text-coral-soft"
			aria-label="Open settings" @click="open = true">
			<Icon name="lucide:settings" class="h-4 w-4 shrink-0" aria-hidden="true" />
		</button>
	</div>

	<motion.div v-else class="fixed inset-0 z-10 flex items-center justify-center bg-board/60 p-4 backdrop-blur-sm sm:p-6"
		:initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.22 }" @click.self="open = false">
		<motion.div
			class="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-chalk/10 bg-board-raised shadow-[0_24px_80px_-20px_rgba(0,0,0,0.65)]"
			role="dialog" aria-modal="true" aria-label="Settings" :initial="{ opacity: 0, scale: 0.96, y: 20 }"
			:animate="{ opacity: 1, scale: 1, y: 0 }" :transition="{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }">
			<div class="h-px w-full chalk-line opacity-55" aria-hidden="true" />

			<div class="flex items-center justify-between border-b border-chalk/10 px-6 py-4">
				<span class="font-display text-lg font-semibold tracking-tight text-chalk">
					Settings
				</span>
				<button type="button"
					class="flex h-8 w-8 items-center justify-center rounded-lg text-chalk/40 transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
					aria-label="Close settings" @click="open = false">
					<Icon name="lucide:x" class="h-4 w-4 shrink-0" aria-hidden="true" />
				</button>
			</div>

			<motion.div class="min-h-[20rem] sm:min-h-[24rem]" :initial="{ opacity: 0, y: 16 }"
				:animate="{ opacity: 1, y: 0 }" :transition="{ duration: 0.35, delay: 0.08, ease: [0.22, 1, 0.36, 1] }" />
		</motion.div>
	</motion.div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v'
const open = ref(false)
const onKeydown = (event: KeyboardEvent) => {
	if (event.key === 'Escape') open.value = false
}

watch(open, (isOpen) => {
	if (isOpen) {
		window.addEventListener('keydown', onKeydown)
	} else {
		window.removeEventListener('keydown', onKeydown)
	}
})

onUnmounted(() => {
	window.removeEventListener('keydown', onKeydown)
})
</script>
