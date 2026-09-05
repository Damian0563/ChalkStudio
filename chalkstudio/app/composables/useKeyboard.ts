import type { BoardSettings } from '~/types/board'

export type KeyboardShortcut = {
	description: string
	keys: string[]
}

export const keyboardShortcuts: KeyboardShortcut[] = [
	{
		description: 'Toggle focus mode',
		keys: ['F11'],
	},
	{
		description: 'Zoom in',
		keys: ['Ctrl / ⌘', '+'],
	},
	{
		description: 'Zoom out',
		keys: ['Ctrl / ⌘', '−'],
	},
	{
		description: 'Undo your changes',
		keys: ['Ctrl / ⌘', 'Z'],
	},
	{
		description: 'Redo your changes',
		keys: ['Ctrl / ⌘', 'Y'],
	},
	{
		description: 'Close open panel or dialog',
		keys: ['Esc'],
	},
]

type KeyboardZoomHandlers = {
	increaseZoom: () => void
	decreaseZoom: () => void
}

export type UseKeyboardOptions = {
	zoom: KeyboardZoomHandlers
	settings: Ref<BoardSettings>
}



export function useKeyboard(options: UseKeyboardOptions) {
	const keydownEvent = (e: KeyboardEvent): void => {
		const { zoom, settings } = options
		if (e.code === 'F11') {
			e.preventDefault()
			e.stopImmediatePropagation()
			settings.value.focusMode = !settings.value.focusMode
			return
		}
		if (!(e.ctrlKey || e.metaKey)) return
		if (e.code === 'Equal' || e.code === 'NumpadAdd') {
			e.preventDefault()
			zoom.increaseZoom()
		} else if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
			e.preventDefault()
			zoom.decreaseZoom()
		} else if (e.code === 'KeyZ') {
			e.preventDefault()
			console.log('undo')
		} else if (e.code === 'KeyY') {
			e.preventDefault()
			console.log('redo')
		}
	}

	onMounted(() => {
		window.addEventListener('keydown', keydownEvent, { capture: true })
	})

	onUnmounted(() => {
		window.removeEventListener('keydown', keydownEvent, { capture: true })
	})

	return { keydownEvent }
}
