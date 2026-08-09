import type { Peer } from 'crossws'

function getRoomName(peer: Peer): string {
	const url = new URL(peer.request.url)
	const room = url.pathname.split('/').pop()
	if (!room) {
		throw new Error('Missing room in WebSocket URL')
	}
	return room
}

export default defineWebSocketHandler({
	open(peer) {
		try {
			peer.context.room = getRoomName(peer)
			peer.subscribe(peer.context.room as string)
		} catch (error) {
			peer.close(1008)
		}
	},
	message(peer, message) {
		peer.publish(peer.context?.room as string, message)
	},
	close(peer) {
		peer.unsubscribe(peer.context?.room as string)
	},
})
