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
	// only carried once a note has been resized by hand, in board coordinates
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
	type: 'drawStart' | 'draw' | 'drawEnd' | 'join' | 'leave' | 'pan' | 'state' | 'stickyNote-new' | 'stickyNote-edit' | 'stickyNote-move' | 'stickyNote-dragStart' | 'stickyNote-dragEnd' | 'stickyNote-delete'
	user: string
	data: any
	color?: string
	// only set on `state`: the joining user the snapshot is addressed to
	target?: string
	others?: Record<string, BoardUser>
}
