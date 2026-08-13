type KeyboardZoomHandlers = {
	increaseZoom: () => void
	decreaseZoom: () => void
}

export type UseKeyboardOptions = {
	zoom: KeyboardZoomHandlers
}

const handleZoomKeys = (e: KeyboardEvent, zoom: KeyboardZoomHandlers): boolean => {
	if (!(e.ctrlKey || e.metaKey)) return false
	if (e.code === 'Equal' || e.code === 'NumpadAdd') {
		e.preventDefault()
		zoom.increaseZoom()
		return true
	}
	if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
		e.preventDefault()
		zoom.decreaseZoom()
		return true
	}
	return false
}

export function useKeyboard(options: UseKeyboardOptions) {
	const keydownEvent = (e: KeyboardEvent) => {
		if (handleZoomKeys(e, options.zoom)) return
	}

	onMounted(() => {
		window.addEventListener('keydown', keydownEvent, { capture: true })
	})

	onUnmounted(() => {
		window.removeEventListener('keydown', keydownEvent, { capture: true })
	})

	return { keydownEvent }
}
