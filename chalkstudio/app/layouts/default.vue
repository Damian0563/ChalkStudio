<template>
	<div class="relative min-h-screen bg-board">
		<div class="pointer-events-none fixed inset-0 chalk-grain" aria-hidden="true" />
		<Navbar @open-sign-in="authMode = 'signIn'" @open-sign-up="authMode = 'signUp'" />
		<main>
			<slot />
		</main>
		<Footer />
		<Announce v-if="message" :message="message.message" :title="message.title" :sentiment="message.sentiment"
			@close="closeAnnounce" />
		<Notice :message="noticeMsg" />
		<SignIn v-if="authMode" v-model:mode="authMode" @close="authMode = null" @error='noticeMsg = $event' />
	</div>
</template>

<script setup lang="ts">
import type { QuickNotice } from '~/types/general'
type AuthMode = 'signIn' | 'signUp' | null
const noticeMsg = ref<QuickNotice | undefined>(undefined)

const authMode = ref<AuthMode>(null)
const { message, closeAnnounce } = useAnnounce()
</script>
