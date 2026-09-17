export type UserJWTId = {
	userId: string;
	username: string;
	role: "student" | "teacher-basic" | "teacher-pro" | "teacher-ultra" | "admin";
	exp: number;
	iat: number;
	opts?: any
}

