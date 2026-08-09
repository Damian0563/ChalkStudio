

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
