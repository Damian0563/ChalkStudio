<template>
	<div class="relative min-h-screen bg-board">
		<div class="pointer-events-none fixed inset-0 chalk-grain" aria-hidden="true" />
		<Navbar />
		<main>
			<slot />
		</main>
	</div>
</template>
