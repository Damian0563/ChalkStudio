import type { BoardEvent, BoardUser } from '~/types/board'
import { v4 as uuidv4 } from 'uuid'

const FALLBACK_COLOR = '#000000'

export function useBoardUsers() {
	const user = ref(uuidv4().slice(0, 8))
	const users = ref(new Map<string, BoardUser>([[user.value, { name: user.value, color: FALLBACK_COLOR }]]))

	const userColor = (userId: string, color?: string) =>
		color || users.value.get(userId)?.color || FALLBACK_COLOR

	const applyRoster = (event: Pick<BoardEvent, 'user' | 'others' | 'color'>) => {
		const roster = event.others
			? new Map<string, BoardUser>(Object.entries(event.others))
			: new Map<string, BoardUser>()
		if (!roster.has(user.value)) {
			roster.set(user.value, users.value.get(user.value) ?? { name: user.value, color: FALLBACK_COLOR })
		}
		if (event.user === user.value) {
			const spriteColor = event.color ?? roster.get(user.value)?.color
			if (spriteColor) localStorage.setItem('spriteColor', spriteColor)
		}
		users.value = roster
	}

	const trackPresence = (userId: string, presence: { x: number; y: number; color?: string }) => {
		users.value.set(userId, {
			name: userId,
			x: presence.x,
			y: presence.y,
			color: userColor(userId, presence.color),
		})
	}

	const updatePan = (userId: string, x: number, y: number) => {
		if (!users.value.has(userId)) return
		users.value.get(userId)!.x = x
		users.value.get(userId)!.y = y
	}

	return {
		user,
		users,
		applyRoster,
		trackPresence,
		updatePan,
	}
}
