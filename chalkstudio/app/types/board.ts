export type Tool = 'pen' | 'eraser' | 'pan'

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
	align: 'left' | 'center' | 'right'
	width?: number
	height?: number
}

// The custom attrs a canvas image node is serialized with. `imageId` keys into the
// owning board's `imageSources` map, which supplies the bucket URL to load from.
export type BoardImage = {
	groupId?: string
	imageId: string
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
	type: 'drawStart' | 'draw' | 'drawEnd' | 'join' | 'leave' | 'pan' | 'state' | 'stickyNote-new' | 'stickyNote-edit' | 'stickyNote-move' | 'stickyNote-dragStart' | 'stickyNote-dragEnd' | 'stickyNote-delete' | 'stickyNote-transform' | 'image-new' | 'image-move' | 'image-dragStart' | 'image-dragEnd' | 'image-delete' | 'image-transform' | 'image-placeholder' | 'image-cancel'
	user: string
	data: any
	color?: string
	target?: string
	others?: Record<string, BoardUser>
}
