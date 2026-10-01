import type { H3Event } from 'h3'
import { emailPattern, type BoardInitDetails, type UserIdentity } from '#shared/types'

const decodeMail = (mail: unknown): string | undefined => {
	if (typeof mail !== 'string') return
	const email = Buffer.from(mail, 'base64').toString('utf-8').trim().toLowerCase()
	return emailPattern.test(email) ? email : undefined
}

export const resolveBoardAccess = async (event: H3Event, board: BoardInitDetails & { ownerId: number }, mail: unknown): Promise<UserIdentity | undefined> => {
	const { getUserEmail, getUserByMail } = await useDatabase()
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
	return user
}
