<template>
	<div>
		<Notice :message="quickNotice" />
		<Spinner :loading="loading" />
		<CreateBoardModal v-model:boardCreation="boardCreation" :create-board="createBoard" @load='loading = !loading'
			@message="quickNotice = $event" />
		<button type="button" @click="boardCreation = true">
			Create new board
		</button>
	</div>
</template>

<script setup lang="ts">
import type { QuickNotice } from '@/types/general'
import { useWorkspace } from '@/composables/useWorkspace'
definePageMeta({
	layout: 'main',
})
const quickNotice = ref<QuickNotice | undefined>(undefined)
const boardCreation: Ref<boolean> = ref(false)
const loading: Ref<boolean> = ref(false)

const { $csrfFetch } = useNuxtApp()
const { initWorkspace, createBoard } = useWorkspace({ fetch: useRequestFetch(), csrfFetch: $csrfFetch })
const { data, error } = await useAsyncData('workspace', () => initWorkspace())
onMounted(() => {
	if (error.value) quickNotice.value = { message: "Error occured loading workspace", type: 'error' }
})
console.log(data.value)

</script>
