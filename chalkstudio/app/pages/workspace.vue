<template>
	<div>
		<Notice :message="quickNotice" />
		<CreateBoardModal v-model:boardCreation="boardCreation" />
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

const { initWorkspace } = useWorkspace({ fetch: useRequestFetch() })
const { data, error } = await useAsyncData('workspace', () => initWorkspace())
onMounted(() => {
	if (error.value) quickNotice.value = { message: "Error occured loading workspace", type: 'error' }
})
console.log(data.value)

</script>
