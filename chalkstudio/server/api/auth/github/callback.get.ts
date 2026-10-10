import { cookieBase, startSession } from "#server/utils/auth/session";
import { readSavedState } from "~~/server/utils/auth/oauth";
import {
	githubCallbackPath,
	githubRedirectUri,
	githubStateCookieName,
} from "~~/server/utils/auth/oauth";

type GithubProfile = { login: string; name: string | null };
type GithubEmail = { email: string; primary: boolean; verified: boolean };

const githubFailed = () =>
	createError({
		statusCode: 401,
		statusMessage: "Unauthorized",
		message: "GitHub sign-in failed. Please try again.",
	});

export default defineEventHandler(async (event) => {
	const { code, state } = getQuery(event);
	const saved = readSavedState(getCookie(event, githubStateCookieName));
	deleteCookie(event, githubStateCookieName, { ...cookieBase, path: githubCallbackPath });
	if (typeof code !== "string" || !code || !saved || state !== saved.state) throw githubFailed();

	const clientId = process.env.GITHUB_CLIENT_ID;
	const clientSecret = process.env.GITHUB_AUTH_SECRET;
	if (!clientId || !clientSecret) {
		throw createError({
			statusCode: 500,
			statusMessage: "Internal Server Error",
			message: "GitHub sign-in is not available right now.",
		});
	}

	let profile: GithubProfile;
	let email: string | undefined;
	try {
		const { access_token: accessToken } = await $fetch<{ access_token?: string }>(
			"https://github.com/login/oauth/access_token",
			{
				method: "POST",
				headers: { Accept: "application/json" },
				body: {
					client_id: clientId,
					client_secret: clientSecret,
					code,
					redirect_uri: githubRedirectUri(),
				},
			},
		);
		if (!accessToken) throw githubFailed();
		const headers = {
			Accept: "application/vnd.github+json",
			Authorization: `Bearer ${accessToken}`,
			"User-Agent": "ChalkStudio",
		};
		const [user, emails] = await Promise.all([
			$fetch<GithubProfile>("https://api.github.com/user", { headers }),
			$fetch<GithubEmail[]>("https://api.github.com/user/emails", { headers }),
		]);
		profile = user;
		email = emails.find((entry) => entry.primary && entry.verified)?.email;
	} catch (error) {
		console.error("GitHub code exchange failed", error instanceof Error ? error.message : error);
		throw githubFailed();
	}
	if (!email) throw githubFailed();

	const { loginWithOAuth } = await useUserRepository();
	const { isNew, ...session } = await loginWithOAuth({
		name: profile.name || profile.login,
		email,
		role: saved.role,
	});
	startSession(event, session);
	return sendRedirect(event, isNew ? "/workspace?new=true" : "/workspace");
});
