<template>
	<div v-if="props.loading" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
		<div class="loader"></div>
	</div>
</template>

<script lang="ts" setup>
const props = defineProps<{
	loading: boolean
}>()
</script>

<style scoped>
.loader {
	width: 50px;
	height: 50px;
	border: 4px solid #e85d4c;
	border-top-color: #ff6b5b;
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}
</style>
