import type KonvaTypes from 'konva'
import type { BoardSprite } from '~/types/board'
import logoUrl from '~/assets/logo.webp'

const CHALK = '#f5f0e8'
const CHALK_MUTED = '#c4bfb4'
const BOARD_RAISED = '#243044'

type UseBoardPopUpOptions = {
	getLayer: () => KonvaTypes.Layer | undefined
	imageUrl?: string
}

export function useBoardPopUp(options: UseBoardPopUpOptions) {
	const Konva = useKonva()
	const spriteImage = ref<HTMLImageElement | null>(null)

	onMounted(() => {
		const img = new Image()
		img.onload = () => {
			spriteImage.value = img
		}
		img.src = options.imageUrl ?? logoUrl
	})

	const popUpSprite = (sprite: BoardSprite) => {
		if (!spriteImage.value) return
		const layer = options.getLayer()
		if (!layer) return

		const avatarSize = 28
		const label = sprite.user.length > 18 ? `${sprite.user.slice(0, 16)}…` : sprite.user
		const labelPadding = { x: 10, y: 5 }
		const textNode = new Konva.Text({
			text: label,
			fontSize: 12,
			fontFamily: '"Source Sans 3", system-ui, sans-serif',
			fontStyle: '600',
			fill: CHALK,
			listening: false,
		})
		const pillWidth = textNode.width() + labelPadding.x * 2
		const pillHeight = textNode.height() + labelPadding.y * 2
		const pillY = avatarSize / 2 + 6

		const groupNode = new Konva.Group({
			x: sprite.x,
			y: sprite.y,
			opacity: 0,
			scaleX: 0.35,
			scaleY: 0.35,
			listening: false,
		})
		const imageNode = new Konva.Image({
			x: 0,
			y: 0,
			image: spriteImage.value,
			width: avatarSize,
			height: avatarSize,
			offsetX: avatarSize / 2,
			offsetY: avatarSize / 2,
			shadowColor: CHALK,
			shadowBlur: 10,
			shadowOpacity: 0.35,
			listening: false,
		})

		const pillNode = new Konva.Rect({
			x: -pillWidth / 2,
			y: pillY,
			width: pillWidth,
			height: pillHeight,
			fill: BOARD_RAISED,
			opacity: 0.94,
			cornerRadius: pillHeight / 2,
			stroke: CHALK_MUTED,
			strokeWidth: 1,
			shadowColor: '#000',
			shadowBlur: 10,
			shadowOpacity: 0.35,
			shadowOffsetY: 2,
			listening: false,
		})

		textNode.setAttrs({
			x: -textNode.width() / 2,
			y: pillY + labelPadding.y - 1,
		})

		groupNode.add(imageNode)
		groupNode.add(pillNode)
		groupNode.add(textNode)
		layer.add(groupNode)
		layer.batchDraw()

		const finish = () => {
			groupNode.destroy()
			layer.batchDraw()
		}
		new Konva.Tween({
			node: groupNode,
			duration: 0.3,
			opacity: 1,
			scaleX: 1,
			scaleY: 1,
			easing: Konva.Easings.BackEaseOut,
			onFinish: () => {
				new Konva.Tween({
					node: groupNode,
					duration: 0.9,
					y: sprite.y - 44,
					opacity: 0,
					scaleX: 1.04,
					scaleY: 1.04,
					easing: Konva.Easings.EaseOut,
					onFinish: finish,
				}).play()
			},
		}).play()
	}

	return { popUpSprite }
}
