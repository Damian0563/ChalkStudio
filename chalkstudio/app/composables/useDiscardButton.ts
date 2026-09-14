import type KonvaTypes from 'konva'

export const DISCARD_BUTTON_NAME = 'discard-button'

const DISCARD_RADIUS = 11
const DISCARD_ARM = 3
const DISCARD_FILL = '#1a2332'
const DISCARD_HOVER_FILL = '#8e3b2f'
const DISCARD_STROKE = '#f5f0e8'

type DiscardButtonOptions = {
	getLayer: () => KonvaTypes.Layer | undefined
}

type ShowDiscardButtonOptions = {
	onDiscard?: (group: KonvaTypes.Group) => void
	offset?: { x: number; y: number }
	duration?: number
}
export default function useDiscardButton(options: DiscardButtonOptions) {
	const Konva = useKonva()

	const findDiscardButton = (group: KonvaTypes.Group | null | undefined): KonvaTypes.Group | undefined =>
		group?.findOne(`.${DISCARD_BUTTON_NAME}`) as KonvaTypes.Group | undefined

	const buttonPosition = (group: KonvaTypes.Group, offset: { x: number; y: number }) => {
		const box = group.getClientRect({ relativeTo: group, skipShadow: true, skipStroke: true })
		return { x: box.x + (box.width || group.width()) + offset.x, y: box.y + offset.y }
	}

	const createDiscardButton = (
		group: KonvaTypes.Group,
		{ onDiscard, offset = { x: -2, y: 2 } }: ShowDiscardButtonOptions = {},
	): KonvaTypes.Group => {
		const button = new Konva.Group({
			name: DISCARD_BUTTON_NAME,
			...buttonPosition(group, offset),
			opacity: 0,
			listening: true,
		})
		const circle = new Konva.Circle({
			radius: DISCARD_RADIUS,
			fill: DISCARD_FILL,
			stroke: DISCARD_STROKE,
			strokeWidth: 1.5,
			shadowColor: '#000',
			shadowBlur: 6,
			shadowOpacity: 0.35,
			shadowOffsetY: 1,
		})
		const crossOptions = {
			stroke: DISCARD_STROKE,
			strokeWidth: 2,
			lineCap: 'round' as const,
			listening: false,
		}
		button.add(circle)
		button.add(new Konva.Line({ points: [-DISCARD_ARM, -DISCARD_ARM, DISCARD_ARM, DISCARD_ARM], ...crossOptions }))
		button.add(new Konva.Line({ points: [-DISCARD_ARM, DISCARD_ARM, DISCARD_ARM, -DISCARD_ARM], ...crossOptions }))
		const cursor = (style: string) => {
			const container = group.getStage()?.container()
			if (container) container.style.cursor = style
		}
		button.on('mouseenter.discard', (e) => {
			e.cancelBubble = true
			circle.fill(DISCARD_HOVER_FILL)
			cursor('pointer')
			button.getLayer()?.batchDraw()
		})
		button.on('mouseleave.discard', (e) => {
			e.cancelBubble = true
			circle.fill(DISCARD_FILL)
			cursor('default')
			button.getLayer()?.batchDraw()
		})
		button.on('click.discard tap.discard', (e) => {
			e.cancelBubble = true
			cursor('default')
			onDiscard?.(group)
			group.destroy()
			options.getLayer()?.batchDraw()
		})
		return button
	}

	const showDiscardButton = (group: KonvaTypes.Group, showOptions: ShowDiscardButtonOptions = {}): void => {
		if (findDiscardButton(group)) return
		const button = createDiscardButton(group, showOptions)
		group.add(button)
		const duration = showOptions.duration ?? 0.12
		if (duration > 0) button.to({ opacity: 1, duration })
		else button.opacity(1)
		group.getLayer()?.batchDraw()
	}

	const hideDiscardButton = (group: KonvaTypes.Group | null | undefined): void => {
		const button = findDiscardButton(group)
		if (!button || !group) return
		button.destroy()
		group.getLayer()?.batchDraw()
	}

	return {
		DISCARD_BUTTON_NAME,
		showDiscardButton,
		hideDiscardButton,
		findDiscardButton,
	}
}
