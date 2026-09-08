import type { BoardMeta } from '~/types/board'
import type { QuickNotice } from '~/types/general'
import type KonvaTypes from 'konva'
import type { Ref } from 'vue'

type useBoardStateOptions = {
	getStage: () => KonvaTypes.Stage | undefined
	quickNotice: Ref<QuickNotice | undefined>
	loading: Ref<boolean>
	room: ComputedRef<string>
}
const useBoardState = (options: useBoardStateOptions) => {
	const loaded = ref(false)
	const storageKey = (): string => `board-${options.room.value}`
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
	}
}

export default useBoardState
