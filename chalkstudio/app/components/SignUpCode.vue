<template>
	<motion.div
		class="fixed inset-0 z-[45] flex h-full w-full items-center justify-center bg-board/80 p-4 backdrop-blur-md"
		:initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.25 }" @click.self="emit('close')">
		<motion.div
			class="relative w-full max-w-md overflow-hidden rounded-xl border border-chalk/10 bg-board-raised shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)]"
			role="dialog" aria-modal="true" aria-labelledby="code-title" :initial="{ opacity: 0, scale: 0.96, y: 20 }"
			:animate="{ opacity: 1, scale: 1, y: 0 }" :transition="{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }">
			<div class="h-px w-full chalk-line opacity-55" aria-hidden="true" />

			<button type="button"
				class="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-chalk/40 transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
				aria-label="Close" @click="emit('close')">
				<Icon name="lucide:x" class="h-4 w-4 shrink-0" aria-hidden="true" />
			</button>

			<div class="px-6 pt-8 pb-6 sm:px-8">
				<div class="mb-7 flex flex-col items-center text-center">
					<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-coral/20 bg-coral/10">
						<Icon name="lucide:mail-check" class="h-6 w-6 text-coral-soft" aria-hidden="true" />
					</div>
					<h2 id="code-title" class="font-display text-2xl font-semibold tracking-tight text-chalk">
						Check your inbox
					</h2>
					<p class="mt-1.5 font-sans text-sm text-chalk-faint">
						We sent a {{ length }}-digit code to
						<span class="font-semibold text-chalk/90">{{ email }}</span>.
					</p>
				</div>

				<form class="flex flex-col gap-4" @submit.prevent="onSubmit">
					<div class="flex flex-col gap-2">
						<div class="flex justify-center gap-2" role="group" aria-label="Confirmation code" @paste.prevent="onPaste">
							<input v-for="(digit, index) in digits" :key="index" :ref="el => setInputRef(el, index)" :value="digit"
								type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="1" :aria-label="`Digit ${index + 1}`"
								:aria-invalid="!!error"
								class="h-12 w-11 rounded-lg border bg-board/60 text-center font-display text-lg font-semibold text-chalk transition-[border-color,box-shadow] focus:outline-none focus:ring-2 focus:ring-coral/20 focus-visible:outline-none"
								:class="error ? 'border-coral/60' : 'border-chalk/10 focus:border-coral-soft/60'"
								@input="onInput($event, index)" @keydown="onKeydown($event, index)" @focus="onFocus($event)" />
						</div>
						<p v-if="error" class="text-center font-sans text-xs text-coral-soft" role="alert">{{ error }}</p>
					</div>

					<button type="submit" :disabled="!isComplete" :class="{ 'cursor-not-allowed opacity-60': !isComplete }"
						class="group mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-coral px-4 py-3 font-sans text-sm font-semibold text-chalk transition-colors hover:bg-coral-soft">
						Confirm email
						<Icon name="lucide:arrow-right"
							class="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
							aria-hidden="true" />
					</button>
				</form>
			</div>

			<div class="border-t border-chalk/10 bg-board/40 px-6 py-4 text-center font-sans text-sm text-chalk-faint sm:px-8">
				Didn't get it?
				<button type="button" :disabled="secondsLeft > 0"
					class="font-semibold text-coral-soft transition-colors hover:text-chalk disabled:cursor-not-allowed disabled:text-chalk-faint disabled:hover:text-chalk-faint"
					@click="onResend">
					{{ secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Send a new code' }}
				</button>
			</div>
		</motion.div>
	</motion.div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v'

const code = defineModel<string>('code', { required: true })

const props = withDefaults(defineProps<{
	email: string
	length?: number
	error?: string
	resendDelay?: number
}>(), { length: 6, error: '', resendDelay: 60 })

const emit = defineEmits<{
	submit: [value: string]
	resend: [value: void]
	close: [value: void]
}>()

const inputs = ref<HTMLInputElement[]>([])
const setInputRef = (el: Element | ComponentPublicInstance | null, index: number) => {
	if (el instanceof HTMLInputElement) inputs.value[index] = el
}
const focusInput = (index: number) => {
	const input = inputs.value[Math.min(Math.max(index, 0), props.length - 1)]
	input?.focus()
	input?.select()
}

const digits = computed(() => Array.from({ length: props.length }, (_, index) => code.value[index] ?? ''))
const isComplete = computed(() => code.value.length === props.length)

// The boxes render `code`, so a keystroke Vue does not turn into a model change -
// a letter, or a digit typed into a box past the end of the code - would otherwise
// linger in the DOM node. Every mutation rewrites the nodes from the model instead.
const syncInputs = () => inputs.value.forEach((input, index) => {
	if (input) input.value = digits.value[index] ?? ''
})

const write = (char: string, at: number) => {
	const next = digits.value.slice()
	next[at] = char
	// Blanks collapse, so the code never grows a hole the user cannot see.
	code.value = next.join('').slice(0, props.length)
	syncInputs()
}

const onInput = (event: Event, index: number) => {
	const char = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(-1)
	if (!char) return syncInputs()
	// A digit typed past the end of the code collapses back to the first free box,
	// so the next box is measured from where the digit actually landed.
	const landedAt = Math.min(index, code.value.length)
	write(char, index)
	focusInput(landedAt + 1)
}

const onKeydown = (event: KeyboardEvent, index: number) => {
	if (event.key === 'Escape') return emit('close')
	if (event.key === 'ArrowLeft') { event.preventDefault(); return focusInput(index - 1) }
	if (event.key === 'ArrowRight') { event.preventDefault(); return focusInput(index + 1) }
	if (event.key !== 'Backspace') return
	event.preventDefault()
	const target = digits.value[index] ? index : index - 1
	if (target < 0) return
	write('', target)
	focusInput(target)
}

const onPaste = (event: ClipboardEvent) => {
	const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, props.length)
	if (!pasted) return
	code.value = pasted
	syncInputs()
	focusInput(pasted.length)
}

const onFocus = (event: FocusEvent) => (event.target as HTMLInputElement).select()

const onSubmit = () => {
	if (!isComplete.value) return focusInput(code.value.length)
	emit('submit', code.value)
}

const secondsLeft = ref(props.resendDelay)
let countdown: ReturnType<typeof setInterval> | undefined

const startCountdown = () => {
	secondsLeft.value = props.resendDelay
	clearInterval(countdown)
	countdown = setInterval(() => {
		if (--secondsLeft.value <= 0) clearInterval(countdown)
	}, 1000)
}

const onResend = () => {
	if (secondsLeft.value > 0) return
	code.value = ''
	syncInputs()
	emit('resend')
	startCountdown()
	focusInput(0)
}

// A rejected code stays on screen so the user can see what they typed, but the
// first box takes focus so retyping simply overwrites it.
watch(() => props.error, error => error && focusInput(0))

onMounted(() => {
	startCountdown()
	nextTick(() => focusInput(code.value.length))
})

onBeforeUnmount(() => clearInterval(countdown))
</script>
