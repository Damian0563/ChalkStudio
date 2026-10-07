import type { RegistrationRole } from "#shared/types";
import { registrationRoles } from "#shared/types";
export const githubStateCookieName = "githubOAuthState";
export const microsoftStateCookieName = "microsoftOAuthState";
export type OAuthState = { state: string; role: RegistrationRole };

export const githubCallbackPath = "/api/auth/github/callback";
export const microsoftCallbackPath = "/api/auth/microsoft/callback";
export const githubRedirectUri = () => `${process.env.URL}${githubCallbackPath}`;
export const azureRedirectUri = () => `${process.env.URL}${microsoftCallbackPath}`;
export const microsoftAuthority = "https://login.microsoftonline.com/common";
// Tenant that every personal Microsoft account (outlook.com, hotmail.com, ...) signs in through.
const microsoftConsumerTenant = "9188040d-6c67-4c5b-b112-36a304b66dad";

type MicrosoftIdClaims = {
	aud?: string;
	tid?: string;
	email?: string;
	name?: string;
	given_name?: string;
	xms_edov?: boolean;
};

export const readMicrosoftIdentity = (
	idToken: string,
	clientId: string,
): { name: string; email: string } | undefined => {
	try {
		const claims = JSON.parse(
			Buffer.from(idToken.split(".")[1] ?? "", "base64url").toString("utf-8"),
		) as MicrosoftIdClaims;
		if (claims.aud !== clientId || !claims.email) return;
		if (claims.tid !== microsoftConsumerTenant && claims.xms_edov !== true) return;
		return {
			name: claims.name ?? claims.given_name ?? claims.email.split("@")[0]!,
			email: claims.email,
		};
	} catch {
		return;
	}
};

export const readSavedState = (raw: string | undefined): OAuthState | undefined => {
	try {
		const saved = JSON.parse(raw ?? "") as Partial<OAuthState>;
		if (typeof saved.state !== "string" || !registrationRoles.includes(saved.role!)) return;
		return saved as OAuthState;
	} catch {
		return;
	}
};
