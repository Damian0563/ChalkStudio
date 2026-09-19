import { useSecrets } from "../utils/secrets/secrets";
import { useDatabase } from "../utils/db/database";
export default defineNitroPlugin(async () => {
	const { resolveSecrets } = useSecrets()
	await resolveSecrets()

	const { initConnection } = await useDatabase()
	await initConnection()
})
