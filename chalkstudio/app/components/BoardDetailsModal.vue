<template>
	<AnimatePresence>
		<motion.div v-if="board"
			class="fixed inset-0 z-50 flex h-full w-full items-center justify-center bg-board/80 p-4 backdrop-blur-md"
			:initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :exit="{ opacity: 0, transition: { duration: 0.2 } }"
			:transition="{ duration: 0.25 }" @click.self="close">
			<motion.div
				class="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-chalk/10 bg-board-raised shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)]"
				role="dialog" aria-modal="true" aria-labelledby="board-details-title"
				:initial="{ opacity: 0, scale: 0.96, y: 20 }" :animate="{ opacity: 1, scale: 1, y: 0 }"
				:exit="{ opacity: 0, scale: 0.97, y: 10, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }"
				:transition="{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }">
				<div class="h-px w-full chalk-line opacity-55" aria-hidden="true" />

				<button ref="closeButton" type="button"
					class="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-chalk/40 transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
					aria-label="Close" @click="close">
					<Icon name="lucide:x" class="h-4 w-4 shrink-0" aria-hidden="true" />
				</button>

				<div class="flex flex-col gap-6 px-6 pt-7 pb-6 sm:px-8">
					<div class="flex items-start gap-3.5 pr-8">
						<span
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-coral/25 bg-coral/10 text-coral-soft"
							aria-hidden="true">
							<Icon name="lucide:presentation" class="h-5 w-5" />
						</span>
						<div class="min-w-0">
							<h2 id="board-details-title"
								class="break-words font-display text-xl font-semibold tracking-tight text-chalk">
								{{ board.title }}
							</h2>
							<p class="mt-1 font-sans text-sm text-chalk-faint">
								Edited
								<time :datetime="board.modifiedAt">{{ formatModifiedAt(board.modifiedAt, modifiedAtFormat) }}</time>
							</p>
						</div>
					</div>

					<dl class="flex flex-col gap-5 font-sans text-sm">
						<div class="flex flex-col gap-1.5">
							<dt class="text-xs font-semibold text-chalk-muted">Description</dt>
							<dd class="whitespace-pre-line break-words leading-relaxed"
								:class="board.description ? 'text-chalk' : 'text-chalk-faint'">
								{{ board.description || 'No description' }}
							</dd>
						</div>

						<div class="flex flex-col gap-1.5">
							<dt class="text-xs font-semibold text-chalk-muted">Access</dt>
							<dd class="flex items-start gap-2.5">
								<Icon :name="access?.icon ?? 'lucide:globe'" class="mt-0.5 h-4 w-4 shrink-0 text-chalk-faint"
									aria-hidden="true" />
								<div>
									<p class="text-chalk">{{ access?.label }}</p>
									<p class="text-xs text-chalk-faint">{{ access?.hint }}</p>
								</div>
							</dd>
						</div>

						<div v-if="board.authorization === 'invite'" class="flex flex-col gap-1.5">
							<dt class="text-xs font-semibold text-chalk-muted">
								Invitees <span class="font-normal text-chalk-faint/70">({{ board.allowedUsers.length }})</span>
							</dt>
							<dd>
								<ul class="flex flex-wrap gap-1.5">
									<li v-for="email in board.allowedUsers" :key="email"
										class="max-w-full truncate rounded-md bg-chalk/[0.08] px-2 py-0.5 text-xs text-chalk">
										{{ email }}
									</li>
								</ul>
							</dd>
						</div>

						<div class="flex flex-col gap-1.5">
							<dt class="text-xs font-semibold text-chalk-muted">Board link</dt>
							<dd class="flex items-center gap-2">
								<code
									class="min-w-0 flex-1 truncate rounded-lg border border-chalk/10 bg-board/60 px-3 py-2 text-xs text-chalk-faint">
									{{ boardUrl }}
								</code>
								<button type="button"
									class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
									:aria-label="copied ? 'Link copied' : 'Copy link'" @click="copy(boardUrl)">
									<Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="h-4 w-4" aria-hidden="true" />
								</button>
							</dd>
						</div>
					</dl>
				</div>

				<div class="flex items-center justify-end gap-2.5 border-t border-chalk/10 bg-board/40 px-6 py-4 sm:px-8">
					<button type="button"
						class="rounded-lg px-4 py-2.5 font-sans text-sm font-semibold text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
						@click="close">
						Close
					</button>
					<NuxtLink :to="`/session/${board.id}`"
						class="group flex items-center justify-center gap-2 rounded-lg bg-coral px-4 py-2.5 font-sans text-sm font-semibold text-chalk transition-colors hover:bg-coral-soft">
						Open board
						<Icon name="lucide:arrow-right"
							class="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
							aria-hidden="true" />
					</NuxtLink>
				</div>
			</motion.div>
		</motion.div>
	</AnimatePresence>
</template>

<script setup lang="ts">
import { motion, AnimatePresence } from 'motion-v'
import type { BoardSummary } from '#shared/types'
import type { AccessOption, FormatModifiedAt } from '@/composables/useWorkspace'
const board = defineModel<BoardSummary | null>('board', { required: true })

const props = defineProps<{ accessOptions: AccessOption[]; formatModifiedAt: FormatModifiedAt }>()

const modifiedAtFormat: Intl.DateTimeFormatOptions = {
	month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
}

const closeButton = useTemplateRef<HTMLButtonElement>('closeButton')
const requestUrl = useRequestURL()
const { copy, copied } = useClipboard({ legacy: true })

const access = computed(() => props.accessOptions.find((option) => option.value === board.value?.authorization))
const boardUrl = computed(() => `${requestUrl.origin}/session/${board.value?.id}`)

watch(board, (open) => {
	if (open) nextTick(() => closeButton.value?.focus())
})

onKeyStroke('Escape', () => {
	if (board.value) close()
})

const close = () => {
	board.value = null
}
</script>
