<template>
	<div>
		<h1>Workspace</h1>
		<button type="button" @click="navigateTo('/session')">New</button>
	</div>
</template>

<script setup lang="ts">
definePageMeta({
	layout: 'main',
})
</script>
