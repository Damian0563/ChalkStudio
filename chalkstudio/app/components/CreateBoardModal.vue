<template>
	<AnimatePresence>
		<motion.div v-if="boardCreation"
			class="fixed inset-0 z-50 flex h-full w-full items-center justify-center bg-board/80 p-4 backdrop-blur-md"
			:initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :exit="{ opacity: 0, transition: { duration: 0.2 } }"
			:transition="{ duration: 0.25 }" @click.self="close">
			<motion.div
				class="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-chalk/10 bg-board-raised shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)]"
				role="dialog" aria-modal="true" aria-labelledby="create-board-title"
				:initial="{ opacity: 0, scale: 0.96, y: 20 }" :animate="{ opacity: 1, scale: 1, y: 0 }"
				:exit="{ opacity: 0, scale: 0.97, y: 10, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }"
				:transition="{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }">
				<div class="h-px w-full chalk-line opacity-55" aria-hidden="true" />

				<button type="button"
					class="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-chalk/40 transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
					aria-label="Close" @click="close">
					<Icon name="lucide:x" class="h-4 w-4 shrink-0" aria-hidden="true" />
				</button>

				<form class="flex flex-col" @submit.prevent="onSubmit">
					<div class="flex flex-col gap-5 px-6 pt-7 pb-6 sm:px-8">
						<div class="flex items-start gap-3.5 pr-8">
							<span
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-coral/25 bg-coral/10 text-coral-soft"
								aria-hidden="true">
								<Icon name="lucide:presentation" class="h-5 w-5" />
							</span>
							<div>
								<h2 id="create-board-title" class="font-display text-xl font-semibold tracking-tight text-chalk">
									Create a new board
								</h2>
								<p class="mt-1 font-sans text-sm text-chalk-faint">
									Give it a name and choose who can join.
								</p>
							</div>
						</div>

						<div class="flex flex-col gap-1.5">
							<label for="board-title" class="text-xs font-semibold text-chalk-muted">Title</label>
							<div class="relative">
								<Icon name="lucide:type"
									class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-faint/70"
									aria-hidden="true" />
								<input id="board-title" ref="titleInput" v-model="form.title" type="text" required
									:maxlength="TITLE_MAX" placeholder="Algebra - quadratic equations"
									:class="[inputClass, 'pl-10 pr-3.5']" />
							</div>
						</div>

						<div class="flex flex-col gap-1.5">
							<div class="flex items-baseline justify-between">
								<label for="board-description" class="text-xs font-semibold text-chalk-muted">
									Description <span class="font-normal text-chalk-faint/70">(optional)</span>
								</label>
								<span class="font-sans text-[0.7rem] tabular-nums text-chalk-faint/60" aria-hidden="true">
									{{ form.description.length }}/{{ DESCRIPTION_MAX }}
								</span>
							</div>
							<textarea id="board-description" v-model="form.description" rows="3" :maxlength="DESCRIPTION_MAX"
								placeholder="What will this board be used for?" :class="[inputClass, 'resize-none px-3.5']" />
						</div>

						<fieldset class="flex flex-col gap-1.5">
							<legend class="mb-1.5 text-xs font-semibold text-chalk-muted">Who can join</legend>
							<div class="grid gap-2 sm:grid-cols-2">
								<label v-for="option in accessOptions" :key="option.value"
									class="flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-coral/20"
									:class="form.authorization === option.value
										? 'border-coral-soft/50 bg-coral/[0.08]'
										: 'border-chalk/10 bg-board/60 hover:border-chalk/25 hover:bg-chalk/[0.04]'">
									<input v-model="form.authorization" type="radio" name="board-access" :value="option.value"
										class="sr-only" />
									<Icon :name="option.icon" class="mt-0.5 h-4 w-4 shrink-0"
										:class="form.authorization === option.value ? 'text-coral-soft' : 'text-chalk-faint'"
										aria-hidden="true" />
									<span class="min-w-0">
										<span class="block font-sans text-sm font-semibold"
											:class="form.authorization === option.value ? 'text-chalk' : 'text-chalk/85'">
											{{ option.label }}
										</span>
										<span class="mt-0.5 block font-sans text-xs leading-snug text-chalk-faint">
											{{ option.hint }}
										</span>
									</span>
								</label>
							</div>
						</fieldset>

						<AnimatePresence>
							<motion.div v-if="form.authorization === 'invite'" class="overflow-hidden"
								:initial="{ opacity: 0, height: 0 }" :animate="{ opacity: 1, height: 'auto' }"
								:exit="{ opacity: 0, height: 0 }" :transition="{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }">
								<div class="flex flex-col gap-1.5">
									<label for="board-invite" class="text-xs font-semibold text-chalk-muted">
										Invite by email
									</label>
									<div
										class="flex min-h-[2.625rem] flex-wrap items-center gap-1.5 rounded-lg border border-chalk/10 bg-board/60 px-2 py-1.5 transition-[border-color,box-shadow] focus-within:border-coral-soft/60 focus-within:ring-2 focus-within:ring-coral/20">
										<span v-for="email in form.allowedUsers" :key="email"
											class="flex items-center gap-1 rounded-md bg-chalk/[0.08] py-0.5 pl-2 pr-1 font-sans text-xs text-chalk">
											{{ email }}
											<button type="button"
												class="flex h-4 w-4 items-center justify-center rounded text-chalk-faint transition-colors hover:bg-chalk/10 hover:text-chalk"
												:aria-label="`Remove ${email}`" @click="removeInvite(email)">
												<Icon name="lucide:x" class="h-3 w-3" aria-hidden="true" />
											</button>
										</span>
										<input id="board-invite" v-model="inviteDraft" type="email" multiple autocomplete="off"
											:placeholder="form.allowedUsers.length ? '' : 'name@school.edu, then Enter'"
											class="min-w-[10rem] flex-1 bg-transparent px-1.5 py-1 font-sans text-sm text-chalk placeholder:text-chalk-faint/50 focus:outline-none"
											aria-describedby="board-invite-hint" @keydown="onInviteKeydown" @blur="addInvites" />
									</div>
									<p id="board-invite-hint" class="font-sans text-xs"
										:class="inviteError ? 'text-coral-soft' : 'text-chalk-faint/70'">
										{{ inviteError || 'Press Enter or comma to add each address.' }}
									</p>
								</div>
							</motion.div>
						</AnimatePresence>
					</div>

					<div class="flex items-center justify-end gap-2.5 border-t border-chalk/10 bg-board/40 px-6 py-4 sm:px-8">
						<button type="button"
							class="rounded-lg px-4 py-2.5 font-sans text-sm font-semibold text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
							@click="close">
							Cancel
						</button>
						<button type="submit" :disabled="!isReady"
							class="group flex items-center justify-center gap-2 rounded-lg bg-coral px-4 py-2.5 font-sans text-sm font-semibold text-chalk transition-colors hover:bg-coral-soft disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-coral">
							Create board
							<Icon name="lucide:arrow-right"
								class="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-disabled:translate-x-0 motion-reduce:transition-none"
								aria-hidden="true" />
						</button>
					</div>
				</form>
			</motion.div>
		</motion.div>
	</AnimatePresence>
</template>

<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'
import { motion, AnimatePresence } from 'motion-v'
import type { BoardAccess, BoardCreationPayload } from '#shared/types'
const boardCreation = defineModel<boolean>('boardCreation', { required: true })

const TITLE_MAX = 80
const DESCRIPTION_MAX = 280
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const inputClass = 'w-full rounded-lg border border-chalk/10 bg-board/60 py-2.5 font-sans text-sm text-chalk placeholder:text-chalk-faint/50 transition-[border-color,box-shadow] focus:border-coral-soft/60 focus:outline-none focus:ring-2 focus:ring-coral/20 focus-visible:outline-none'

const accessOptions: { value: BoardAccess; label: string; hint: string; icon: string }[] = [
	{ value: 'public', label: 'Public', hint: 'Anyone can join, even without an account.', icon: 'lucide:globe' },
	{ value: 'link', label: 'Anyone with the link', hint: 'Signed-in users who have the link.', icon: 'lucide:link' },
	{ value: 'invite', label: 'Invite only', hint: 'Only the people you add by email.', icon: 'lucide:user-plus' },
	{ value: 'private', label: 'Private', hint: 'Just you.', icon: 'lucide:lock' },
]

const emptyForm = (): BoardCreationPayload => ({
	title: '',
	description: '',
	authorization: 'public',
	allowedUsers: [],
})

const form = reactive<BoardCreationPayload>(emptyForm())
const inviteDraft = ref('')
const inviteError = ref('')
const titleInput = ref<HTMLInputElement | null>(null)

const isReady = computed(() =>
	!!form.title.trim() && (form.authorization !== 'invite' || form.allowedUsers.length > 0 || !!inviteDraft.value.trim())
)

const addInvites = () => {
	const entries = inviteDraft.value.split(/[\s,;]+/).map((entry) => entry.toLowerCase()).filter(Boolean)
	const invalid = entries.filter((entry) => !EMAIL_PATTERN.test(entry))
	for (const email of entries) {
		if (EMAIL_PATTERN.test(email) && !form.allowedUsers.includes(email)) form.allowedUsers.push(email)
	}
	inviteDraft.value = invalid.join(', ')
	inviteError.value = invalid.length ? `${invalid.join(', ')} ${invalid.length > 1 ? "aren't valid emails" : "isn't a valid email"}.` : ''
}

const removeInvite = (email: string) => {
	form.allowedUsers = form.allowedUsers.filter((entry) => entry !== email)
}

const onInviteKeydown = (event: KeyboardEvent) => {
	if (event.key === 'Enter' || event.key === ',') {
		event.preventDefault()
		addInvites()
	} else if (event.key === 'Backspace' && !inviteDraft.value) {
		form.allowedUsers.pop()
	}
}

watch(inviteDraft, (draft) => {
	if (!draft) inviteError.value = ''
})

watch(boardCreation, (open) => {
	if (!open) return
	Object.assign(form, emptyForm())
	inviteDraft.value = ''
	inviteError.value = ''
	nextTick(() => titleInput.value?.focus())
})

onKeyStroke('Escape', () => {
	if (boardCreation.value) close()
})

const close = () => {
	boardCreation.value = false
}

const onSubmit = () => {
	if (form.authorization === 'invite') addInvites()
	if (!isReady.value || inviteError.value) return
	createNewBoard()
}

const createNewBoard = () => {
	//do some work
	navigateTo(`/session/${uuidv4()}`)
}
</script>
