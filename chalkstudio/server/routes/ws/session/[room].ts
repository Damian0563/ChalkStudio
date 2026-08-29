import type { Peer } from 'crossws'
import type { BoardUser } from '~/types/board'

function getRoomName(peer: Peer): string {
	const url = new URL(peer.request.url)
	const room = url.pathname.split('/').pop()
	if (!room) {
		throw new Error('Missing room in WebSocket URL')
	}
	return room
}

const spriteColors: string[] = [
	'#22c55e', // green
	'#3b82f6', // blue
	'#eab308', // yellow
	'#a855f7', // purple
	'#ec4899', // pink
	'#ef4444', // red
	'#f97316', // orange
	'#06b6d4', // cyan
	'#84cc16', // lime
]
const roomUsers = new Map<string, Map<string, BoardUser>>()

function getRoomUsers(room: string): Map<string, BoardUser> {
	let users = roomUsers.get(room)
	if (!users) {
		users = new Map<string, BoardUser>()
		roomUsers.set(room, users)
	}
	return users
}

function removeUser(room: string, user: string): void {
	const users = roomUsers.get(room)
	if (!users) return
	users.delete(user)
	if (users.size === 0) roomUsers.delete(room)
}

export default defineWebSocketHandler({
	open(peer) {
		try {
			peer.context.room = getRoomName(peer)
			peer.subscribe(peer.context.room as string)
		} catch (_) {
			peer.close(1008)
		}
	},
	message(peer, message) {
		try {
			const event = message.json() as Record<string, unknown>
			const room = peer.context?.room as string
			const users = getRoomUsers(room)
			if (event.type === 'join') {
				peer.context.user = event.user as string
				peer.context.color = spriteColors[users.size % spriteColors.length]
				users.set(event.user as string, {
					name: event.user as string,
					color: peer.context.color as string,
				})
			} else if (event.type === 'leave') {
				removeUser(room, event.user as string)
			}
			const payload = JSON.stringify({
				...event,
				color: peer.context.color,
				others: Object.fromEntries(roomUsers.get(room) ?? []),
			})
			peer.publish(room, payload)
			if (event.type === 'join' || event.type === 'leave') {
				peer.send(payload)
			}
		} catch (_) {
			peer.close(1002)
		}
	},
	close(peer) {
		const room = peer.context?.room as string | undefined
		const user = peer.context?.user as string | undefined
		if (room && user) {
			removeUser(room, user)
			peer.publish(
				room,
				JSON.stringify({
					type: 'leave',
					user,
					others: Object.fromEntries(roomUsers.get(room) ?? []),
				}),
			)
		}
		if (room) peer.unsubscribe(room)
	},
})
