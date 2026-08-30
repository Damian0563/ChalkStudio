import type KonvaTypes from 'konva'
import type { BoardSprite, BoardUser } from '~/types/board'
import userAvatarUrl from '~/assets/user-avatar.svg'

const CHALK = '#f5f0e8'
const BOARD = '#1a2332'
const POP_HOLD_MS = 1000

type UseBoardPopUpOptions = {
	getLayer: () => KonvaTypes.Layer | undefined
	getStage: () => KonvaTypes.Stage | undefined
	getViewportSize: () => { width: number; height: number }
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
		img.src = options.imageUrl ?? userAvatarUrl
	})

	const transitionTo = (x: number, y: number): Promise<void> => {
		return new Promise((resolve) => {
			const stage = options.getStage()
			const layer = options.getLayer()
			if (!stage || !layer) {
				resolve()
				return
			}

			const { width, height } = options.getViewportSize()
			const current = layer.getAbsoluteTransform().point({ x, y })
			const targetX = stage.x() + width / 2 - current.x
			const targetY = stage.y() + height / 2 - current.y

			new Konva.Tween({
				node: stage,
				duration: 0.4,
				x: targetX,
				y: targetY,
				easing: Konva.Easings.EaseInOut,
				onFinish: () => {
					stage.batchDraw()
					resolve()
				},
			}).play()
		})
	}

	const playTween = (config: KonvaTypes.TweenConfig) => {
		new Konva.Tween(config).play()
	}

	const addLocationRipple = (layer: KonvaTypes.Layer, sprite: BoardSprite) => {
		const ring = new Konva.Circle({
			x: sprite.x,
			y: sprite.y,
			radius: 18,
			stroke: sprite.color,
			strokeWidth: 1.5,
			opacity: 0,
			fill: 'transparent',
			listening: false,
		})
		layer.add(ring)

		playTween({
			node: ring,
			duration: 0.75,
			opacity: 0.22,
			scaleX: 1.9,
			scaleY: 1.9,
			easing: Konva.Easings.EaseOut,
			onFinish: () => {
				playTween({
					node: ring,
					duration: 0.45,
					opacity: 0,
					onFinish: () => ring.destroy(),
				})
			},
		})
	}

	const popUpSprite = (sprite: BoardSprite) => {
		if (!spriteImage.value) return
		const layer = options.getLayer()
		if (!layer) return

		const avatarSize = 48
		const borderWidth = 3
		const avatarRadius = avatarSize / 2
		const label = sprite.user.length > 18 ? `${sprite.user.slice(0, 16)}…` : sprite.user
		const labelPadding = { x: 10, y: 5 }
		addLocationRipple(layer, sprite)
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
		const pillY = avatarRadius + 8
		const groupNode = new Konva.Group({
			x: sprite.x,
			y: sprite.y + 16,
			opacity: 0,
			scaleX: 0.5,
			scaleY: 0.5,
			listening: false,
		})

		const haloNode = new Konva.Circle({
			x: 0,
			y: 0,
			radius: avatarRadius + 6,
			fill: sprite.color,
			opacity: 0,
			listening: false,
		})

		const avatarClip = new Konva.Group({
			clipFunc: (ctx) => {
				ctx.arc(0, 0, avatarRadius - borderWidth / 2, 0, Math.PI * 2, false)
			},
			listening: false,
		})

		const imageNode = new Konva.Image({
			x: -avatarRadius,
			y: -avatarRadius,
			width: avatarSize,
			height: avatarSize,
			image: spriteImage.value,
			listening: false,
		})

		const borderNode = new Konva.Circle({
			x: 0,
			y: 0,
			radius: avatarRadius - borderWidth / 2,
			stroke: sprite.color,
			strokeWidth: borderWidth,
			fill: 'transparent',
			shadowColor: sprite.color,
			shadowBlur: 16,
			shadowOpacity: 0.45,
			listening: false,
		})

		const labelGroup = new Konva.Group({
			opacity: 0,
			y: 10,
		})

		const pillNode = new Konva.Rect({
			x: -pillWidth / 2,
			y: pillY,
			width: pillWidth,
			height: pillHeight,
			fill: BOARD,
			opacity: 0.94,
			cornerRadius: pillHeight / 2,
			stroke: sprite.color,
			strokeWidth: 1.5,
			shadowColor: '#000',
			shadowBlur: 12,
			shadowOpacity: 0.4,
			shadowOffsetY: 3,
			listening: false,
		})

		textNode.setAttrs({
			x: -textNode.width() / 2,
			y: pillY + labelPadding.y - 1,
		})

		groupNode.add(haloNode)
		avatarClip.add(imageNode)
		groupNode.add(avatarClip)
		groupNode.add(borderNode)
		labelGroup.add(pillNode)
		labelGroup.add(textNode)
		groupNode.add(labelGroup)
		layer.add(groupNode)
		layer.batchDraw()

		playTween({
			node: haloNode,
			duration: 0.4,
			opacity: 0.1,
			easing: Konva.Easings.EaseOut,
		})

		playTween({
			node: groupNode,
			duration: 0.55,
			y: sprite.y,
			opacity: 1,
			scaleX: 1,
			scaleY: 1,
			easing: Konva.Easings.BackEaseOut,
			onFinish: () => {
				setTimeout(() => {
					playTween({
						node: groupNode,
						duration: 0.45,
						y: sprite.y - 12,
						opacity: 0,
						scaleX: 0.9,
						scaleY: 0.9,
						easing: Konva.Easings.EaseIn,
						onFinish: () => {
							groupNode.destroy()
							layer.batchDraw()
						},
					})
				}, POP_HOLD_MS)
			},
		})

		setTimeout(() => {
			playTween({
				node: labelGroup,
				duration: 0.38,
				opacity: 1,
				y: 0,
				easing: Konva.Easings.EaseOut,
			})
		}, 160)
	}

	const displayUserLocation = async (userName: string, users: Map<string, BoardUser>) => {
		const boardUser = users.get(userName)
		if (!boardUser || boardUser.x === undefined || boardUser.y === undefined) return
		await transitionTo(boardUser.x, boardUser.y)
		popUpSprite({ user: userName, x: boardUser.x, y: boardUser.y, color: boardUser.color })
	}

	return { popUpSprite, displayUserLocation }
}
