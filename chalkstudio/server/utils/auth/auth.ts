


class AuthService {

	private attachHeaders(jwt: string): string {
		const header = ''
		return `${header}.${jwt}`
	}

	public signJWT(payload: any): string {

		return this.attachHeaders("test")
	}

}


export const authService = new AuthService();
