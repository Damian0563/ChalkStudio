import { boardAccessModes, boardDescriptionMax, boardTitleMax, emailPattern, type BoardCreationPayload } from '#shared/types'

const badRequest = (message: string) =>
	createError({ statusCode: 400, statusMessage: 'Bad Request', message })

export const parseBoardPayload = (input: unknown): BoardCreationPayload => {
	const body: Partial<BoardCreationPayload> = input && typeof input === 'object' ? input : {}
	const title = typeof body.title === 'string' ? body.title.trim() : ''
	const description = typeof body.description === 'string' ? body.description.trim() : ''
	const authorization = body.authorization

	if (title === '' || title.length > boardTitleMax) throw badRequest('Please give the board a title.')
	if (description.length > boardDescriptionMax) throw badRequest('The description is too long.')
	if (!authorization || !boardAccessModes.includes(authorization)) throw badRequest('Please choose who can join.')

	let allowedUsers: string[] = []
	if (authorization === 'invite') {
		if (!Array.isArray(body.allowedUsers)) throw badRequest('Please invite at least one person.')
		allowedUsers = [...new Set(body.allowedUsers.map((email) => String(email).trim().toLowerCase()))]
		if (allowedUsers.length === 0) throw badRequest('Please invite at least one person.')
		if (allowedUsers.some((email) => !emailPattern.test(email))) throw badRequest('Some invites are not valid emails.')
	}

	return { title, description, authorization, allowedUsers }
}
