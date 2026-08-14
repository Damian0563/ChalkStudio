import type { AnnounceMessage } from '~/types/general'

export function useAnnounce() {
	const message = useState<AnnounceMessage | null>('announce-message', () => null)

	const announce = (payload: AnnounceMessage) => {
		message.value = payload
	}

	const closeAnnounce = () => {
		message.value = null
	}

	return { message, announce, closeAnnounce }
}
