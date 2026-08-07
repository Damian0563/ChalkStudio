<template>
	<footer class="relative overflow-x-hidden border-t border-chalk/10 bg-board-raised w-full" role="contentinfo">
		<div class="h-px w-full chalk-line opacity-60" aria-hidden="true" />
		<div class="mx-auto w-full px-5 py-12 sm:px-8 sm:py-16">
			<div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.15fr_repeat(3,minmax(0,1fr))] lg:gap-14">
				<div class="sm:col-span-2 lg:col-span-1">
					<NuxtLink to="/" class="group inline-flex items-center gap-3 rounded-sm focus-visible:outline-offset-4"
						aria-label="ChalkStudio home">
						<img src="~/assets/logo.webp" alt=""
							class="h-8 w-auto transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
							decoding="async" />
						<span class="font-display text-lg font-semibold tracking-tight text-chalk">
							Chalk<span class="font-normal text-chalk-muted">Studio</span>
						</span>
					</NuxtLink>
					<p class="mt-4 max-w-xs font-sans text-sm leading-relaxed text-chalk-faint">
						Lesson planning, assignments, and progress in one calm workspace — built with teachers, for classrooms.
					</p>
				</div>

				<nav v-for="section in footerSections" :key="section.title" :aria-label="section.title">
					<h2 class="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-chalk-muted">
						{{ section.title }}
					</h2>
					<ul class="mt-4 space-y-2.5">
						<li v-for="link in section.links" :key="link.href">
							<a :href="link.href" class="font-sans text-sm text-chalk-faint transition-colors hover:text-chalk">
								{{ link.label }}
							</a>
						</li>
					</ul>
				</nav>
			</div>

			<div
				class="mt-12 flex flex-col gap-6 border-t border-chalk/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
				<p class="font-sans text-xs text-chalk-faint">
					&copy; {{ year }} ChalkStudio. All rights reserved.
				</p>

				<div class="flex flex-wrap items-center gap-x-6 gap-y-2">
					<a v-for="link in legalLinks" :key="link.href" :href="link.href"
						class="font-sans text-xs text-chalk-faint transition-colors hover:text-chalk">
						{{ link.label }}
					</a>
				</div>
			</div>
		</div>
	</footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()

const footerSections = [
	{
		title: 'Product',
		links: [
			{ label: 'Features', href: '#product' },
			{ label: 'For schools', href: '#schools' },
			{ label: 'Pricing', href: '#pricing' },
			{ label: 'Changelog', href: '#changelog' },
		],
	},
	{
		title: 'Resources',
		links: [
			{ label: 'Documentation', href: '#docs' },
			{ label: 'Help center', href: '#help' },
			{ label: 'Blog', href: '#blog' },
			{ label: 'Contact', href: '#contact' },
		],
	},
	{
		title: 'Company',
		links: [
			{ label: 'About', href: '#about' },
			{ label: 'Careers', href: '#careers' },
			{ label: 'Privacy', href: '#privacy' },
			{ label: 'Terms', href: '#terms' },
		],
	},
]

const legalLinks = [
	{ label: 'Privacy', href: '#privacy' },
	{ label: 'Terms', href: '#terms' },
	{ label: 'Cookies', href: '#cookies' },
]
</script>
