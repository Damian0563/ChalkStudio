<template>
	<motion.div class="fixed inset-0 z-[60] flex h-full w-full items-center justify-center bg-board/80 backdrop-blur-md"
		role="dialog" aria-modal="true" :aria-label="mode === 'signIn' ? 'Sign in' : 'Sign up'" :initial="{ opacity: 0 }"
		:animate="{ opacity: 1 }" :transition="{ duration: 0.25 }" @click.self="emit('close')">
		<motion.div
			class="relative w-full max-w-md rounded-xl border border-chalk/10 bg-board-raised p-8 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)]"
			:initial="{ opacity: 0, y: 16 }" :animate="{ opacity: 1, y: 0 }" :transition="{ duration: 0.35, delay: 0.05 }">
			<Icon name="lucide:x" class="cursor-pointer absolute top-4 right-4 z-10 h-6 w-6 text-chalk/25 hover:text-chalk"
				@click="emit('close')" />
			<div class="flex justify-between items-center mt-3">
				<button type="submit" @click="navigateTo('/workspace')"
					class="w-full rounded-lg bg-coral px-4 py-3 font-sans text-sm font-semibold text-chalk transition-colors hover:bg-coral-soft">
					{{ mode === 'signIn' ? 'Sign in' : 'Create account' }}
				</button>
			</div>
		</motion.div>
	</motion.div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v'
defineProps<{
	mode: 'signIn' | 'signUp'
}>()

const emit = defineEmits<{
	close: []
}>()

</script>
