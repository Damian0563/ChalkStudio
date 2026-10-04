import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
const secretNames = ["JWT_SECRET", "PG_USER", "PG_PASS", "PG_NAME", "PG_CONNECTION_NAME", "URL", "GOOGLE_AUTH_SECRET", "GITHUB_AUTH_SECRET", "GITHUB_CLIENT_ID", "GOOGLE_CLIENT_ID"]

export const useSecrets = () => {
	const isNeeded = (name: string): boolean => name !== "PG_CONNECTION_NAME" || !process.env.PG_HOST

	const readSecret = async (client: SecretManagerServiceClient, project: string, name: string): Promise<string> => {
		try {
			const [version] = await client.accessSecretVersion({
				name: `projects/${project}/secrets/${name}/versions/latest`,
			})
			const data = version.payload?.data
			const value = typeof data === "string" ? data : Buffer.from(data ?? []).toString("utf-8")
			if (!value) throw new Error("secret holds an empty value")
			return value
		} catch (e) {
			throw new Error(`Could not resolve secret ${name}: ${e instanceof Error ? e.message : e}`)
		}
	}

	const resolveSecrets = async (): Promise<void> => {
		const missing = secretNames.filter((name) => !process.env[name] && isNeeded(name))
		if (missing.length) {
			const client = new SecretManagerServiceClient()
			try {
				const project = await client.getProjectId()
				const values = await Promise.all(missing.map((name) => readSecret(client, project, name)))
				missing.forEach((name, i) => {
					process.env[name] = values[i]
				})
			} finally {
				await client.close()
			}
		}
		process.env.NUXT_PUBLIC_GOOGLE_SIGN_IN_CLIENT_ID ||= process.env.GOOGLE_CLIENT_ID
	}

	return {
		resolveSecrets,
	}
}
