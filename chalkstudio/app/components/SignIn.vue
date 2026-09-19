<template>
	<motion.div
		class="fixed inset-0 z-[40] flex h-full w-full items-center justify-center bg-board/80 p-4 backdrop-blur-md"
		:initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.25 }" @click.self="emit('close')">
		<motion.div
			class="relative w-full max-w-md overflow-hidden rounded-xl border border-chalk/10 bg-board-raised shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)]"
			role="dialog" aria-modal="true" aria-labelledby="auth-title" :initial="{ opacity: 0, scale: 0.96, y: 20 }"
			:animate="{ opacity: 1, scale: 1, y: 0 }" :transition="{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }">
			<div class="h-px w-full chalk-line opacity-55" aria-hidden="true" />

			<button type="button"
				class="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-chalk/40 transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
				aria-label="Close" @click="emit('close')">
				<Icon name="lucide:x" class="h-4 w-4 shrink-0" aria-hidden="true" />
			</button>

			<div class="px-6 pt-8 pb-6 sm:px-8">
				<div class="mb-7 flex flex-col items-center text-center">
					<img src="~/assets/logo.webp" alt="" class="mb-4 h-10 w-auto" decoding="async" />
					<h2 id="auth-title" class="font-display text-2xl font-semibold tracking-tight text-chalk">
						{{ isSignIn ? 'Welcome back' : 'Create your account' }}
					</h2>
					<p class="mt-1.5 font-sans text-sm text-chalk-faint">
						{{ isSignIn ? 'Sign in to pick up where you left off.' : 'Start sketching ideas together in seconds.' }}
					</p>
				</div>

				<div class="grid grid-cols-3 gap-2.5">
					<button v-for="provider in providers" :key="provider.name" type="button"
						class="flex items-center justify-center gap-2 rounded-lg border border-chalk/10 bg-board/60 px-3 py-2.5 font-sans text-sm font-semibold text-chalk/90 transition-colors hover:border-chalk/25 hover:bg-chalk/[0.06] hover:text-chalk"
						:aria-label="`${isSignIn ? 'Sign in' : 'Sign up'} with ${provider.name}`">
						<Icon :name="provider.icon" class="h-4 w-4 shrink-0" aria-hidden="true" />
						{{ provider.name }}
					</button>
				</div>

				<div class="my-6 flex items-center gap-3" aria-hidden="true">
					<span class="h-px flex-1 bg-chalk/10" />
					<span class="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-chalk-faint">or with email</span>
					<span class="h-px flex-1 bg-chalk/10" />
				</div>

				<form ref="formEl" class="flex flex-col gap-4" @submit.prevent="onSubmit">
					<div v-if="!isSignIn" class="flex flex-col gap-1.5">
						<label for="auth-name" class="text-xs font-semibold text-chalk-muted">Name</label>
						<div class="relative">
							<Icon name="lucide:user"
								class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-faint/70"
								aria-hidden="true" />
							<input id="auth-name" v-model="form.name" type="text" autocomplete="name" required
								placeholder="Ada Lovelace" :class="[inputClass, 'pr-3.5']" />
						</div>
					</div>

					<div class="flex flex-col gap-1.5">
						<label for="auth-email" class="text-xs font-semibold text-chalk-muted">Email</label>
						<div class="relative">
							<Icon name="lucide:mail"
								class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-faint/70"
								aria-hidden="true" />
							<input id="auth-email" v-model="form.email" type="email" autocomplete="email" required
								placeholder="you@example.com" :class="[inputClass, 'pr-3.5']" />
						</div>
					</div>

					<div class="flex flex-col gap-1.5">
						<label for="auth-password" class="text-xs font-semibold text-chalk-muted">Password</label>
						<div class="relative">
							<Icon name="lucide:lock"
								class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-faint/70"
								aria-hidden="true" />
							<input id="auth-password" v-model="form.password" :type="showPassword ? 'text' : 'password'"
								:autocomplete="isSignIn ? 'current-password' : 'new-password'" required
								:minlength="isSignIn ? undefined : 8"
								:placeholder="isSignIn ? 'Your password' : 'At least 8 characters'" :class="[inputClass, 'pr-11']" />
							<button type="button"
								class="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-chalk-faint/70 transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
								:aria-label="showPassword ? 'Hide password' : 'Show password'" :aria-pressed="showPassword"
								@click="showPassword = !showPassword">
								<Icon :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'" class="h-4 w-4 shrink-0"
									aria-hidden="true" />
							</button>
						</div>
					</div>

					<button type="submit" :class="{ 'cursor-not-allowed': !isReady }"
						class="group mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-coral px-4 py-3 font-sans text-sm font-semibold text-chalk transition-colors hover:bg-coral-soft">
						{{ isSignIn ? 'Sign in' : 'Create account' }}
						<Icon name="lucide:arrow-right"
							class="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
							aria-hidden="true" />
					</button>
				</form>
			</div>

			<div
				class="border-t border-chalk/10 bg-board/40 px-6 py-4 text-center font-sans text-sm text-chalk-faint sm:px-8">
				{{ isSignIn ? "Don't have an account?" : 'Already have an account?' }}
				<button type="button" class="font-semibold text-coral-soft transition-colors hover:text-chalk"
					@click="mode = isSignIn ? 'signUp' : 'signIn'">
					{{ isSignIn ? 'Sign up' : 'Sign in' }}
				</button>
			</div>
		</motion.div>
	</motion.div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v'
import type { QuickNotice } from '@/types/general'
const mode = defineModel<'signIn' | 'signUp'>('mode', { required: true })

const emit = defineEmits<{
	error: [value: QuickNotice]
	close: [value: void]
}>()

const inputClass =
	'w-full rounded-lg border border-chalk/10 bg-board/60 py-2.5 pl-10 font-sans text-sm text-chalk placeholder:text-chalk-faint/50 transition-[border-color,box-shadow] focus:border-coral-soft/60 focus:outline-none focus:ring-2 focus:ring-coral/20 focus-visible:outline-none'

const providers = [
	{ name: 'Google', icon: 'simple-icons:google' },
	{ name: 'GitHub', icon: 'simple-icons:github' },
	{ name: 'X', icon: 'simple-icons:x' },
]

const isSignIn = computed(() => mode.value === 'signIn')
const form = reactive({ name: '', email: '', password: '' })
const showPassword = ref(false)
const formEl = ref<HTMLFormElement | null>(null)
const focusFirstInput = () => formEl.value?.querySelector('input')?.focus()

const onSubmit = async () => {
	if (!isReady.value) return
	isSignIn.value ? await signIn() : await signUp()
}

const onKeydown = (event: KeyboardEvent) => {
	if (event.key === 'Escape') emit('close')
}

const isReady = computed(() =>
	!!form.email && !!form.password && (isSignIn.value || !!form.name)
)

watch(mode, () => nextTick(focusFirstInput))

onMounted(() => {
	window.addEventListener('keydown', onKeydown)
	focusFirstInput()
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

const signIn = async () => {
}

const signUp = async () => {
	try {
		const response: any = await $fetch('/api/auth/register', {
			method: 'POST',
			body: {
				name: form.name,
				email: form.email,
				password: form.password,
			}
		})
	} catch {
		emit('error', {
			message: 'An error occured while signing up. Please try again later.',
			type: 'error',
		})
	}
}

</script>
