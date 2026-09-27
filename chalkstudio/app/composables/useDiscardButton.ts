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

type ShowDiscardButtonOptions<T extends KonvaTypes.Node> = {
	onDiscard?: (node: T) => void
	offset?: { x: number; y: number }
	duration?: number
}
export default function useDiscardButton(options: DiscardButtonOptions) {
	const Konva = useKonva()
	const leafButtons = new WeakMap<KonvaTypes.Node, KonvaTypes.Group>()

	const buttonHost = (node: KonvaTypes.Node): KonvaTypes.Container | null =>
		node instanceof Konva.Container ? node : node.getParent()

	const findDiscardButton = (node: KonvaTypes.Node | null | undefined): KonvaTypes.Group | undefined => {
		if (!node) return undefined
		return node instanceof Konva.Container
			? node.findOne(`.${DISCARD_BUTTON_NAME}`) as KonvaTypes.Group | undefined
			: leafButtons.get(node)
	}

	const buttonPosition = (node: KonvaTypes.Node, host: KonvaTypes.Container, offset: { x: number; y: number }) => {
		const box = node.getClientRect({ relativeTo: host, skipShadow: true, skipStroke: true })
		return { x: box.x + (box.width || node.width()) + offset.x, y: box.y + offset.y }
	}

	const createDiscardButton = <T extends KonvaTypes.Node>(
		node: T,
		host: KonvaTypes.Container,
		{ onDiscard, offset = { x: -2, y: 2 } }: ShowDiscardButtonOptions<T> = {},
	): KonvaTypes.Group => {
		const button = new Konva.Group({
			name: DISCARD_BUTTON_NAME,
			...buttonPosition(node, host, offset),
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
			const container = node.getStage()?.container()
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
		button.on('mousedown.discard touchstart.discard', (e) => {
			e.cancelBubble = true
		})
		button.on('click.discard tap.discard', (e) => {
			e.cancelBubble = true
			cursor('default')
			onDiscard?.(node)
			hideDiscardButton(node)
			node.destroy()
			options.getLayer()?.batchDraw()
		})
		return button
	}

	const showDiscardButton = <T extends KonvaTypes.Node>(node: T, showOptions: ShowDiscardButtonOptions<T> = {}): void => {
		const host = buttonHost(node)
		if (!host || findDiscardButton(node)) return
		const button = createDiscardButton(node, host, showOptions)
		host.add(button)
		if (!(node instanceof Konva.Container)) leafButtons.set(node, button)
		const duration = showOptions.duration ?? 0.12
		if (duration > 0) button.to({ opacity: 1, duration })
		else button.opacity(1)
		node.getLayer()?.batchDraw()
	}

	const hideDiscardButton = (node: KonvaTypes.Node | null | undefined): void => {
		const button = findDiscardButton(node)
		if (!button || !node) return
		const layer = button.getLayer()
		button.destroy()
		leafButtons.delete(node)
		layer?.batchDraw()
	}

	return {
		DISCARD_BUTTON_NAME,
		showDiscardButton,
		hideDiscardButton,
		findDiscardButton,
	}
}
