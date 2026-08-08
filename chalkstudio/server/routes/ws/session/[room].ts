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
		peer.subscribe(getRoomName(peer))
	},
	message(peer, message) {
		peer.publish(getRoomName(peer), message.text())
	},
	close(peer) {
		peer.unsubscribe(getRoomName(peer))
	},
})
