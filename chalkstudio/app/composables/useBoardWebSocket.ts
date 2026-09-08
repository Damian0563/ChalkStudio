import type { BoardEvent } from '~/types/board'

type UseBoardWebSocketOptions = {
	room: MaybeRefOrGetter<string>
	user: string
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


	const rosterPeers = (event: BoardEvent): string[] =>
		Object.keys(event.others ?? {}).filter((id) => id !== event.user)

	const isStateProvider = (event: BoardEvent): boolean =>
		rosterPeers(event).sort()[0] === options.user

	const join = () => {
		send(JSON.stringify({
			type: 'join',
			user: options.user,
			color: localStorage.getItem('spriteColor'),
		}))
	}

	const leave = () => {
		send(JSON.stringify({ type: 'leave', user: options.user }))
	}

	return { send, join, leave, rosterPeers, isStateProvider }
}
