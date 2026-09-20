import { CloudTasksClient } from "@google-cloud/tasks";
import { OAuth2Client } from "google-auth-library";
import type { H3Event } from "h3";
import { useMail, type ConfirmationMail } from "../mailing/mail";

const taskRunners = {
	"send-confirmation": {
		queue: "email",
		run: (payload: ConfirmationMail) => useMail().sendConfirmation(payload),
	},
} satisfies Record<string, { queue: string; run: (payload: never) => Promise<void> }>

export type TaskName = keyof typeof taskRunners
type TaskPayload<T extends TaskName> = Parameters<(typeof taskRunners)[T]["run"]>[0]

export const taskPath = (name: TaskName): string => `/api/tasks/${name}`

let tasksClient: CloudTasksClient | undefined
let oauthClient: OAuth2Client | undefined

export const useTasks = () => {
	const serviceUrl = process.env.SERVICE_URL

	const enqueue = async <T extends TaskName>(name: T, payload: TaskPayload<T>): Promise<void> => {
		const task = taskRunners[name]
		const run = task.run as (payload: TaskPayload<T>) => Promise<void>
		if (!serviceUrl) return await run(payload)

		const serviceAccountEmail = process.env.TASKS_INVOKER_SA
		const location = process.env.TASKS_LOCATION
		if (!serviceAccountEmail || !location) {
			throw new Error("TASKS_INVOKER_SA and TASKS_LOCATION must be set wherever SERVICE_URL is")
		}

		const client = (tasksClient ??= new CloudTasksClient())
		const project = await client.getProjectId()
		await client.createTask({
			parent: client.queuePath(project, location, task.queue),
			task: {
				httpRequest: {
					httpMethod: "POST",
					url: `${serviceUrl}${taskPath(name)}`,
					headers: { "Content-Type": "application/json" },
					body: Buffer.from(JSON.stringify(payload)).toString("base64"),
					oidcToken: { serviceAccountEmail, audience: serviceUrl },
				},
			},
		})
	}

	return {
		enqueue,
	}
}

export const assertTaskRequest = async (event: H3Event): Promise<void> => {
	const serviceUrl = process.env.SERVICE_URL
	const invoker = process.env.TASKS_INVOKER_SA
	if (!serviceUrl || !invoker) {
		throw createError({ statusCode: 503, statusMessage: "Task handling is not configured" })
	}

	const idToken = (getHeader(event, "authorization") ?? "").replace(/^Bearer /, "")
	try {
		const client = (oauthClient ??= new OAuth2Client())
		const claims = (await client.verifyIdToken({ idToken, audience: serviceUrl })).getPayload()
		if (claims?.email !== invoker || claims.email_verified !== true) throw new Error("unexpected invoker")
	} catch {
		throw createError({ statusCode: 403, statusMessage: "Invalid task token" })
	}
}
