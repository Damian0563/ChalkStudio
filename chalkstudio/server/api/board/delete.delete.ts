import { validate as isUuid } from "uuid";
const notFound = () =>
	createError({
		statusCode: 404,
		statusMessage: "Not Found",
		message: "This board does not exist.",
	});
export default defineEventHandler(async (event) => {
	if (!event.context.user)
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized",
			message: "Please sign in to edit a board.",
		});
	const { room } = getQuery(event);
	if (typeof room !== "string" || !isUuid(room)) throw notFound();
	const { deleteBoard, getRoomDetails } = await useDatabase();
	const existing = await getRoomDetails(room);
	if (!existing) throw notFound();
	if (existing.ownerId !== Number(event.context.user.userId)) {
		throw createError({
			statusCode: 403,
			statusMessage: "Forbidden",
			message: "Only the owner can delete this board.",
		});
	}
	try {
		await deleteBoard(room);
		return { modifiedAt: new Date().toISOString() };
	} catch {
		throw createError({
			statusCode: 500,
			statusMessage: "Internal Server Error",
			message: "Something went wrong.",
		});
	}
});
