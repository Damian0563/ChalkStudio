<template>
	<div
		class="fixed top-4 left-1/2 z-10 flex max-w-[calc(100vw-6rem)] -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-chalk/10 bg-board-raised/92 shadow-[0_10px_36px_-10px_rgba(0,0,0,0.55)] backdrop-blur-sm"
		role="toolbar"
		aria-label="Drawing tools">
		<div class="h-px w-full chalk-line opacity-55" aria-hidden="true" />

		<div class="flex items-center gap-1 overflow-x-auto px-2 py-1.5 sm:gap-1.5 sm:px-3">
			<div class="flex shrink-0 items-center gap-0.5" role="group" aria-label="Tools">
				<button
					type="button"
					class="flex h-9 w-9 items-center justify-center rounded-lg bg-chalk/10 text-chalk ring-1 ring-chalk/15"
					aria-label="Pen"
					aria-pressed="true">
					<Icon name="lucide:pencil" class="h-4 w-4 shrink-0" aria-hidden="true" />
				</button>
				<button
					type="button"
					class="flex h-9 w-9 items-center justify-center rounded-lg text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
					aria-label="Eraser"
					aria-pressed="false">
					<Icon name="lucide:eraser" class="h-4 w-4 shrink-0" aria-hidden="true" />
				</button>
				<button
					type="button"
					class="flex h-9 w-9 items-center justify-center rounded-lg text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
					aria-label="Pan"
					aria-pressed="false">
					<Icon name="lucide:hand" class="h-4 w-4 shrink-0" aria-hidden="true" />
				</button>
			</div>

			<div class="mx-1 h-6 w-px shrink-0 bg-chalk/10" aria-hidden="true" />

			<div class="flex shrink-0 items-center gap-1.5 px-0.5" role="group" aria-label="Colors">
				<button
					type="button"
					class="h-6 w-6 shrink-0 rounded-full border-2 border-chalk ring-2 ring-coral ring-offset-2 ring-offset-board-raised"
					style="background-color: #f5f0e8"
					aria-label="Chalk white"
					aria-pressed="true" />
				<button
					type="button"
					class="h-6 w-6 shrink-0 rounded-full border-2 border-chalk/20 transition-colors hover:border-chalk/40"
					style="background-color: #e85d4c"
					aria-label="Coral"
					aria-pressed="false" />
				<button
					type="button"
					class="h-6 w-6 shrink-0 rounded-full border-2 border-chalk/20 transition-colors hover:border-chalk/40"
					style="background-color: #9ba8b8"
					aria-label="Slate"
					aria-pressed="false" />
				<button
					type="button"
					class="h-6 w-6 shrink-0 rounded-full border-2 border-chalk/20 transition-colors hover:border-chalk/40"
					style="background-color: #f0d86e"
					aria-label="Yellow chalk"
					aria-pressed="false" />
				<button
					type="button"
					class="h-6 w-6 shrink-0 rounded-full border-2 border-chalk/20 transition-colors hover:border-chalk/40"
					style="background-color: #7ec8a4"
					aria-label="Green chalk"
					aria-pressed="false" />
			</div>

			<div class="mx-1 h-6 w-px shrink-0 bg-chalk/10" aria-hidden="true" />

			<div class="flex shrink-0 items-center gap-0.5" role="group" aria-label="Stroke width">
				<button
					type="button"
					class="flex h-9 w-9 items-center justify-center rounded-lg text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
					aria-label="Thin stroke">
					<span class="block h-px w-4 rounded-full bg-current" aria-hidden="true" />
				</button>
				<button
					type="button"
					class="flex h-9 w-9 items-center justify-center rounded-lg bg-chalk/10 text-chalk ring-1 ring-chalk/15"
					aria-label="Medium stroke"
					aria-pressed="true">
					<span class="block h-0.5 w-4 rounded-full bg-current" aria-hidden="true" />
				</button>
				<button
					type="button"
					class="flex h-9 w-9 items-center justify-center rounded-lg text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
					aria-label="Thick stroke">
					<span class="block h-1 w-4 rounded-full bg-current" aria-hidden="true" />
				</button>
			</div>

			<div class="mx-1 h-6 w-px shrink-0 bg-chalk/10" aria-hidden="true" />

			<div class="flex shrink-0 items-center gap-0.5" role="group" aria-label="History">
				<button
					type="button"
					class="flex h-9 w-9 items-center justify-center rounded-lg text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
					aria-label="Undo">
					<Icon name="lucide:undo-2" class="h-4 w-4 shrink-0" aria-hidden="true" />
				</button>
				<button
					type="button"
					class="flex h-9 w-9 items-center justify-center rounded-lg text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
					aria-label="Redo">
					<Icon name="lucide:redo-2" class="h-4 w-4 shrink-0" aria-hidden="true" />
				</button>
			</div>
		</div>
	</div>
</template>
