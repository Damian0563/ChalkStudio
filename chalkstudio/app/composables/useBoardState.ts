import type { BoardMeta } from '#shared/types'
import type { QuickNotice } from '~/types/general'
import type KonvaTypes from 'konva'
import type { Ref } from 'vue'
import type { NuxtApp } from '#app'

type useBoardStateOptions = {
	getStage: () => KonvaTypes.Stage | undefined
	getLayer: () => KonvaTypes.Layer | undefined
	quickNotice: Ref<QuickNotice | undefined>
	loading: Ref<boolean>
	room: ComputedRef<string>
	onRestore?: (node: KonvaTypes.Node) => void
	onRestoreImage?: (imageNode: KonvaTypes.Image) => void | Promise<void>
	fetch: NuxtApp['$csrfFetch']
}
const useBoardState = (options: useBoardStateOptions) => {
	const loaded = ref(false)
	const storageKey = (): string => `board-${options.room.value}`
	const wsTimeout = 3000
	const Konva = useKonva()
	const loadPage = async (boardState?: string | undefined): Promise<void> => {
		if (loaded.value) return
		options.loading.value = true
		loaded.value = true
		if (boardState) applyBoardState(boardState)
		else if (localStorage.getItem(storageKey())) applyBoardState(localStorage.getItem(storageKey()) as string)
		else {
			//fetch from server
			try {

			} catch {
				loaded.value = false
				options.quickNotice.value = { message: 'Error loading board', type: 'error' }
			}
		}
		options.loading.value = false
	}
	const applyBoardState = async (boardState: string): Promise<void> => {
		const layer = options.getLayer()
		if (!layer) return
		const parsedState = JSON.parse(boardState)
		const imageNodes: KonvaTypes.Image[] = []
		parsedState?.children?.forEach((child: any) => {
			if (child.className === 'Layer') {
				const actualChildren = child.children
				actualChildren.forEach((child: any) => {
					if (child.className === 'Line') {
						const node = Konva.Node.create(child)
						layer.add(node)
						layer.batchDraw()
					} else if (child.className === 'Group') {
						const group = Konva.Node.create(child) as KonvaTypes.Group
						layer.add(group)
						options.onRestore?.(group)
						layer.batchDraw()
					} else if (child.className === 'Image') {
						const imageNode = Konva.Node.create(child) as KonvaTypes.Image
						layer.add(imageNode)
						imageNodes.push(imageNode)
					}
				})
			}
		})
		await Promise.all(imageNodes.map((imageNode) => options.onRestoreImage?.(imageNode)))
	}
	const saveBoard = (): string => {
		const stage = options?.getStage()
		if (!stage) return ''
		const board = stage.toObject()
		board.children?.forEach((layer: any) => {
			layer.children = layer.children?.filter((child: any) => child.attrs.name !== IMAGE_PLACEHOLDER_NAME)
		})
		return JSON.stringify(board)
	}
	const saveBoardState = async (boardMetadata: BoardMeta | undefined) => {
		if (!boardMetadata) return
		options.loading.value = true
		const board = autoSaveBoardState()
		boardMetadata.data = board
		try {
			const response = await options.fetch<{ ok: boolean }>(`/api/boards/save/${boardMetadata.id}`, {
				method: 'POST',
				body: JSON.stringify(boardMetadata),
			})
			options.loading.value = false
			options.quickNotice.value = response.ok
				? { message: 'Board saved', type: 'success' }
				: { message: 'Error saving board', type: 'error' }
		} catch {
			options.loading.value = false
			options.quickNotice.value = { message: 'Error saving board', type: 'error' }
		}
	}
	const autoSaveBoardState = (): string => {
		if (!loaded.value) return ''
		const board = saveBoard() === '' ? '{}' : saveBoard()
		localStorage.setItem(storageKey(), board)
		return board
	}

	return {
		loaded,
		loadPage,
		saveBoard,
		saveBoardState,
		autoSaveBoardState,
		wsTimeout,
	}
}

export default useBoardState
