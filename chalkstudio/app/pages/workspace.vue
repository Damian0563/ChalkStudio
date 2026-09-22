<template>
	<div>
		<button type="button" @click="navigateTo('/session/123')">New</button>
	</div>
</template>

<script setup lang="ts">
import type { QuickNotice } from '@/types/general'
import { useWorkspace } from '@/composables/useWorkspace'
definePageMeta({
	layout: 'main',
})
const emits = defineEmits<{
	(e: 'loading'): void
	(e: 'message', notice: QuickNotice): void
}>()

const { initWorkspace } = useWorkspace()
const { data, error } = await useAsyncData('workspace', () => initWorkspace())
if (error) emits('message', { message: "Error occured loading workspace", type: 'error' })
console.log(data.value)

</script>
