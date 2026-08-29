<template>
	<div class="fixed top-4 right-16 z-10 flex items-start gap-3">
		<div v-for="[id, boardUser] in visibleUsers" :key="id" class="flex w-14 flex-col items-center gap-1"
			:title="boardUser.name">
			<span class="h-8 w-8 shrink-0 overflow-hidden rounded-full"
				:style="{ boxShadow: `0 0 0 2px ${boardUser.color}, 0 0 10px rgba(245,240,232,0.35)` }">
				<img :src="userAvatarUrl" alt="" class="h-full w-full" draggable="false">
			</span>
			<span class="w-full truncate text-center text-[11px] font-semibold leading-tight text-chalk/80">
				{{ boardUser.name }}
			</span>
		</div>

		<button v-if="hiddenCount > 0" type="button" title="Show all users"
			class="flex h-11 w-10 items-center justify-center rounded-xl border border-chalk/10 bg-board-raised/92 text-xs font-semibold text-chalk shadow-[0_10px_36px_-10px_rgba(0,0,0,0.55)] backdrop-blur-sm transition-colors hover:bg-chalk/[0.06] active:bg-coral/15 active:text-coral-soft"
			:aria-label="`Show all ${users.size} users`" @click="listOpen = true">
			+{{ hiddenCount }}
		</button>
	</div>

	<motion.aside v-if="listOpen"
		class="fixed inset-y-0 right-0 z-20 flex h-screen w-64 flex-col overflow-hidden border-l border-chalk/10 bg-board-raised shadow-[0_24px_80px_-20px_rgba(0,0,0,0.65)]"
		role="dialog" aria-label="Users in session" :initial="{ x: '100%' }" :animate="{ x: 0 }"
		:transition="{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }">
		<div class="h-px w-full chalk-line opacity-55" aria-hidden="true" />

		<div class="flex items-center justify-between border-b border-chalk/10 px-4 py-3">
			<span class="font-display text-base font-semibold tracking-tight text-chalk">
				Users ({{ users.size }})
			</span>
			<button type="button"
				class="flex h-8 w-8 items-center justify-center rounded-lg text-chalk/40 transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
				aria-label="Close users list" @click="listOpen = false">
				<Icon name="lucide:x" class="h-4 w-4 shrink-0" aria-hidden="true" />
			</button>
		</div>

		<ul class="flex-1 overflow-y-auto px-3 py-2">
			<li v-for="[id, boardUser] in users" :key="id"
				class="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-chalk/[0.04]">
				<span class="h-8 w-8 shrink-0 overflow-hidden rounded-full"
					:style="{ boxShadow: `0 0 0 2px ${boardUser.color}, 0 0 10px rgba(245,240,232,0.35)` }">
					<img :src="userAvatarUrl" alt="" class="h-full w-full" draggable="false">
				</span>
				<span class="min-w-0 truncate text-sm font-semibold text-chalk/80">
					{{ boardUser.name }}<span v-if="id === mainUser" class="text-chalk/40"> (you)</span>
				</span>
			</li>
		</ul>
	</motion.aside>
</template>

<script setup lang="ts">
import { motion } from 'motion-v'
import type { BoardUser } from '~/types/board'
import userAvatarUrl from '~/assets/user-avatar.svg'
defineProps<{
	mainUser: string
}>()
const users = defineModel<Map<string, BoardUser>>('users', { required: true })
const USER_SLOT_WIDTH = 68
const RIGHT_RESERVED = 116
const TOOLBAR_HALF_WIDTH = 300
const MAX_VISIBLE_CAP = 5
const viewportWidth = ref(0)
const setViewportWidth = () => {
	viewportWidth.value = window.innerWidth
}
onMounted(() => {
	setViewportWidth()
	window.addEventListener('resize', setViewportWidth)
})

const maxVisible = computed(() => {
	const available = viewportWidth.value / 2 - TOOLBAR_HALF_WIDTH - RIGHT_RESERVED
	return Math.min(MAX_VISIBLE_CAP, Math.max(0, Math.floor(available / USER_SLOT_WIDTH)))
})

const listOpen = ref(false)
const visibleUsers = computed(() => [...users.value.entries()].slice(0, maxVisible.value))
const hiddenCount = computed(() => Math.max(0, users.value.size - maxVisible.value))
const onKeydown = (event: KeyboardEvent) => {
	if (event.key === 'Escape') listOpen.value = false
}
watch(listOpen, (isOpen) => {
	if (isOpen) {
		window.addEventListener('keydown', onKeydown)
	} else {
		window.removeEventListener('keydown', onKeydown)
	}
})

onUnmounted(() => {
	window.removeEventListener('keydown', onKeydown)
	window.removeEventListener('resize', setViewportWidth)
})
</script>
