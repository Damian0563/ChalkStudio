export type ConfirmationMail = {
	email: string;
	code: string;
}

export type InviteMail = {
	email: string;
	room: string;
}

export const useMail = () => {
	const sendConfirmation = async (mail: ConfirmationMail): Promise<void> => {
		console.info(`confirmation code for ${mail.email}: ${mail.code}`)
	}

	// The board init endpoint decodes `mail` back into the invitee's email.
	const sendInvite = async (mail: InviteMail): Promise<void> => {
		const url = `${process.env.URL}/session/${mail.room}?mail=${Buffer.from(mail.email).toString('base64url')}`
		console.info(`invite for ${mail.email}, url: ${url}`)
	}

	return {
		sendConfirmation,
		sendInvite,
	}
}
