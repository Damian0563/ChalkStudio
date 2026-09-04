export type Tool = 'pen' | 'eraser' | 'pan'

export type StickyNote = {
	text: string
	font: string
	fontSize: number
	textColor: string
	fontWeight: {
		label: string
		value: number
	}
	bgColor: string
	draggable: boolean
}

export type BoardSettings = {
	focusMode: boolean
	consolidateParticipantsPanel: boolean
	showSprites: boolean
}

export type BoardSprite = {
	user: string
	x: number
	y: number
	color: string
}

export type BoardUser = {
	name: string
	x?: number
	y?: number
	color: string
}

export type BoardEvent = {
	type: 'drawStart' | 'draw' | 'drawEnd' | 'join' | 'leave' | 'pan' | 'stickyNote-new' | 'stickyNote-edit' | 'stickyNote-move'
	user: string
	data: any
	color?: string
	others?: Record<string, BoardUser>
}
