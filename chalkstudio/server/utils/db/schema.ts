import { index, integer, pgTable, varchar, date, timestamp, json, uuid } from "drizzle-orm/pg-core";
import type { BoardAccess } from "#shared/types";

export const users = pgTable("users", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	name: varchar("name").notNull(),
	role: varchar("role").notNull(),
	email: varchar("email").notNull().unique(),
	// Null for accounts created through Google sign-in, which never set a password.
	password: varchar("password"),
	createdAt: date("created_at").notNull(),
	refreshToken: varchar("refresh_token"),
}, (t) => [
	index("users_id_idx").on(t.id),
	index("users_refresh_token_idx").on(t.refreshToken),
])

export const codes = pgTable("codes", {
	mail: varchar("mail").notNull().unique(),
	code: varchar("code").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (t) => [
	index("codes_mail_idx").on(t.mail),
])


export const boards = pgTable("boards", {
	id: uuid("id").primaryKey(),
	ownerId: integer("owner").notNull().references(() => users.id),
	image: varchar("image"),
	title: varchar("title").notNull(),
	imageSources: json("image_sources"),
	description: varchar("description"),
	data: json("data"),
	modifiedAt: timestamp("modified_at", { withTimezone: true }).notNull(),
	authorization: varchar("authorization").$type<BoardAccess>().default("public"),
	allowedUsers: json("allowed_users").$type<string[]>(),
}, (t) => [
	index("boards_owner_idx").on(t.ownerId),
])
