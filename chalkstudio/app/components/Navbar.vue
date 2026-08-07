<template>
	<header class="fixed inset-x-0 top-0 z-50 border-b border-chalk/10 bg-board/80 backdrop-blur-md" role="banner">
		<div class="mx-auto flex h-16 w-full items-center justify-between gap-6 px-5 sm:px-8">
			<NuxtLink to="/" class="group flex shrink-0 items-center gap-3 rounded-sm focus-visible:outline-offset-4"
				aria-label="ChalkStudio home">
				<img src="~/assets/logo.webp" alt="logo"
					class="h-9 w-auto transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
					decoding="async" />
				<span class="font-display text-lg font-semibold tracking-tight text-chalk sm:text-xl">
					Chalk<span class="text-chalk-muted font-normal">Studio</span>
				</span>
			</NuxtLink>

			<nav class="hidden items-center gap-8 md:flex" aria-label="Primary">
				<a v-for="link in navLinks" :key="link.href" :href="link.href"
					class="font-sans text-sm font-medium uppercase tracking-[0.14em] text-chalk-faint transition-colors hover:text-chalk">
					{{ link.label }}
				</a>
			</nav>

			<div class="flex items-center gap-3">
				<a href="#contact"
					class="hidden font-sans text-sm font-medium text-chalk-muted transition-colors hover:text-chalk sm:inline">
					Sign in
				</a>
				<a href="#contact"
					class="rounded-sm border border-chalk/25 px-4 py-2 font-sans text-sm font-semibold text-chalk transition-colors hover:border-chalk/50 hover:bg-chalk/5">
					Try for free
				</a>

				<button type="button"
					class="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-chalk/15 text-chalk md:hidden"
					:aria-expanded="menuOpen" aria-controls="mobile-nav" aria-label="Open menu" @click="menuOpen = !menuOpen">
					<svg v-if="!menuOpen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
						stroke-width="1.75" class="h-5 w-5" aria-hidden="true">
						<path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16" />
					</svg>
					<svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
						stroke-width="1.75" class="h-5 w-5" aria-hidden="true">
						<path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" />
					</svg>
				</button>
			</div>
		</div>

		<div class="h-px w-full chalk-line opacity-60" aria-hidden="true" />

		<nav v-show="menuOpen" id="mobile-nav" class="border-b border-chalk/10 bg-board-raised px-5 py-4 md:hidden"
			aria-label="Mobile primary">
			<ul class="flex flex-col gap-1">
				<li v-for="link in navLinks" :key="link.href">
					<a :href="link.href"
						class="block rounded-sm px-2 py-3 font-sans text-sm font-medium uppercase tracking-[0.12em] text-chalk-faint transition-colors hover:text-chalk"
						@click="menuOpen = false">
						{{ link.label }}
					</a>
				</li>
				<li class="mt-2 border-t border-chalk/10 pt-3">
					<a href="#contact" class="block px-2 py-2 font-sans text-sm text-chalk-muted" @click="menuOpen = false">
						Sign in
					</a>
				</li>
			</ul>
		</nav>
	</header>
</template>

<script setup lang="ts">
const menuOpen = ref(false)

const navLinks = [
	{ label: 'Product', href: '#product' },
	{ label: 'For schools', href: '#schools' },
	{ label: 'Pricing', href: '#pricing' },
]
</script>
