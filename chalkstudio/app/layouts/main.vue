<template>
	<div class="flex min-h-screen overflow-x-hidden bg-board">
		<MainNavbar />
		<Spinner :loading="pending" />
		<main class="min-w-0 flex-1">
			<slot @loading="pending = !pending" />
		</main>
	</div>
</template>
<script setup lang="ts">
const pending: Ref<boolean> = ref(false)

</script>
