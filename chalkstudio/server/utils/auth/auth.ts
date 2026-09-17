import { createHmac, timingSafeEqual } from "crypto";
import type { UserJWTId } from "#shared/types";

class AuthService {
	static refreshDelta = 1000 * 60 * 15;

	public generateJWT(user: Omit<UserJWTId, "exp" | "iat">): string | Error {
		const payload: UserJWTId = {
			...user,
			exp: Date.now() + AuthService.refreshDelta,
			iat: Date.now()
		}
		return this.signJWT(payload);
	}

	private signJWT(payload: UserJWTId): string | Error {
		const header = {
			"alg": "HS256",
			"typ": "JWT"
		}
		const secret: string | undefined = process.env.JWT_SECRET;
		if (!secret) {
			return new Error("JWT_SECRET is not set");
		}
		try {
			const token: string = `${Buffer.from(JSON.stringify(header), 'utf-8').toString("base64url")}.${Buffer.from(JSON.stringify(payload), 'utf-8').toString("base64url")}`;
			const sig: string = createHmac("sha256", secret)
				.update(token)
				.digest("base64url");
			return `${token}.${sig}`;
		} catch {
			return new Error("Error creating JWT");
		}
	}

	private assertHeader(header: Record<string, string>): boolean {
		return header.alg === "HS256" && header.typ === "JWT";
	}

	public verifyJWT(token: string): UserJWTId | Error {
		const secret: string | undefined = process.env.JWT_SECRET;
		if (!secret) {
			return new Error("JWT_SECRET is not set");
		}
		try {
			const parts = token.split(".");
			const [header, payload, signature] = parts;
			if (parts.length !== 3 || !header || !payload || !signature) return new Error("Malformed token");
			const decodedHeader = JSON.parse(Buffer.from(header, "base64url").toString("utf-8"));
			if (!this.assertHeader(decodedHeader)) return new Error("Invalid header");
			const expected = createHmac("sha256", secret)
				.update(`${header}.${payload}`)
				.digest();
			const received = Buffer.from(signature, "base64url");
			if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
				return new Error("Invalid signature");
			}
			const decodedPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
			if (!decodedPayload.userId || !decodedPayload.username || !decodedPayload.role) return new Error("Invalid payload");
			if (decodedPayload.exp < Date.now()) return new Error("Token expired");
			return decodedPayload as UserJWTId;
		} catch {
			return new Error("Error verifying JWT");
		}
	}

	public refreshJWT(token: string): string | Error {
		const payload = this.verifyJWT(token);
		if (payload instanceof Error) return payload;
		const { exp, iat, ...identity } = payload;
		return this.generateJWT(identity);
	}
}

export const authService = new AuthService();
