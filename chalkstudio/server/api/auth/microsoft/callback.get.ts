import {
	microsoftAuthority,
	microsoftCallbackPath,
	readMicrosoftIdentity,
	readSavedState,
} from "~~/server/utils/auth/oauth";
import { registrationRoles } from "#shared/types";
export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	const { code, state } = query;
	const cookie = getCookie(event, microsoftStateCookieName);
	const clientId = process.env.AZURE_CLIENT_ID;
	const clientSecret = process.env.AZURE_SECRET;
	const role = readSavedState(cookie)?.role;
	if (!role || !state)
		throw createError({
			statusCode: 400,
			statusMessage: "Bad Request",
			message: "Invalid request.",
		});
	if (
		!clientId ||
		!clientSecret ||
		!code ||
		!cookie ||
		readSavedState(cookie)?.state !== state ||
		!registrationRoles.includes(role)
	)
		throw createError({ statusCode: 500 });
	deleteCookie(event, microsoftStateCookieName, {
		...cookieBase,
		path: microsoftCallbackPath,
	});
	try {
		const { id_token: idToken } = await $fetch<{ id_token?: string }>(
			`${microsoftAuthority}/oauth2/v2.0/token`,
			{
				method: "POST",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: {
					client_id: clientId,
					client_secret: clientSecret,
					code,
					scope: "openid email profile",
					grant_type: "authorization_code",
					redirect_uri: azureRedirectUri(),
				},
			},
		);
		const identity = idToken ? readMicrosoftIdentity(idToken, clientId) : undefined;
		if (!identity) throw new Error("Invalid response");
		const { loginWithOAuth } = await useDatabase();
		const result = await loginWithOAuth({ ...identity, role });
		startSession(event, {
			identity: result.identity,
			refreshToken: result.refreshToken,
		} as Session);
		const redirectLoc = result.isNew ? "/workspace?new=true" : "/workspace";
		return sendRedirect(event, redirectLoc, 302);
	} catch {
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized",
			message: "Microsoft sign-in failed. Please try again.",
		});
	}
});
