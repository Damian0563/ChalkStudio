export type Tool = 'pen' | 'eraser' | 'pan'

export type BoardMeta = {
	id: string
	title: string
	image: Blob
	data: string
}

export type StickyNote = {
	groupId?: string
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
	resizeable: boolean
	width?: number
	height?: number
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

export type HistoryEvent = {
	type: 'undo' | 'redo'
	id: string
	before: object | null
	after: object | null
	stub: boolean
}

export type BoardEvent = {
	type: 'drawStart' | 'draw' | 'drawEnd' | 'join' | 'leave' | 'pan' | 'state' | 'stickyNote-new' | 'stickyNote-edit' | 'stickyNote-move' | 'stickyNote-dragStart' | 'stickyNote-dragEnd' | 'stickyNote-delete' | 'stickyNote-transform'
	user: string
	data: any
	color?: string
	target?: string
	others?: Record<string, BoardUser>
}
