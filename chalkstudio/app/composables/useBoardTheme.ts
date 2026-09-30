export type BoardBackground = {
	name: string
	value: string
}

export const boardBackgrounds: BoardBackground[] = [
	{ name: 'Slate', value: '#1a2332' },
	{ name: 'Chalkboard', value: '#1f3a2e' },
	{ name: 'Graphite', value: '#1f2023' },
	{ name: 'Midnight', value: '#0f1729' },
	{ name: 'Ocean', value: '#12303b' },
	{ name: 'Plum', value: '#2a1f33' },
	{ name: 'Burgundy', value: '#3a1c24' },
	{ name: 'Walnut', value: '#2b221c' },
	{ name: 'Black', value: '#000000' },
	{ name: 'White', value: '#ffffff' },
	{ name: 'Paper', value: '#f4efe4' },
	{ name: 'Mist', value: '#e3e8ee' },
]

export function useBoardTheme() {
	const background = useLocalStorage<string>('chalkstudio-board-background', boardBackgrounds[0]!.value)
	return { background }
}
