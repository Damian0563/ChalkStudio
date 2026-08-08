<template>
	<div class="overflow-x-hidden w-full">
		<section
			class="relative mx-auto flex min-h-screen w-full flex-col justify-center px-3 pb-16 pt-24 sm:px-8 lg:pt-28">
			<div class="grid items-center gap-16 lg:grid-cols-[1fr_auto]">
				<div class="max-w-4xl">
					<motion.p :initial="{ opacity: 0, y: 16 }" :animate="{ opacity: 1, y: 0 }"
						:transition="{ duration: 0.5, delay: 0.1 }"
						class="mb-6 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-chalk-faint">
						Software built for educators
					</motion.p>
					<motion.h1 :initial="{ opacity: 0, y: 24 }" :animate="{ opacity: 1, y: 0 }"
						:transition="{ duration: 0.6, delay: 0.3 }"
						class="font-display text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[1.08] tracking-tight text-chalk">
						Learning is a
						<span class="relative inline-block text-coral">
							journey
							<svg class="absolute -bottom-1 left-0 w-full text-chalk" viewBox="0 0 120 8" fill="none"
								xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
								<motion.path d="M2 6C28 2 52 2 78 4C92 5 106 4 118 2" stroke="currentColor" stroke-width="2.5"
									stroke-linecap="round" :initial="{ pathLength: 0, opacity: 0 }"
									:animate="{ pathLength: 1, opacity: 1 }"
									:transition="{ duration: 0.8, delay: 0.9, ease: 'easeOut' }" />
							</svg>
						</span>.
						<span class="mt-3 block text-[0.72em] font-normal leading-snug text-chalk-muted">
							Don't make it harder with tedious software that does not understand your needs.
						</span>
					</motion.h1>
					<motion.p :initial="{ opacity: 0, y: 20 }" :animate="{ opacity: 1, y: 0 }"
						:transition="{ duration: 0.55, delay: 0.55 }"
						class="mt-8 max-w-lg font-sans text-lg leading-relaxed text-chalk-faint">
						ChalkStudio keeps lesson planning, assignments, and progress in one calm workspace — so teachers can focus
						on students, not systems.
					</motion.p>

					<motion.div :initial="{ opacity: 0, y: 20 }" :animate="{ opacity: 1, y: 0 }"
						:transition="{ duration: 0.5, delay: 0.75 }" class="mt-10 flex flex-wrap items-center gap-4">
						<a href="#contact"
							class="inline-flex items-center justify-center rounded-sm bg-coral px-6 py-3 font-sans text-sm font-semibold text-chalk transition-colors hover:bg-coral-soft">
							See how it works
						</a>
						<a href="#pricing"
							class="inline-flex items-center justify-center rounded-sm border border-chalk/20 px-6 py-3 font-sans text-sm font-semibold text-chalk transition-colors hover:border-chalk/40 hover:bg-chalk/5">
							View pricing
						</a>
					</motion.div>
				</div>

				<motion.div :initial="{ opacity: 0, scale: 0.94, y: 40 }" :animate="{ opacity: 1, scale: 1, y: 0 }"
					:transition="{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }" class="relative mx-auto lg:mx-0">
					<div class="absolute inset-6 rounded-full bg-coral/10 blur-3xl" aria-hidden="true" />
					<div
						class="relative rounded-sm border border-chalk/10 bg-board-raised p-8 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)]">
						<img loading="lazy" src="~/assets/logo.webp" alt="ChalkStudio mark" class="mx-auto h-36 w-auto sm:h-44"
							decoding="async" />
						<p class="mt-6 text-center font-sans text-xs uppercase tracking-[0.18em] text-chalk-faint">
							Est. for classrooms
						</p>
					</div>
				</motion.div>
			</div>

			<motion.ul :initial="'hidden'" animate="visible"
				class="mt-20 grid gap-6 border-t border-chalk/10 pt-10 sm:grid-cols-3" aria-label="Product highlights">
				<motion.li v-for="(item, i) in highlights" :key="item.label" :custom="i" :variants="highlightVariants">
					<p class="font-display text-2xl font-semibold text-chalk">{{ item.stat }}</p>
					<p class="mt-1 font-sans text-sm leading-relaxed text-chalk-faint">{{ item.label }}</p>
				</motion.li>
			</motion.ul>
		</section>
	</div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v'
const highlights = [
	{ stat: 'One workspace', label: 'Plans, assignments, and feedback without switching tabs.' },
	{ stat: 'Built for teachers', label: 'Flows shaped by real classroom routines, not enterprise checklists.' },
	{ stat: 'Ready in minutes', label: 'Import a class and start — no week-long onboarding.' },
]

const highlightVariants = {
	hidden: { opacity: 0, y: 16 },
	visible: (custom: unknown) => ({
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.5,
			delay: 1.1 + Number(custom) * 0.15,
		},
	}),
}
</script>
