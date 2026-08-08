<template>
	<div class="relative min-h-screen bg-board">
		<div class="pointer-events-none fixed inset-0 chalk-grain" aria-hidden="true" />
		<Navbar @open-sign-in="authMode = 'signIn'" @open-sign-up="authMode = 'signUp'" />
		<main>
			<slot />
		</main>
		<Footer />
		<SignIn v-if="authMode" :mode="authMode" @close="authMode = null" />
	</div>
</template>

<script setup lang="ts">
type AuthMode = 'signIn' | 'signUp' | null

const authMode = ref<AuthMode>(null)
</script>
