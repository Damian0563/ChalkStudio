import type { BoardEvent } from '~/types/board'

type UseBoardWebSocketOptions = {
	room: MaybeRefOrGetter<string>
	userId: string
	onEvent: (event: BoardEvent) => void
	onError?: (error: unknown) => void
}

export function useBoardWebSocket(options: UseBoardWebSocketOptions) {
	const { send } = useWebSocket(computed(() => `/ws/session/${toValue(options.room)}`), {
		onMessage(_ws, messageEvent) {
			try {
				const event: BoardEvent = JSON.parse(messageEvent.data as string) as BoardEvent
				options.onEvent(event)
			} catch (error) {
				options.onError?.(error)
			}
		},
	})

	const join = () => {
		send(JSON.stringify({
			type: 'join',
			user: options.userId,
			color: localStorage.getItem('spriteColor'),
		}))
	}

	const leave = () => {
		send(JSON.stringify({ type: 'leave', user: options.userId }))
	}

	return { send, join, leave }
}
