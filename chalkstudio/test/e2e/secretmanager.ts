import { test, expect } from "vitest"
import { useSecrets } from "../../server/utils/secrets/secrets"


test("Secret Manager", async () => {
	const { resolveSecrets } = useSecrets()
	await resolveSecrets()
	expect(process.env.JWT_SECRET).toBeDefined()
	expect(process.env.PG_USER).toBeDefined()
	expect(process.env.PG_PASS).toBeDefined()
	expect(process.env.PG_NAME).toBeDefined()
	expect(process.env.PG_CONNECTION_NAME).toBeDefined()
})
