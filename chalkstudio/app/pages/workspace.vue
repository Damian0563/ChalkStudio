<template>
	<div class="flex min-h-screen">
		<MainNavbar :user="data?.userIdentity" :sign-out="signOut" @load='loading = !loading'
			@message="quickNotice = $event" />
		<div class="mx-auto flex min-w-0 flex-1 flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
			<Notice :message="quickNotice" />
			<Spinner :loading="loading" />
			<CreateBoardModal v-model:boardCreation="boardCreation" :create-board="createBoard"
				:access-options="accessOptions" @load='loading = !loading' @message="quickNotice = $event" />
			<BoardDetailsModal v-model:board="detailsBoard" :access-options="accessOptions"
				:format-modified-at="formatModifiedAt" />

			<header class="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 class="font-display text-2xl font-semibold tracking-tight text-chalk sm:text-3xl">
						{{ data?.isNew ? `Welcome, ${data.userIdentity.username}` : 'Your boards' }}
					</h1>
					<p class="mt-1 font-sans text-sm text-chalk-faint">
						{{ data?.isNew
							? 'Your account is ready. Create your first board to get started.'
							: 'Pick up where you left off, or start something new.' }}
					</p>
				</div>
				<div class="flex flex-col items-stretch gap-2">
					<button type="button"
						class="inline-flex items-center justify-center gap-2 rounded-lg bg-coral px-4 py-2.5 font-sans text-sm font-semibold text-board transition-colors hover:bg-coral-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40"
						@click="boardCreation = true">
						<Icon name="lucide:plus" class="h-4 w-4" aria-hidden="true" />
						Create new board
					</button>
					<button v-if="hiddenBoardCount" type="button" aria-controls="workspace-boards" :aria-expanded="boardsExpanded"
						class="inline-flex items-center justify-center gap-2 rounded-lg border border-chalk/15 px-4 py-2 font-sans text-sm font-semibold text-chalk-faint transition-colors hover:border-chalk/30 hover:text-chalk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/30"
						@click="boardsExpanded = !boardsExpanded">
						{{ boardsExpanded ? 'Show less' : `See more (${hiddenBoardCount})` }}
						<Icon name="lucide:chevron-down" class="h-4 w-4 transition-transform"
							:class="{ 'rotate-180': boardsExpanded }" aria-hidden="true" />
					</button>
				</div>
			</header>

			<ul v-if="data?.boards.length" id="workspace-boards" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				<li v-for="board in visibleBoards" :key="board.id" class="relative">
					<NuxtLink :to="`/session/${board.id}`"
						class="group flex h-full min-h-60 flex-col gap-4 rounded-2xl border border-chalk/10 bg-board-raised p-6 transition-colors hover:border-chalk/25 hover:bg-board-frame focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/30 sm:p-7">
						<div class="flex items-start gap-4">
							<span
								class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-coral/25 bg-coral/10 text-coral-soft"
								aria-hidden="true">
								<Icon name="lucide:presentation" class="h-5 w-5" />
							</span>
							<h2 class="min-w-0 flex-1 truncate pt-2.5 pr-8 font-display text-lg font-semibold text-chalk">
								{{ board.title }}
							</h2>
						</div>
						<p class="line-clamp-4 flex-1 font-sans text-sm leading-relaxed text-chalk-faint">
							{{ board.description || 'No description' }}
						</p>
						<InviteePills v-if="board.authorization === 'invite' && board.allowedUsers.length"
							:emails="board.allowedUsers" />
						<div
							class="flex items-center justify-between gap-3 border-t border-chalk/10 pt-4 font-sans text-xs text-chalk-faint/80">
							<span class="inline-flex items-center gap-1.5">
								<Icon :name="accessOf(board.authorization)?.icon ?? 'lucide:globe'" class="h-3.5 w-3.5"
									aria-hidden="true" />
								{{ accessOf(board.authorization)?.label }}
							</span>
							<span>Edited
								<time :datetime="board.modifiedAt">
									{{ formatModifiedAt(board.modifiedAt, { month: 'short', day: 'numeric', year: 'numeric' }) }}
								</time>
							</span>
						</div>
					</NuxtLink>
					<button type="button"
						class="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-lg text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/30"
						:aria-label="`Edit ${board.title}`" @click="detailsBoard = board">
						<Icon name="lucide:pencil" class="h-4 w-4" aria-hidden="true" />
					</button>
				</li>
			</ul>

			<div v-else-if="data"
				class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-chalk/15 px-6 py-16 text-center">
				<Icon name="lucide:presentation" class="h-8 w-8 text-chalk-faint/60" aria-hidden="true" />
				<p class="font-sans text-sm text-chalk-faint">You don't have any boards yet.</p>
				<button type="button" class="font-sans text-sm font-semibold text-coral-soft transition-colors hover:text-chalk"
					@click="boardCreation = true">
					Create your first board
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { BoardAccess, BoardSummary } from '#shared/types'
import type { QuickNotice } from '@/types/general'
import { useWorkspace } from '@/composables/useWorkspace'
definePageMeta({
	layout: 'main',
})
const quickNotice = ref<QuickNotice | undefined>(undefined)
const boardCreation: Ref<boolean> = ref(false)
const loading: Ref<boolean> = ref(false)
const detailsBoard: Ref<BoardSummary | null> = ref(null)

const route = useRoute()
const { $csrfFetch } = useNuxtApp()
const { accessOptions, formatModifiedAt, initWorkspace, createBoard, signOut } = useWorkspace({ fetch: useRequestFetch(), csrfFetch: $csrfFetch })
const { data, error } = await useAsyncData('workspace', () => initWorkspace(route.query.new === 'true'))
const accessOf = (access: BoardAccess) => accessOptions.find((option) => option.value === access)

const COLLAPSED_BOARDS = 3
const boardsExpanded: Ref<boolean> = ref(false)
const visibleBoards = computed(() => {
	const boards = data.value?.boards ?? []
	return boardsExpanded.value ? boards : boards.slice(0, COLLAPSED_BOARDS)
})
const hiddenBoardCount = computed(() => Math.max((data.value?.boards.length ?? 0) - COLLAPSED_BOARDS, 0))
onMounted(() => {
	if (error.value) {
		quickNotice.value = { message: "Error occured loading workspace", type: 'error' }
		setTimeout(() => navigateTo('/'), 1000)
	}
})

</script>
