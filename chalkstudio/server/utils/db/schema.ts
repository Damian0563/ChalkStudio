import { index, integer, pgTable, varchar, date } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	name: varchar("name").notNull(),
	role: varchar("role").notNull(),
	email: varchar("email").notNull().unique(),
	password: varchar("password").notNull(),
	createdAt: date("created_at").notNull(),
	refreshToken: varchar("refresh_token"),
}, (t) => [
	index("users_id_idx").on(t.id),
	index("users_refresh_token_idx").on(t.refreshToken),
])


export const boards = pgTable("boards", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	ownerId: integer("owner").notNull().references(() => users.id),
	image: varchar("image"),
	name: varchar("name").notNull(),
	description: varchar("description").notNull(),
	data: varchar("data"),
	modifiedAt: date("modified_at").notNull(),
	authorization: varchar("authorization"),
	allowedUsers: varchar("allowed_users"),
}, (t) => [
	index("boards_owner_idx").on(t.ownerId),
])
