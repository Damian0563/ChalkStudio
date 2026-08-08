import type Konva from 'konva'

declare module '#app' {
	interface NuxtApp {
		$konva: typeof Konva
	}
}

declare module 'vue' {
	interface ComponentCustomProperties {
		$konva: typeof Konva
	}
}

export {}
