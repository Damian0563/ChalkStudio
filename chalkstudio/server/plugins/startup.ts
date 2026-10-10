import { useSecrets } from "../utils/secrets/secrets";
import { initConnection } from "../utils/db/connection";
export default defineNitroPlugin(async () => {
	const { resolveSecrets } = useSecrets()
	await resolveSecrets()

	await initConnection()
})
