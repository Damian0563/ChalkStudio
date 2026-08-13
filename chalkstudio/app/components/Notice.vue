<template>
	<AnimatePresence @exitComplete="onExitComplete">
		<motion.div v-if="visible && activeNotice" :key="noticeKey" role="status" aria-live="polite"
			class="fixed bottom-[1rem] left-4 z-20 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-chalk/10 bg-board-raised/92 shadow-[0_10px_36px_-10px_rgba(0,0,0,0.55)] backdrop-blur-sm"
			:class="style.border" :initial="{ opacity: 0, y: 14, x: 10 }" :animate="{ opacity: 1, y: 0, x: 0 }"
			:exit="{ opacity: 0, y: 8, x: 6, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }"
			:transition="{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }">
			<div class="h-px w-full chalk-line opacity-55" aria-hidden="true" />

			<div class="flex items-start gap-3 px-4 py-3">
				<Icon :name="style.icon" class="mt-0.5 h-4 w-4 shrink-0" :class="style.accent" aria-hidden="true" />
				<p class="min-w-0 flex-1 font-sans text-sm leading-snug text-chalk">
					{{ activeNotice.message }}
				</p>
				<button type="button"
					class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-chalk/35 transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
					aria-label="Dismiss notice" @click="dismiss">
					<Icon name="lucide:x" class="h-3.5 w-3.5" aria-hidden="true" />
				</button>
			</div>

			<div class="h-0.5 bg-chalk/[0.08]" role="progressbar" :aria-valuenow="progress" aria-valuemin="0"
				aria-valuemax="100" :aria-label="`${style.label} notice time remaining`">
				<motion.div :key="`progress-${noticeKey}`" class="h-full origin-left" :class="style.progress"
					:initial="{ scaleX: 1 }" :animate="{ scaleX: 0 }"
					:transition="{ duration: NOTICE_DURATION_SEC, ease: 'linear' }" />
			</div>
		</motion.div>
	</AnimatePresence>
</template>

<script setup lang="ts">
import type { QuickNotice } from '~/types/general'
import { AnimatePresence, motion } from 'motion-v'

const NOTICE_DURATION_MS = 5000
const NOTICE_DURATION_SEC = NOTICE_DURATION_MS / 1000

const props = defineProps<{
	message: QuickNotice | undefined
}>()

const NOTICE_STYLES = {
	success: {
		icon: 'lucide:circle-check',
		accent: 'text-[#8fbf8a]',
		progress: 'bg-[#8fbf8a]',
		border: 'border-l-2 border-l-[#8fbf8a]/70',
		label: 'Success',
	},
	error: {
		icon: 'lucide:circle-alert',
		accent: 'text-coral-soft',
		progress: 'bg-coral-soft',
		border: 'border-l-2 border-l-coral-soft/70',
		label: 'Error',
	},
	warning: {
		icon: 'lucide:triangle-alert',
		accent: 'text-[#f0d86e]',
		progress: 'bg-[#f0d86e]',
		border: 'border-l-2 border-l-[#f0d86e]/70',
		label: 'Warning',
	},
} as const

const visible = ref(false)
const activeNotice = ref<QuickNotice | null>(null)
const noticeKey = ref(0)
const progress = ref(100)

let dismissTimer: ReturnType<typeof setTimeout> | undefined
let progressTimer: ReturnType<typeof setInterval> | undefined

const style = computed(() =>
	activeNotice.value ? NOTICE_STYLES[activeNotice.value.type] : NOTICE_STYLES.error,
)

const clearDismissTimer = () => {
	if (dismissTimer) {
		clearTimeout(dismissTimer)
		dismissTimer = undefined
	}
}

const clearProgressTimer = () => {
	if (progressTimer) {
		clearInterval(progressTimer)
		progressTimer = undefined
	}
}

const clearTimers = () => {
	clearDismissTimer()
	clearProgressTimer()
}

const dismiss = () => {
	if (!visible.value) return
	clearTimers()
	visible.value = false
}

const onExitComplete = () => {
	activeNotice.value = null
	progress.value = 100
}

const startProgressTracking = () => {
	progress.value = 100
	const startedAt = Date.now()
	progressTimer = setInterval(() => {
		const elapsed = Date.now() - startedAt
		progress.value = Math.max(0, Math.round(100 - (elapsed / NOTICE_DURATION_MS) * 100))
		if (progress.value <= 0) clearProgressTimer()
	}, 100)
}

const showNotice = (message: QuickNotice) => {
	clearTimers()
	activeNotice.value = message
	noticeKey.value += 1
	visible.value = true
	startProgressTracking()
	dismissTimer = setTimeout(dismiss, NOTICE_DURATION_MS)
}

watch(() => props.message, (message) => {
	if (!message) return
	showNotice(message)
}, { immediate: true })

onUnmounted(clearTimers)
</script>
