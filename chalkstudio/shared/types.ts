export type UserJWTId = {
	userId: string;
	username: string;
	role: "student" | "teacher-basic" | "teacher-pro" | "teacher-ultra" | "admin";
	exp: number;
	iat: number;
	opts?: any
}

// The claims a session is rebuilt from; the token adds its own lifetime on top.
export type UserIdentity = Omit<UserJWTId, "exp" | "iat">


// The roles anyone may pick for themselves at sign-up; paid teacher tiers and admin
// are granted later, never taken from the registration form.
export const registrationRoles = ["student", "teacher-basic"] as const
export type RegistrationRole = typeof registrationRoles[number]

export type UserSignUpPayload = {
	name: string;
	email: string;
	password: string;
	role: RegistrationRole;
	code: string;
}


