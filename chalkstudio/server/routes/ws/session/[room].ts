import type { Peer } from 'crossws'

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
export default defineWebSocketHandler({
	open(peer) {
		try {
			peer.context.room = getRoomName(peer)
			peer.subscribe(peer.context.room as string)
			const room = peer.context.room as string
			let roomSize = 0
			for (const p of peer.peers) {
				if (p.context?.room === room) roomSize++
			}
			peer.context.color = spriteColors[roomSize % spriteColors.length]
		} catch (_) {
			peer.close(1008)
		}
	},
	message(peer, message) {
		try {
			const event = message.json() as Record<string, unknown>
			peer.publish(
				peer.context?.room as string,
				JSON.stringify({ ...event, color: peer.context.color }),
			)
		} catch (_) {
			peer.close(1002)
		}
	},
	close(peer) {
		peer.unsubscribe(peer.context?.room as string)
	},
})
