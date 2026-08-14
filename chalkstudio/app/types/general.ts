
export type AnnounceMessage = {
	message: string
	sentiment: 'positive' | 'negative'
	title: string
}


export type QuickNotice = {
	message: string
	type: 'success' | 'error' | 'warning'
}
