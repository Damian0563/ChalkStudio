<template>
	<motion.div
		class="fixed inset-0 z-[40] flex h-full w-full items-center justify-center bg-board/80 p-4 backdrop-blur-md"
		:initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.25 }" @click.self="emit('close')">
		<motion.div
			class="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-xl border border-chalk/10 bg-board-raised shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)]"
			role="dialog" aria-modal="true" aria-labelledby="auth-title" :initial="{ opacity: 0, scale: 0.96, y: 20 }"
			:animate="{ opacity: 1, scale: 1, y: 0 }" :transition="{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }">
			<div class="h-px w-full chalk-line opacity-55" aria-hidden="true" />

			<button type="button"
				class="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-chalk/40 transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
				aria-label="Close" @click="emit('close')">
				<Icon name="lucide:x" class="h-4 w-4 shrink-0" aria-hidden="true" />
			</button>

			<div class="px-6 sm:px-8" :class="isSignIn ? 'pt-8 pb-6' : 'pt-6 pb-5'">
				<div class="flex flex-col items-center text-center" :class="isSignIn ? 'mb-7' : 'mb-5'">
					<img src="~/assets/logo.webp" alt="" class="w-auto" :class="isSignIn ? 'mb-4 h-10' : 'mb-3 h-8'"
						decoding="async" />
					<h2 id="auth-title" class="font-display font-semibold tracking-tight text-chalk"
						:class="isSignIn ? 'text-2xl' : 'text-xl'">
						{{ isSignIn ? 'Welcome back' : 'Create your account' }}
					</h2>
					<p class="font-sans text-chalk-faint" :class="isSignIn ? 'mt-1.5 text-sm' : 'mt-1 text-xs'">
						{{ isSignIn ? 'Sign in to pick up where you left off.' : 'Start sketching ideas together in seconds.' }}
					</p>
				</div>

				<div class="grid grid-cols-3 gap-2.5">
					<button v-for="provider in providers" :key="provider.name" type="button"
						class="flex items-center justify-center gap-2 rounded-lg border border-chalk/10 bg-board/60 px-3 font-sans text-sm font-semibold text-chalk/90 transition-colors hover:border-chalk/25 hover:bg-chalk/[0.06] hover:text-chalk"
						:class="isSignIn ? 'py-2.5' : 'py-2'"
						:aria-label="`${isSignIn ? 'Sign in' : 'Sign up'} with ${provider.name}`">
						<Icon :name="provider.icon" class="h-4 w-4 shrink-0" aria-hidden="true" />
						{{ provider.name }}
					</button>
				</div>

				<div class="flex items-center gap-3" :class="isSignIn ? 'my-6' : 'my-4'" aria-hidden="true">
					<span class="h-px flex-1 bg-chalk/10" />
					<span class="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-chalk-faint">or with email</span>
					<span class="h-px flex-1 bg-chalk/10" />
				</div>

				<form ref="formEl" class="flex flex-col" :class="isSignIn ? 'gap-4' : 'gap-3'" @submit.prevent="onSubmit">
					<fieldset v-if="!isSignIn" class="flex items-center gap-3">
						<legend class="sr-only">I'm signing up as</legend>
						<span class="shrink-0 text-xs font-semibold text-chalk-muted" aria-hidden="true">I'm a</span>
						<div class="grid flex-1 grid-cols-2 gap-1 rounded-lg border border-chalk/10 bg-board/60 p-1">
							<label v-for="option in roleOptions" :key="option.value"
								class="flex cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-1.5 font-sans text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-coral/20"
								:class="form.role === option.value ? 'bg-chalk/[0.08] text-chalk' : 'text-chalk-faint hover:text-chalk'">
								<input v-model="form.role" type="radio" name="auth-role" :value="option.value" class="sr-only" />
								<Icon :name="option.icon" class="h-4 w-4 shrink-0" aria-hidden="true" />
								{{ option.label }}
							</label>
						</div>
					</fieldset>

					<!-- Name and email share a row while signing up, so the taller form still fits a laptop screen. -->
					<div class="grid gap-3" :class="{ 'sm:grid-cols-2': !isSignIn }">
						<div v-if="!isSignIn" class="flex flex-col gap-1">
							<label for="auth-name" class="text-xs font-semibold text-chalk-muted">Name</label>
							<div class="relative">
								<Icon name="lucide:user"
									class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-faint/70"
									aria-hidden="true" />
								<input id="auth-name" v-model="form.name" type="text" autocomplete="name" required
									placeholder="Ada Lovelace" :class="[inputClass, 'pr-3.5']" />
							</div>
						</div>

						<div class="flex flex-col" :class="isSignIn ? 'gap-1.5' : 'gap-1'">
							<label for="auth-email" class="text-xs font-semibold text-chalk-muted">Email</label>
							<div class="relative">
								<Icon name="lucide:mail"
									class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-faint/70"
									aria-hidden="true" />
								<input id="auth-email" v-model="form.email" type="email" autocomplete="email" required
									placeholder="you@example.com" :class="[inputClass, 'pr-3.5']" />
							</div>
						</div>
					</div>

					<div class="flex flex-col" :class="isSignIn ? 'gap-1.5' : 'gap-1'">
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

					<button type="submit"
						:class="[{ 'cursor-not-allowed': !isReady }, isSignIn ? 'mt-2 py-3' : 'mt-1 py-2.5']"
						class="group flex w-full items-center justify-center gap-2 rounded-lg bg-coral px-4 font-sans text-sm font-semibold text-chalk transition-colors hover:bg-coral-soft">
						{{ isSignIn ? 'Sign in' : 'Create account' }}
						<Icon name="lucide:arrow-right"
							class="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
							aria-hidden="true" />
					</button>
				</form>
			</div>

			<div class="border-t border-chalk/10 bg-board/40 px-6 text-center font-sans text-sm text-chalk-faint sm:px-8"
				:class="isSignIn ? 'py-4' : 'py-3'">
				{{ isSignIn ? "Don't have an account?" : 'Already have an account?' }}
				<button type="button" class="font-semibold text-coral-soft transition-colors hover:text-chalk"
					@click="mode = isSignIn ? 'signUp' : 'signIn'">
					{{ isSignIn ? 'Sign up' : 'Sign in' }}
				</button>
			</div>
		</motion.div>
	</motion.div>

	<SignUpCode v-if="displayMailCode" v-model:code="code" :email="form.email" :error="codeError" @submit="signUp"
		@resend="registerUser" @close="displayMailCode = false" />
</template>

<script setup lang="ts">
import { motion } from 'motion-v'
import type { QuickNotice } from '@/types/general'
import type { RegistrationRole } from '#shared/types'
const mode = defineModel<'signIn' | 'signUp'>('mode', { required: true })

const emit = defineEmits<{
	message: [value: QuickNotice]
	load: [value: void]
	close: [value: void]
}>()

const inputClass = computed(() =>
	`w-full rounded-lg border border-chalk/10 bg-board/60 ${isSignIn.value ? 'py-2.5' : 'py-2'} pl-10 font-sans text-sm text-chalk placeholder:text-chalk-faint/50 transition-[border-color,box-shadow] focus:border-coral-soft/60 focus:outline-none focus:ring-2 focus:ring-coral/20 focus-visible:outline-none`)

const providers = [
	{ name: 'Google', icon: 'simple-icons:google' },
	{ name: 'GitHub', icon: 'simple-icons:github' },
	{ name: 'X', icon: 'simple-icons:x' },
]

const roleOptions: { value: RegistrationRole; label: string; icon: string }[] = [
	{ value: 'student', label: 'Student', icon: 'lucide:graduation-cap' },
	{ value: 'teacher-basic', label: 'Teacher', icon: 'lucide:presentation' },
]

const isSignIn = computed(() => mode.value === 'signIn')
const form = reactive<{ name: string; email: string; password: string; role: RegistrationRole }>({ name: '', email: '', password: '', role: 'student' })
const showPassword = ref(false)
const formEl = ref<HTMLFormElement | null>(null)
const focusFirstInput = () => formEl.value?.querySelector<HTMLInputElement>('input:not([type="radio"])')?.focus()

const onSubmit = async () => {
	if (!isReady.value) return
	isSignIn.value ? await signIn() : await registerUser()
}

const onKeydown = (event: KeyboardEvent) => {
	if (event.key === 'Escape' && !displayMailCode.value) emit('close')
}

const isReady = computed(() =>
	!!form.email && !!form.password && (isSignIn.value || !!form.name)
)

const displayMailCode: Ref<boolean> = ref(false)
const code: Ref<string> = ref('')
const codeError: Ref<string> = ref('')

watch(code, () => codeError.value = '')

watch(mode, () => nextTick(focusFirstInput))

onMounted(() => {
	window.addEventListener('keydown', onKeydown)
	focusFirstInput()
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
const { $csrfFetch } = useNuxtApp()
const signIn = async () => {
	emit('load')
	try {
		await $csrfFetch('/api/auth/login', {
			method: 'POST',
			body: {
				email: form.email,
				password: form.password,
			}
		})
	} catch {
		emit('message', {
			message: 'An error occured while signing in. Please try again later.',
			type: 'error',
		})
	} finally {
		emit('load')
	}
}

const registerUser = async () => {
	emit('load')
	try {
		await $csrfFetch('/api/auth/confirmation', {
			method: 'POST',
			body: { email: form.email }
		})
		displayMailCode.value = true
		codeError.value = ''
		emit('message', {
			message: 'We have sent you a confirmation code. Please check your inbox.',
			type: 'success',
		})
	} catch {
		emit('message', {
			message: 'An error occured while signing up. Please try again later.',
			type: 'error',
		})
	} finally {
		emit('load')
	}
}

const signUp = async () => {
	emit('load')
	try {
		const response = await $csrfFetch('/api/auth/signup', {
			method: 'POST',
			body: {
				name: form.name,
				email: form.email,
				password: form.password,
				role: form.role,
				code: code.value
			}
		})
		if (response.status !== 200 || !response.body.token) {
			codeError.value = 'That code is not right. Check your inbox and try again.'
			return
		}
		displayMailCode.value = false
		emit('message', {
			message: 'Your account has been created. You will be redirected to the home page in a few seconds.',
			type: 'success',
		})
	} catch {
		emit('message', {
			message: 'An error occured while signing up. Please try again later.',
			type: 'error',
		})
	} finally {
		emit('load')
	}
}

</script>
