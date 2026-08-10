import type KonvaTypes from 'konva'

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 0.9, 1, 1.1, 1.2, 1.5]

type UseZoomOptions = {
	getStage: () => KonvaTypes.Stage | undefined
	getLayer: () => KonvaTypes.Layer | undefined
	zoom: Ref<number>
}

export default function useZoom(options: UseZoomOptions) {
	const applyScale = (level: number) => {
		const stage = options.getStage()
		const layer = options.getLayer()
		if (!stage || !layer) return

		const oldScale = layer.scaleX()
		const center = { x: stage.width() / 2, y: stage.height() / 2 }
		const anchor = {
			x: (center.x - layer.x()) / oldScale,
			y: (center.y - layer.y()) / oldScale,
		}
		layer.scale({ x: level, y: level })
		layer.position({
			x: center.x - anchor.x * level,
			y: center.y - anchor.y * level,
		})
		layer.batchDraw()
	}

	const currentIndex = () => ZOOM_LEVELS.indexOf(options.zoom.value)

	const increaseZoom = (): void => {
		const idx = currentIndex()
		if (idx === -1 || idx === ZOOM_LEVELS.length - 1) return
		options.zoom.value = ZOOM_LEVELS[idx + 1] as number
		applyScale(options.zoom.value)
	}

	const decreaseZoom = (): void => {
		const idx = currentIndex()
		if (idx <= 0) return
		options.zoom.value = ZOOM_LEVELS[idx - 1] as number
		applyScale(options.zoom.value)
	}

	return {
		increaseZoom,
		decreaseZoom,
	}
}
