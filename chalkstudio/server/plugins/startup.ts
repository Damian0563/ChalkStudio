import { useDatabase } from "../utils/db/database";
export default defineNitroPlugin(async () => {
	const { initConnection } = await useDatabase()
	await initConnection()
})
