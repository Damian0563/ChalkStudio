import type { RegistrationRole } from "#shared/types";

export const githubStateCookieName = "githubOAuthState";
export type GithubOAuthState = { state: string; role: RegistrationRole };

export const githubCallbackPath = "/api/auth/github/callback";
export const githubRedirectUri = () => `${process.env.URL}${githubCallbackPath}`;
