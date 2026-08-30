import type { BoardSettings } from '~/types/board'
export default function useFullscreen(settings: Ref<BoardSettings>) {
	const enterFullscreen = async (): Promise<void> => {
		if (!import.meta.client || document.fullscreenElement) return

		try {
			await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
		} catch {
			// Fullscreen may be blocked by the browser or require a user gesture.
		}
	}


	const syncFocusModeWithFullscreen = () => {
		if (!document.fullscreenElement && settings.value.focusMode) {
			settings.value.focusMode = false
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
		syncFocusModeWithFullscreen,
	}
}
