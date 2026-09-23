export type UserJWTId = {
	userId: string;
	username: string;
	role: "student" | "teacher-basic" | "teacher-pro" | "teacher-ultra" | "admin";
	exp: number;
	iat: number;
	opts?: any
}

export type UserIdentity = Omit<UserJWTId, "exp" | "iat">


export const registrationRoles = ["student", "teacher-basic"] as const
export type RegistrationRole = typeof registrationRoles[number]

export type UserSignUpPayload = {
	name: string;
	email: string;
	password: string;
	role: RegistrationRole;
	code: string;
}


export const boardAccessModes = ["public", "link", "invite", "private"] as const
export type BoardAccess = typeof boardAccessModes[number]

export type BoardMeta = {
	id: string;
	title: string;
	description: string;
	image: string | null;
	data: string;
	imageSources: Record<string, string>;
	authorization: BoardAccess;
	allowedUsers: string[];
}

export type BoardCreationPayload = Pick<BoardMeta, "title" | "description" | "authorization" | "allowedUsers">;

// What POST /api/images hands back. The id is what the board keeps - on the
// Konva node as `imageId`, and as the key into `imageSources` - while the URL
// is minted per request and is only good for drawing the image right now.
export type UploadedImage = {
	imageId: string;
	url: string;
}

export type Class = {
	start: Date;
	end: Date;
	topic: string;
	participants: string[];
}

export type Workspace = {
	boards: BoardMeta[];
	userIdentity: UserIdentity;
	schedule: Class[];
	isNew: boolean;
}
