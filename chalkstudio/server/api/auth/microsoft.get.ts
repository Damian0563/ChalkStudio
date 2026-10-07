import { registrationRoles, type RegistrationRole } from "#shared/types";
import {
	microsoftAuthority,
	microsoftCallbackPath,
	microsoftStateCookieName,
	type OAuthState,
} from "~~/server/utils/auth/oauth";
import { randomUUID } from "node:crypto";
export default defineEventHandler(async (event) => {
	const { role: requestedRole } = getQuery(event);
	const role = (requestedRole ?? "student") as RegistrationRole;
	if (!registrationRoles.includes(role)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Bad Request",
			message: "Please choose a valid account type.",
		});
	}
	const clientId = process.env.AZURE_CLIENT_ID;
	if (!clientId) {
		throw createError({
			statusCode: 500,
			statusMessage: "Internal Server Error",
			message: "Microsoft sign-in is not available right now.",
		});
	}
	const state = randomUUID();
	setCookie(event, microsoftStateCookieName, JSON.stringify({ state, role } satisfies OAuthState), {
		...cookieBase,
		path: microsoftCallbackPath,
		maxAge: 60 * 10,
	});
	const params = new URLSearchParams({
		client_id: clientId,
		response_type: "code",
		redirect_uri: azureRedirectUri(),
		response_mode: "query",
		state: state,
		scope: "openid email profile",
	});
	return {
		url: `${microsoftAuthority}/oauth2/v2.0/authorize?${params}`,
	};
});
