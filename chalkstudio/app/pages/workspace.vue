<template>
	<div>
		<button type="button" @click="navigateTo('/session/123')">New</button>
	</div>
</template>

<script setup lang="ts">
definePageMeta({
	layout: 'main',
})
</script>
