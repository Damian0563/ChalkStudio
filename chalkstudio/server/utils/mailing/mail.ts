export type ConfirmationMail = {
	email: string;
	code: string;
}

export const useMail = () => {
	const sendConfirmation = async (mail: ConfirmationMail): Promise<void> => {
		console.info(`confirmation code for ${mail.email}: ${mail.code}`)
	}

	return {
		sendConfirmation,
	}
}
