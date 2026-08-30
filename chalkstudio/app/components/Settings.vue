<template>
	<div v-if="!open"
		class="fixed top-4 right-4 z-10 overflow-hidden rounded-xl border border-chalk/10 bg-board-raised/92 shadow-[0_10px_36px_-10px_rgba(0,0,0,0.55)] backdrop-blur-sm">
		<div class="h-px w-full chalk-line opacity-55" aria-hidden="true" />
		<button type="button" title="Open settings"
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
			<motion.div class="flex flex-col gap-6 overflow-y-auto px-6 py-5" :initial="{ opacity: 0, y: 16 }"
				:animate="{ opacity: 1, y: 0 }" :transition="{ duration: 0.35, delay: 0.08, ease: [0.22, 1, 0.36, 1] }">
				<section>
					<p class="mb-2.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-chalk-faint">
						General
					</p>
					<div class="overflow-hidden rounded-lg border border-chalk/10">
						<label
							class="flex cursor-pointer items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-chalk/[0.03]">
							<span class="text-sm font-semibold text-chalk/90">Focus mode</span>
							<input v-model="settings.focusMode" type="checkbox" class="peer sr-only" />
							<span
								class="relative inline-flex h-6 w-11 shrink-0 rounded-full bg-chalk/[0.08] ring-1 ring-chalk/10 transition-[background-color,box-shadow] duration-200 peer-checked:bg-coral/20 peer-checked:ring-coral/35 peer-focus-visible:ring-2 peer-focus-visible:ring-coral-soft peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-board-raised peer-checked:[&>span]:translate-x-5">
								<span
									class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-chalk shadow-[0_1px_3px_rgba(0,0,0,0.35)] transition-transform duration-200 motion-reduce:transition-none"
									aria-hidden="true" />
							</span>
						</label>
					</div>
					<div class="overflow-hidden rounded-lg border border-chalk/10 mt-2">
						<label
							class="flex cursor-pointer items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-chalk/[0.03]">
							<span class="text-sm font-semibold text-chalk/90">Show user avatars on remote events</span>
							<input v-model="settings.showSprites" type="checkbox" class="peer sr-only" />
							<span
								class="relative inline-flex h-6 w-11 shrink-0 rounded-full bg-chalk/[0.08] ring-1 ring-chalk/10 transition-[background-color,box-shadow] duration-200 peer-checked:bg-coral/20 peer-checked:ring-coral/35 peer-focus-visible:ring-2 peer-focus-visible:ring-coral-soft peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-board-raised peer-checked:[&>span]:translate-x-5">
								<span
									class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-chalk shadow-[0_1px_3px_rgba(0,0,0,0.35)] transition-transform duration-200 motion-reduce:transition-none"
									aria-hidden="true" />
							</span>
						</label>
					</div>
				</section>

				<section>
					<p class="mb-2.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-chalk-faint">
						Layout
					</p>
					<div class="overflow-hidden rounded-lg border border-chalk/10">
						<label
							class="flex cursor-pointer items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-chalk/[0.03]">
							<span class="text-sm font-semibold text-chalk/90">Consolidate participants panel</span>
							<input v-model="settings.consolidateParticipantsPanel" type="checkbox" class="peer sr-only" />
							<span
								class="relative inline-flex h-6 w-11 shrink-0 rounded-full bg-chalk/[0.08] ring-1 ring-chalk/10 transition-[background-color,box-shadow] duration-200 peer-checked:bg-coral/20 peer-checked:ring-coral/35 peer-focus-visible:ring-2 peer-focus-visible:ring-coral-soft peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-board-raised peer-checked:[&>span]:translate-x-5">
								<span
									class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-chalk shadow-[0_1px_3px_rgba(0,0,0,0.35)] transition-transform duration-200 motion-reduce:transition-none"
									aria-hidden="true" />
							</span>
						</label>
					</div>
				</section>

				<section>
					<p class="mb-2.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-chalk-faint">
						Accessibility
					</p>
					<div class="overflow-hidden rounded-lg border border-chalk/10">
						<ul>
							<li v-for="shortcut in keyboardShortcuts" :key="shortcut.description"
								class="flex items-center justify-between gap-4 border-b border-chalk/10 px-4 py-3.5 last:border-b-0">
								<span class="text-sm font-semibold text-chalk/90">{{ shortcut.description }}</span>
								<span class="flex shrink-0 items-center gap-1">
									<kbd v-for="(key, index) in shortcut.keys" :key="`${shortcut.description}-${index}`"
										class="rounded border border-chalk/10 bg-chalk/[0.06] px-1.5 py-0.5 font-mono text-[0.6875rem] font-semibold text-chalk/70">
										{{ key }}
									</kbd>
								</span>
							</li>
						</ul>
					</div>
				</section>
			</motion.div>
		</motion.div>
	</motion.div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v'
import type { BoardSettings } from '~/types/board'
const settings = defineModel<BoardSettings>('settings', { required: true })
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
