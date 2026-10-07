<template>
	<div class="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-board px-4 py-16 sm:px-8">
		<div class="pointer-events-none fixed inset-0 chalk-grain" aria-hidden="true" />
		<div class="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-coral/10 blur-3xl"
			aria-hidden="true" />

		<motion.main :initial="{ opacity: 0, y: 24 }" :animate="{ opacity: 1, y: 0 }"
			:transition="{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }"
			class="relative w-full max-w-xl rounded-sm border border-chalk/10 bg-board-raised p-8 text-center shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)] sm:p-12">
			<p class="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-chalk-faint">
				Error {{ statusCode }}
			</p>

			<h1 class="relative mx-auto mt-4 inline-block font-['Caveat'] text-[clamp(5rem,18vw,8rem)] font-semibold leading-none text-chalk">
				{{ statusCode }}
				<svg class="absolute -bottom-2 left-0 w-full text-coral" viewBox="0 0 120 8" fill="none"
					xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<motion.path d="M2 6C28 2 52 2 78 4C92 5 106 4 118 2" stroke="currentColor" stroke-width="2.5"
						stroke-linecap="round" :initial="{ pathLength: 0, opacity: 0 }" :animate="{ pathLength: 1, opacity: 1 }"
						:transition="{ duration: 0.8, delay: 0.4, ease: 'easeOut' }" />
				</svg>
			</h1>

			<h2 class="mt-8 font-display text-2xl font-semibold tracking-tight text-chalk sm:text-3xl">
				{{ copy.title }}
			</h2>
			<p class="mx-auto mt-3 max-w-md font-sans text-base leading-relaxed text-chalk-faint">
				{{ copy.message }}
			</p>

			<div class="my-8 h-px w-full chalk-line opacity-40" aria-hidden="true" />

			<div class="flex flex-wrap items-center justify-center gap-4">
				<button type="button"
					class="inline-flex items-center justify-center gap-2 rounded-sm bg-coral px-6 py-3 font-sans text-sm font-semibold text-chalk transition-colors hover:bg-coral-soft"
					@click="clearError({ redirect: '/' })">
					<Icon name="lucide:house" class="h-4 w-4" aria-hidden="true" />
					Back home
				</button>
				<button v-if="!isNotFound" type="button"
					class="inline-flex items-center justify-center gap-2 rounded-sm border border-chalk/20 px-6 py-3 font-sans text-sm font-semibold text-chalk transition-colors hover:border-chalk/40 hover:bg-chalk/5"
					@click="reloadNuxtApp()">
					<Icon name="lucide:rotate-cw" class="h-4 w-4" aria-hidden="true" />
					Try again
				</button>
			</div>
		</motion.main>
	</div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v'
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const statusCode = computed(() => props.error.statusCode ?? 500)
const isNotFound = computed(() => statusCode.value === 404)

const copy = computed(() => isNotFound.value
	? {
		title: 'This page has been wiped clean',
		message: "The page you're looking for doesn't exist or may have moved. Let's get you back to familiar ground.",
	}
	: {
		title: 'Something smudged the board',
		message: 'An unexpected error occurred on our end. Try again in a moment, or head back home.',
	})

useHead({ title: () => `${statusCode.value} · ChalkStudio` })
</script>
