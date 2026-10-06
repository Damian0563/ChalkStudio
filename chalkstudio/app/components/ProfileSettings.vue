<template>
	<AnimatePresence>
		<motion.div v-if="show"
			class="fixed inset-0 z-50 flex h-full w-full items-center justify-center bg-board/80 p-4 backdrop-blur-md"
			:initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :exit="{ opacity: 0, transition: { duration: 0.2 } }"
			:transition="{ duration: 0.25 }" @click.self="close">
			<motion.div
				class="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-chalk/10 bg-board-raised shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)]"
				role="dialog" aria-modal="true" aria-labelledby="profile-settings-title"
				:initial="{ opacity: 0, scale: 0.96, y: 20 }" :animate="{ opacity: 1, scale: 1, y: 0 }"
				:exit="{ opacity: 0, scale: 0.97, y: 10, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }"
				:transition="{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }">
				<div class="h-px w-full shrink-0 chalk-line opacity-55" aria-hidden="true" />

				<button ref="closeButton" type="button"
					class="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-chalk/40 transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
					aria-label="Close" @click="close">
					<Icon name="lucide:x" class="h-4 w-4 shrink-0" aria-hidden="true" />
				</button>

				<div class="flex min-h-0 flex-1 flex-col sm:min-h-[24rem] sm:flex-row">

					<nav aria-label="Settings sections"
						class="flex shrink-0 flex-col gap-3 border-b border-chalk/10 bg-board/40 p-3 sm:w-52 sm:border-r sm:border-b-0 sm:pt-7">
						<p class="px-2.5 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-chalk-faint">
							Settings
						</p>
						<ul class="flex gap-1 sm:flex-col">
							<li>
								<button type="button" value="General"
									class="group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left font-sans text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/30"
									:class="tab === 'General' ? 'bg-chalk/[0.08] text-chalk' : 'text-chalk-faint hover:bg-chalk/[0.04] hover:text-chalk'"
									:aria-current="tab === 'General' ? 'true' : undefined" @click="tab = 'General'">
									<span v-if="tab === 'General'"
										class="absolute inset-y-1.5 left-0 hidden w-0.5 rounded-full bg-coral sm:block"
										aria-hidden="true" />
									<Icon name="lucide:user-round" class="h-4 w-4 shrink-0 transition-colors"
										:class="tab === 'General' ? 'text-coral-soft' : 'text-chalk-faint group-hover:text-chalk'"
										aria-hidden="true" />
									General
								</button>
							</li>
						</ul>
						<div class="border-t border-chalk/10 pt-3 sm:mt-auto">
							<button type="button" value="Sign out" @click="$emit('sign-out')"
								class="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left font-sans text-sm font-medium transition-colors hover:bg-coral/10 hover:text-coral-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/30">
								<Icon name="lucide:log-out" class="h-4 w-4 shrink-0 text-chalk-faint transition-colors text-coral-soft"
									aria-hidden="true" />
								Sign out
							</button>
						</div>
					</nav>
					<div class="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto px-6 pt-7 pb-6 sm:px-8">
						<template v-if="tab === 'General'">
							<div class="flex items-center gap-4 pr-8">
								<span
									class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-chalk font-sans text-xl font-semibold text-board"
									aria-hidden="true">
									{{ initial }}
								</span>
								<div class="min-w-0 justify-between">
									<h2 id="profile-settings-title"
										class="truncate font-display text-xl font-semibold tracking-tight text-chalk"
										:title="user.username">
										{{ user.username }}
									</h2>
									<span
										class="mt-1 inline-flex items-center rounded-md border border-coral/25 bg-coral/10 px-2 py-0.5 font-sans text-xs font-medium text-coral-soft">
										{{ roleLabel }}
									</span>
								</div>
							</div>

							<dl class="grid grid-cols-2 gap-x-8 gap-y-5 font-sans text-sm sm:grid-cols-3">
								<div class="flex flex-col gap-1.5">
									<dt class="text-xs font-semibold text-chalk-muted">Username</dt>
									<dd class="break-words text-chalk">{{ user.username }}</dd>
								</div>
								<div class="flex flex-col gap-1.5">
									<dt class="text-xs font-semibold text-chalk-muted">Role</dt>
									<dd class="text-chalk">{{ roleLabel }}</dd>
								</div>
							</dl>
						</template>
					</div>
				</div>
			</motion.div>
		</motion.div>
	</AnimatePresence>
</template>

<script setup lang="ts">
import { motion, AnimatePresence } from 'motion-v'
import type { UserIdentity } from '#shared/types'
const show = defineModel<boolean>('show', { required: true })
const props = defineProps<{ user: UserIdentity; roleLabel: string }>()
const emit = defineEmits<{ (e: 'sign-out'): void }>()
const closeButton = useTemplateRef<HTMLButtonElement>('closeButton')
const initial = computed(() => props.user.username.trim().charAt(0).toUpperCase())
const tab: Ref<string> = ref('General')

watch(show, (open) => {
	if (open) nextTick(() => closeButton.value?.focus())
})

onKeyStroke('Escape', () => {
	if (show.value) close()
})

const close = () => {
	show.value = false
}
</script>
