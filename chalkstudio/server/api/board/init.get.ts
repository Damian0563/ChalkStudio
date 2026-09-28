import { validate as isUuid } from 'uuid'
import { emailPattern } from '#shared/types'

const notFound = () =>
	createError({ statusCode: 404, statusMessage: 'Not Found', message: 'This board does not exist.' })

const decodeMail = (mail: unknown): string | undefined => {
	if (typeof mail !== 'string') return
	const email = Buffer.from(mail, 'base64').toString('utf-8').trim().toLowerCase()
	return emailPattern.test(email) ? email : undefined
}

export default defineEventHandler(async (event): Promise<string> => {
	const { room, mail } = getQuery(event)
	if (typeof room !== 'string' || !isUuid(room)) throw notFound()

	const { getRoomDetails, getUserEmail, getUserByMail } = await useDatabase()
	const board = await getRoomDetails(room)
	if (!board) throw notFound()

	const isAllowed = (email: string | undefined): email is string => !!email && !!board.allowedUsers?.includes(email)
	const invitedMail = decodeMail(mail)
	const user = event.context.user ?? (isAllowed(invitedMail) ? await getUserByMail(invitedMail) : undefined)
	if (board.authorization !== 'public' && board.authorization !== 'link') {
		const isOwner = !!user && board.ownerId === Number(user.userId)
		const isInvited = !isOwner && board.authorization === 'invite'
			&& (isAllowed(invitedMail) || (!!user && isAllowed(await getUserEmail(user.userId))))
		if (!isOwner && !isInvited) {
			throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: "You don't have access to this board." })
		}
	}
	if (!user) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Please sign in to open this board.' })
	}
	return user.username
})
