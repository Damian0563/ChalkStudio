<template>
	<ProfileSettings v-if="user" v-model:show="showProfileDetails" :user="user" :role-label="roleLabels[user.role]"
		@sign-out="callSignOut" />
	<aside
		class="sticky top-0 flex shrink-0 flex-col bg-board h-screen overflow-hidden shadow-md border-r border-chalk/10 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
		:class="collapsed ? 'w-16' : 'w-64'">
		<div class="flex items-center gap-2 border-b border-chalk/10 px-4 py-3"
			:class="collapsed ? 'justify-center' : 'justify-between'">
			<span v-if="!collapsed" class="truncate font-display text-base font-semibold tracking-tight text-chalk">
				Chalk Studio
			</span>
			<button type="button"
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-chalk/40 transition-colors hover:bg-chalk/[0.06] hover:text-chalk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/30"
				:aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
				:title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'" :aria-expanded="!collapsed"
				@click="collapsed = !collapsed">
				<Icon :name="collapsed ? 'lucide:panel-left-open' : 'lucide:panel-left-close'" class="h-4 w-4 shrink-0"
					aria-hidden="true" />
			</button>
		</div>
		<div class="flex-1" />
		<div v-if="user" class="border-t border-chalk/10 p-2" @click="showProfileDetails = true">
			<button type="button"
				class="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-chalk/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/30"
				:title="collapsed ? user.username : undefined">
				<span
					class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-chalk font-sans text-sm font-semibold text-board"
					aria-hidden="true">
					{{ initial }}
				</span>
				<span v-if="!collapsed" class="flex min-w-0 flex-1 flex-col">
					<span class="truncate font-sans text-sm font-medium text-chalk" :title="user.username">
						{{ user.username }}
					</span>
					<span class="truncate font-sans text-xs text-chalk-faint">
						{{ roleLabels[user.role] }}
					</span>
				</span>
				<Icon v-if="!collapsed" name="lucide:chevron-down"
					class="h-4 w-4 shrink-0 text-chalk-faint transition-colors group-hover:text-chalk" aria-hidden="true" />
			</button>
		</div>

	</aside>
</template>


<script setup lang="ts">
import type { UserIdentity } from '~~/shared/types';
import type { QuickNotice } from '@/types/general';
const props = defineProps<{
	user: UserIdentity | undefined
	signOut: () => Promise<void>
}>()
const emit = defineEmits<{ (e: 'load'): void, (e: 'message', message: QuickNotice): void }>()
const showProfileDetails: Ref<boolean> = ref(false)

const roleLabels: Record<UserIdentity['role'], string> = {
	'student': 'Student',
	'teacher-basic': 'Teacher',
	'teacher-pro': 'Teacher · Pro',
	'teacher-ultra': 'Teacher · Ultra',
	'admin': 'Admin',
}

const collapsed = useCookie<boolean>('sidebar-collapsed', {
	default: () => false,
	maxAge: 60 * 60 * 24 * 365,
	sameSite: 'lax',
})

const initial = computed(() => props.user?.username.trim().charAt(0).toUpperCase() ?? '')


const callSignOut = async () => {
	emit('load')
	try {
		await props.signOut()
	} catch {
		emit('message', { message: 'Error occured while signing out', type: 'error' })
	} finally {
		emit('load')
	}
}
</script>
