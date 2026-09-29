<template>
	<AnimatePresence>
		<motion.div v-if="status"
			class="fixed inset-0 z-50 flex h-full w-full items-center justify-center bg-board/80 p-4 backdrop-blur-md"
			:initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :exit="{ opacity: 0, transition: { duration: 0.2 } }"
			:transition="{ duration: 0.25 }">
			<motion.div
				class="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-xl border border-chalk/10 bg-board-raised shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)]"
				role="dialog" aria-modal="true" aria-labelledby="board-access-title" aria-describedby="board-access-message"
				:initial="{ opacity: 0, scale: 0.96, y: 20 }" :animate="{ opacity: 1, scale: 1, y: 0 }"
				:exit="{ opacity: 0, scale: 0.97, y: 10, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }"
				:transition="{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }">
				<div class="h-px w-full chalk-line opacity-55" aria-hidden="true" />

				<form class="flex flex-col" @submit.prevent="onSubmit">
					<div class="flex flex-col gap-5 px-6 pt-7 pb-6 sm:px-8">
						<div class="flex items-start gap-3.5">
							<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
								:class="content.iconClass" aria-hidden="true">
								<Icon :name="content.icon" class="h-5 w-5" />
							</span>
							<div>
								<h2 id="board-access-title" class="font-display text-xl font-semibold tracking-tight text-chalk">
									{{ content.title }}
								</h2>
								<p id="board-access-message" class="mt-1 font-sans text-sm text-chalk-faint">
									{{ content.message }}
								</p>
							</div>
						</div>

						<div v-if="picksUsername" class="flex flex-col gap-1.5">
							<label for="board-access-username" class="text-xs font-semibold text-chalk-muted">Username</label>
							<div class="relative">
								<Icon name="lucide:user"
									class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-faint/70"
									aria-hidden="true" />
								<input id="board-access-username" ref="usernameInput" v-model="username" type="text" required
									autocomplete="nickname" :maxlength="USERNAME_MAX" placeholder="How others will see you"
									class="w-full rounded-lg border border-chalk/10 bg-board/60 py-2.5 pl-10 pr-3.5 font-sans text-sm text-chalk placeholder:text-chalk-faint/50 transition-[border-color,box-shadow] focus:border-coral-soft/60 focus:outline-none focus:ring-2 focus:ring-coral/20 focus-visible:outline-none" />
							</div>
						</div>
					</div>

					<div class="flex items-center justify-end gap-2.5 border-t border-chalk/10 bg-board/40 px-6 py-4 sm:px-8">
						<NuxtLink to="/"
							class="rounded-lg px-4 py-2.5 font-sans text-sm font-semibold text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk">
							Go home
						</NuxtLink>
						<button v-if="picksUsername" type="submit" :disabled="!username.trim()"
							class="group flex items-center justify-center gap-2 rounded-lg bg-coral px-4 py-2.5 font-sans text-sm font-semibold text-chalk transition-colors hover:bg-coral-soft disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-coral">
							Join board
							<Icon name="lucide:arrow-right"
								class="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-disabled:translate-x-0 motion-reduce:transition-none"
								aria-hidden="true" />
						</button>
						<button v-else-if="status !== 403" type="button"
							class="flex items-center justify-center gap-2 rounded-lg bg-coral px-4 py-2.5 font-sans text-sm font-semibold text-chalk transition-colors hover:bg-coral-soft"
							@click="reloadNuxtApp()">
							<Icon name="lucide:rotate-cw" class="h-4 w-4 shrink-0" aria-hidden="true" />
							Try again
						</button>
					</div>
				</form>
			</motion.div>
		</motion.div>
	</AnimatePresence>
</template>

<script setup lang="ts">
import { motion, AnimatePresence } from 'motion-v'

const props = defineProps<{ status: number | undefined }>()
const emits = defineEmits<{ (e: 'join', username: string): void }>()

const USERNAME_MAX = 32
const username = ref('')
const usernameInput = ref<HTMLInputElement | null>(null)

const picksUsername = computed(() => props.status === 401 || props.status === 409)

const content = computed(() => {
	if (props.status === 401) return {
		title: 'Choose a username',
		message: 'Pick a name so others on the board know who you are.',
		icon: 'lucide:user-round-pen',
		iconClass: 'border-coral/25 bg-coral/10 text-coral-soft',
	}
	if (props.status === 409) return {
		title: 'Username taken',
		message: 'Someone on this board already goes by that name. Pick another so others can tell you apart.',
		icon: 'lucide:user-round-pen',
		iconClass: 'border-coral/25 bg-coral/10 text-coral-soft',
	}
	if (props.status === 403) return {
		title: 'No access to this board',
		message: "You don't have permission to open this board. Ask the board owner to grant you access.",
		icon: 'lucide:lock',
		iconClass: 'border-coral/25 bg-coral/10 text-coral-soft',
	}
	return {
		title: 'Something went wrong',
		message: "We couldn't open this board. Please try again later.",
		icon: 'lucide:triangle-alert',
		iconClass: 'border-chalk/15 bg-chalk/[0.06] text-chalk-muted',
	}
})

watch(picksUsername, (picks) => {
	if (picks) nextTick(() => usernameInput.value?.focus())
}, { immediate: true })

const onSubmit = () => {
	const name = username.value.trim()
	if (!picksUsername.value || !name) return
	emits('join', name)
}
</script>
