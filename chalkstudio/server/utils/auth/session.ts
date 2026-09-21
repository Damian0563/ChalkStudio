import { createError, deleteCookie, setCookie, type H3Event } from "h3";
import type { UserIdentity } from "#shared/types";
import { AuthService, authService } from "./auth";

export const accessCookieName = "accessToken";
export const refreshCookieName = "refreshToken";

const cookieBase = {
	httpOnly: true,
	secure: !import.meta.dev,
	sameSite: "lax",
	path: "/",
} as const;

export type Session = { identity: UserIdentity; refreshToken: string };

export const startSession = (event: H3Event, session: Session) => {
	const accessToken = authService.generateJWT(session.identity);
	if (accessToken instanceof Error) {
		throw createError({ statusCode: 500, statusMessage: "Internal Server Error", message: "Could not start a session. Please try again later." });
	}
	setCookie(event, accessCookieName, accessToken, { ...cookieBase, maxAge: AuthService.refreshDelta / 1000 });
	setCookie(event, refreshCookieName, session.refreshToken, { ...cookieBase, maxAge: 60 * 60 * 24 * 30 });
};

export const endSession = (event: H3Event) => {
	deleteCookie(event, accessCookieName, cookieBase);
	deleteCookie(event, refreshCookieName, cookieBase);
};

declare module "h3" {
	interface H3EventContext {
		user?: UserIdentity;
	}
}
