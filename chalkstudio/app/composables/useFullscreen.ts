export default function useFullscreen() {
	const enterFullscreen = async (): Promise<void> => {
		if (!import.meta.client || document.fullscreenElement) return

		try {
			await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
		} catch {
			// Fullscreen may be blocked by the browser or require a user gesture.
		}
	}

	const exitFullscreen = async (): Promise<void> => {
		if (!import.meta.client || !document.fullscreenElement) return

		try {
			await document.exitFullscreen()
		} catch {
			// Ignore if the browser refuses to exit fullscreen.
		}
	}

	return {
		enterFullscreen,
		exitFullscreen,
	}
}
