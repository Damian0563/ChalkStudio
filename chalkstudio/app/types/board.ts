export type Tool = 'pen' | 'eraser' | 'pan'

export type StickyNote = {
	text: string
	color: string
}

export type BoardSprite = {
	user: string
	x: number
	y: number
	color: string
}

export type BoardEvent = {
	type: string
	user: string
	data: any
	color?: string
}
