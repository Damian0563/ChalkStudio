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
type RoomMember = BoardUser & { peer: Peer }
const roomMembers = new Map<string, Map<string, RoomMember>>()

function getRoomMembers(room: string): Map<string, RoomMember> {
	let members = roomMembers.get(room)
	if (!members) {
		members = new Map<string, RoomMember>()
		roomMembers.set(room, members)
	}
	return members
}

function roster(room: string): Record<string, BoardUser> {
	const members = roomMembers.get(room)
	if (!members) return {}
	return Object.fromEntries(
		[...members].map(([id, { peer: _peer, ...user }]) => [id, user]),
	)
}

function removeUser(room: string, user: string): void {
	const members = roomMembers.get(room)
	if (!members) return
	members.delete(user)
	if (members.size === 0) roomMembers.delete(room)
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
			if (event.type === 'state') {
				const target = event.target as string | undefined
				const targetPeer = target ? roomMembers.get(room)?.get(target)?.peer : undefined
				targetPeer?.send(JSON.stringify(event))
				return
			}
			const members = getRoomMembers(room)
			if (event.type === 'join') {
				const takenColors = new Set<string>()
				peer.context.color = spriteColors[Math.floor(Math.random() * spriteColors.length)]
				for (const user of members.values()) {
					takenColors.add(user.color)
				}
				const availableColors: string[] = spriteColors.filter((color) => !takenColors.has(color))
				if (availableColors.includes(event.color as string) && !takenColors.has(event.color as string)) {
					peer.context.color = event.color as string
				} else {
					peer.context.color = availableColors.length > 0 ? availableColors[Math.floor(Math.random() * availableColors.length)] : "#000000"
				}
				peer.context.user = event.user as string
				members.set(event.user as string, {
					name: event.user as string,
					color: peer.context.color as string,
					x: 0,
					y: 0,
					peer,
				})
			} else if (event.type === 'leave') {
				removeUser(room, event.user as string)
			}
			const payload = JSON.stringify({
				...event,
				color: peer.context.color,
				others: roster(room),
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
					others: roster(room),
				}),
			)
		}
		if (room) peer.unsubscribe(room)
	},
})
