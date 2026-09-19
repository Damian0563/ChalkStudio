import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
// Mirrors local.secret_names in main.tf: each secret Terraform provisions is stored
// under the exact name of the environment variable the app reads it from.
const secretNames = ["JWT_SECRET", "PG_USER", "PG_PASS", "PG_NAME", "PG_CONNECTION_NAME"] as const

export const useSecrets = () => {
	// A PG_HOST points the app at a local Postgres (docker-compose), so the Cloud SQL
	// connector - and the instance name it needs - never comes into play.
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

	// Anything already in the environment wins, so a local .env keeps Secret Manager -
	// and the credentials it would need - out of the development loop entirely.
	const resolveSecrets = async (): Promise<void> => {
		const missing = secretNames.filter((name) => !process.env[name] && isNeeded(name))
		if (!missing.length) return

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

	return {
		resolveSecrets,
	}
}
