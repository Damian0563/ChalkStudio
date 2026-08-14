<template>
	<ClientOnly>
		<Teleport to="body">
			<motion.div
				v-if="message"
				class="fixed inset-0 z-[55] flex items-center justify-center bg-board/80 px-4 backdrop-blur-md"
				role="alertdialog"
				aria-modal="true"
				:aria-label="title"
				:initial="{ opacity: 0 }"
				:animate="{ opacity: 1 }"
				:transition="{ duration: 0.25 }"
				@click.self="emit('close')">
				<motion.div
					class="relative w-full max-w-md overflow-hidden rounded-xl border border-chalk/10 bg-board-raised p-8 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)]"
					:class="style.card"
					:initial="{ opacity: 0, y: 16, scale: 0.98 }"
					:animate="{ opacity: 1, y: 0, scale: 1 }"
					:transition="{ duration: 0.35, delay: 0.05, ease: [0.22, 1, 0.36, 1] }">
					<div
						class="absolute inset-x-0 top-0 h-px opacity-55"
						:class="style.line"
						aria-hidden="true" />

					<button
						type="button"
						class="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-sm text-chalk/25 transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
						aria-label="Close"
						@click="emit('close')">
						<Icon name="lucide:x" class="h-5 w-5" aria-hidden="true" />
					</button>

					<div class="mb-5 flex justify-center">
						<div
							class="flex h-14 w-14 items-center justify-center rounded-full border"
							:class="style.badge">
							<Icon :name="style.icon" class="h-7 w-7" :class="style.accent" aria-hidden="true" />
						</div>
					</div>

					<h2 class="mb-2 text-center font-display text-2xl font-semibold tracking-tight text-chalk">
						{{ title }}
					</h2>
					<p class="mb-8 text-center font-sans text-sm leading-relaxed text-chalk-muted">
						{{ message }}
					</p>

					<button
						type="button"
						class="mx-auto block rounded-sm px-6 py-2.5 font-sans text-sm font-semibold text-chalk transition-colors"
						:class="style.button"
						@click="emit('close')">
						Got it
					</button>
				</motion.div>
			</motion.div>
		</Teleport>
	</ClientOnly>
</template>

<script setup lang="ts">
import { motion } from 'motion-v'

const SENTIMENT_STYLES = {
	negative: {
		icon: 'lucide:circle-alert',
		accent: 'text-coral-soft',
		badge: 'border-coral/20 bg-coral/10',
		card: 'border-t-2 border-t-coral/50',
		line: 'bg-gradient-to-r from-transparent via-coral/40 to-transparent',
		button: 'bg-coral hover:bg-coral-soft',
	},
	positive: {
		icon: 'lucide:circle-check',
		accent: 'text-[#8fbf8a]',
		badge: 'border-[#8fbf8a]/25 bg-[#8fbf8a]/10',
		card: 'border-t-2 border-t-[#8fbf8a]/50',
		line: 'bg-gradient-to-r from-transparent via-[#8fbf8a]/40 to-transparent',
		button: 'bg-[#6fa868] hover:bg-[#8fbf8a]',
	},
} as const

const props = withDefaults(defineProps<{
	message: string
	sentiment?: 'positive' | 'negative'
	title?: string
}>(), {
	title: 'Heads up',
	sentiment: 'negative',
})

const emit = defineEmits<{
	close: []
}>()

const style = computed(() => SENTIMENT_STYLES[props.sentiment])
</script>
