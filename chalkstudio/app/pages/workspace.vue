<template>
	<div class="mx-auto flex w-full flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
		<Notice :message="quickNotice" />
		<Spinner :loading="loading" />
		<CreateBoardModal v-model:boardCreation="boardCreation" :create-board="createBoard" :access-options="accessOptions"
			@load='loading = !loading' @message="quickNotice = $event" />

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
			<button type="button"
				class="inline-flex items-center gap-2 rounded-lg bg-coral px-4 py-2.5 font-sans text-sm font-semibold text-board transition-colors hover:bg-coral-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40"
				@click="boardCreation = true">
				<Icon name="lucide:plus" class="h-4 w-4" aria-hidden="true" />
				Create new board
			</button>
		</header>

		<ul v-if="data?.boards.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<li v-for="board in data.boards" :key="board.id">
				<NuxtLink :to="`/session/${board.id}`"
					class="group flex h-full flex-col gap-3 rounded-xl border border-chalk/10 bg-board-raised p-5 transition-colors hover:border-chalk/25 hover:bg-board-frame focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/30">
					<div class="flex items-start gap-3">
						<span
							class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-coral/25 bg-coral/10 text-coral-soft"
							aria-hidden="true">
							<Icon name="lucide:presentation" class="h-4 w-4" />
						</span>
						<h2 class="min-w-0 flex-1 truncate pt-1.5 font-display text-base font-semibold text-chalk">
							{{ board.title }}
						</h2>
					</div>
					<p class="line-clamp-2 flex-1 font-sans text-sm text-chalk-faint">
						{{ board.description || 'No description' }}
					</p>
					<div class="flex items-center justify-between gap-3 font-sans text-xs text-chalk-faint/80">
						<span class="inline-flex items-center gap-1.5">
							<Icon :name="accessOf(board.authorization)?.icon ?? 'lucide:globe'" class="h-3.5 w-3.5"
								aria-hidden="true" />
							{{ accessOf(board.authorization)?.label }}
						</span>
						<span>Edited
							<NuxtTime :datetime="board.modifiedAt" month="short" day="numeric" year="numeric" />
						</span>
					</div>
				</NuxtLink>
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
</template>

<script setup lang="ts">
import type { BoardAccess } from '#shared/types'
import type { QuickNotice } from '@/types/general'
import { useWorkspace } from '@/composables/useWorkspace'
definePageMeta({
	layout: 'main',
})
const quickNotice = ref<QuickNotice | undefined>(undefined)
const boardCreation: Ref<boolean> = ref(false)
const loading: Ref<boolean> = ref(false)

const route = useRoute()
const { $csrfFetch } = useNuxtApp()
const { accessOptions, initWorkspace, createBoard } = useWorkspace({ fetch: useRequestFetch(), csrfFetch: $csrfFetch })
const { data, error } = await useAsyncData('workspace', () => initWorkspace(route.query.new === 'true'))
const accessOf = (access: BoardAccess) => accessOptions.find((option) => option.value === access)
onMounted(() => {
	if (error.value) quickNotice.value = { message: "Error occured loading workspace", type: 'error' }
})

</script>
