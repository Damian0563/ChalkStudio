import type { BoardMeta } from '~/types/board'
import type { QuickNotice } from '~/types/general'
import type KonvaTypes from 'konva'
import type { Ref } from 'vue'

type useBoardStateOptions = {
	getStage: () => KonvaTypes.Stage | undefined
	quickNotice: Ref<QuickNotice | undefined>
	loading: Ref<boolean>
}
const useBoardState = (options: useBoardStateOptions) => {
	const applyBoardState = (boardState: string): void => {
		console.log('applyBoardState', boardState)
	}
	const saveBoard = (): string => {
		const stage = options?.getStage()
		return stage ? stage.toJSON() : ''
	}
	const saveBoardState = async (boardMetadata: BoardMeta | undefined) => {
		if (!boardMetadata) return
		options.loading.value = true
		const board = autoSaveBoardState()
		boardMetadata.data = board
		try {
			const response = await $fetch<{ ok: boolean }>(`/api/boards/save/${boardMetadata.id}`, {
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
		const board = saveBoard() === '' ? '{}' : saveBoard()
		localStorage.setItem('board', board)
		return board
	}

	return {
		applyBoardState,
		saveBoardState,
		autoSaveBoardState,
	}
}

export default useBoardState
