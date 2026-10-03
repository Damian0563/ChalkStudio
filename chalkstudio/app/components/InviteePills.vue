<template>
	<div ref="container" class="relative min-w-0">
		<div ref="measure" class="pointer-events-none invisible absolute left-0 top-0 flex gap-1.5" aria-hidden="true">
			<span v-for="email in emails" :key="email" :class="pillClass">{{ email }}</span>
			<span :class="pillClass">+{{ emails.length }}</span>
		</div>
		<ul class="flex min-w-0 items-center gap-1.5" aria-label="Invitees">
			<li v-for="email in visibleEmails" :key="email" :class="pillClass" class="min-w-0 truncate" :title="email">
				{{ email }}
			</li>
			<li v-if="hiddenEmails.length" :class="pillClass" class="shrink-0" :title="hiddenEmails.join(', ')">
				<span aria-hidden="true">+{{ hiddenEmails.length }}</span>
				<span class="sr-only">and {{ hiddenEmails.length }} more</span>
			</li>
		</ul>
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{ emails: string[] }>()

const pillClass = 'whitespace-nowrap rounded-md bg-chalk/[0.08] px-2 py-0.5 font-sans text-xs text-chalk'

const container = useTemplateRef<HTMLElement>('container')
const measure = useTemplateRef<HTMLElement>('measure')
const { width } = useElementSize(container)
const fitCount = ref(props.emails.length)

const visibleEmails = computed(() => props.emails.slice(0, fitCount.value))
const hiddenEmails = computed(() => props.emails.slice(fitCount.value))

// The hidden measuring row holds every pill at its natural width plus a worst-case
// "+N" counter, so the visible row can take as many emails as fit while still
// leaving room for the counter whenever any are left over. At least one email
// always shows, truncated if it alone is wider than the row.
watch([width, () => props.emails], () => {
	if (!measure.value || !width.value) return
	const gap = parseFloat(getComputedStyle(measure.value).columnGap) || 0
	const pills = Array.from(measure.value.children) as HTMLElement[]
	const counterWidth = pills.pop()?.offsetWidth ?? 0
	let used = 0
	let count = 0
	for (const [index, pill] of pills.entries()) {
		const reserve = index < pills.length - 1 ? gap + counterWidth : 0
		if (used + pill.offsetWidth + reserve > width.value) break
		used += pill.offsetWidth + gap
		count++
	}
	fitCount.value = Math.max(count, 1)
}, { flush: 'post' })
</script>
