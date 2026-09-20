# Cloud Tasks

Notes on how ChalkStudio defers work — confirmation mail today, LLM
review generation later — onto Google Cloud Tasks. Unlike
`refreshToken.md`, this one is implemented: the code lives in
`chalkstudio/server/utils/tasks/tasks.ts` and the infrastructure in
`main.tf`.

## Why a push queue and not Redis

The obvious shape for "send this email later" is a Redis-backed queue
with a worker process consuming jobs. That worker is the problem. Cloud
Run only guarantees CPU **during a request** and scales to zero between
them, so a long-lived consumer either does not run or has to be paid for
with `min-instances=1` and always-allocated CPU. Managed Redis costs
more still, because Memorystore is VPC-only and would drag a Serverless
VPC connector along with it.

Cloud Tasks inverts the direction. It is **push-based**: the queue holds
the job and then POSTs it back into the service, so a dispatch *is* an
ordinary HTTP request and the instance is awake by definition. There is
no worker to keep alive, and retries and backoff are the queue's job
rather than ours.

What Redis would still be right for is cross-instance pub/sub for the
whiteboard rooms in `server/routes/ws/session/[room].ts`. That is a
different problem and is not what this queue is for.

## A task is a name, a queue, and a function

Everything hangs off one small map:

```ts
const taskRunners = {
	"send-confirmation": {
		queue: "email",
		run: (payload: ConfirmationMail) => useMail().sendConfirmation(payload),
	},
}
```

The name is the only thing a caller passes. The URL is derived from it
(`/api/tasks/<name>`) rather than written down a second time, and the
payload type is read back off the runner's signature, so a caller cannot
enqueue a task with the wrong shape of body.

The endpoint file under `server/api/tasks/` is a **thin wrapper around
the same `run`**. It is not where the work lives. That distinction is
what makes the next section possible.

## The same function, two ways in

```
confirmation.post.ts → enqueue('send-confirmation', { email, code })
                                │
              ┌─────────────────┴─────────────────┐
         local                              deployed
              │                                   │
              │                    Cloud Tasks queue "email"
              │                                   │
              │                       POST /api/tasks/send-confirmation
              │                         + OIDC token for the invoker
              │                                   │
              │                       assertTaskRequest(event)
              └─────────────────┬─────────────────┘
                     useMail().sendConfirmation()
```

## How local and deployed differ

Google ships **no Cloud Tasks emulator**, so there is nothing to point a
development machine at. Locally the task body is simply awaited in
place.

|             | Local                      | Deployed                   |
| ----------- | -------------------------- | -------------------------- |
| Queue       | none                       | Cloud Tasks                |
| `run` via   | called in process          | HTTP `/api/tasks/<name>`   |
| Timing      | inline; request waits      | after the response         |
| Retries     | none; throws to caller     | the queue's `retry_config` |
| Body auth   | n/a — never over HTTP      | OIDC, `assertTaskRequest`  |
| Failure is  | a 500 on the caller        | a queue that drains late   |

The consequence worth remembering: **locally, a slow or failing task
fails the request that queued it.** In production the same failure is
invisible to the user and shows up as queue depth instead. Development
is therefore stricter than production, which is the right way round.

### The signal is `SERVICE_URL`, not a flag

Cloud Tasks pushes to an absolute URL, so the deployed environment has
to know the service's own public address. Development has no such
address, and no queue to give it to. That absence *is* the signal:

```ts
const serviceUrl = process.env.SERVICE_URL
if (!serviceUrl) return await run(payload)
```

No `NODE_ENV` check and no `IS_LOCAL` flag — the configuration the
deployed path genuinely needs is the same thing that distinguishes it.
This mirrors how `server/utils/db/database.ts` treats `PG_HOST`.

### Local does not go through the endpoint

The local path calls `run` directly and never issues an HTTP request, so
it never passes through `/api/tasks/<name>`. That is deliberate, and it
is a security property rather than a shortcut.

Because no legitimate local request ever arrives at those endpoints,
`assertTaskRequest` can demand a valid OIDC token **unconditionally**.
It has no development bypass to be tricked into, and when its
configuration is missing it answers `503` rather than falling open:

```ts
if (!serviceUrl || !invoker) {
	throw createError({ statusCode: 503, ... })
}
```

Had the local path instead POSTed to its own endpoint, the handler would
have needed an "allow unauthenticated when local" branch — and a
deployment that lost `SERVICE_URL` would have turned every task endpoint
into an open POST target.

## Authenticating a dispatch

The task endpoints sit on the same public service as the rest of the
site; they cannot be locked down at the IAM layer without taking the
website down with them. The OIDC token is therefore the entire defence,
and it is checked in-process.

Two service accounts exist for this, on purpose:

| Account                     | Role in the flow                 |
| --------------------------- | -------------------------------- |
| `chalkstudio-app`           | runs the service; enqueues tasks |
| `chalkstudio-tasks-invoker` | signs each dispatch              |

The app may *name* the invoker when creating a task, but only the queue
can mint a token for it. So a token identifying the invoker is proof the
request came from the queue, which is exactly what the handler checks —
that `claims.email` is the invoker and `email_verified` is true, with
the audience pinned to `SERVICE_URL`.

Naming another account in a task is impersonation, so the app account
needs `roles/iam.serviceAccountUser` **on the invoker account**. This is
the binding people forget: `roles/cloudtasks.enqueuer` alone is not
enough and `createTask` fails on the `oidcToken` field without it.

IAM bindings are not managed in `main.tf` — they are granted by hand.
Terraform creates the two accounts and stops there.

## CSRF has to be waived for these routes

`nuxt-csurf` protects every POST, and a Cloud Tasks dispatch carries no
CSRF cookie and cannot be given one. Without an exemption every task
would retry into a 403 until its attempts ran out.

```ts
routeRules: {
	'/api/tasks/**': { csurf: false },
}
```

Waiving it costs nothing here, because these routes are already held to
a stricter standard than a CSRF token — the OIDC check above.

## The status-code contract

A task handler is the one place in this codebase where the HTTP status
must be real. The rest of the API returns `{ status: 500 }` inside a
`200` response; Cloud Tasks reads the status code and nothing else.

| Handler answers | Queue does         | Use it for                  |
| --------------- | ------------------ | --------------------------- |
| `2xx`           | marks it done      | success, unfixable payloads |
| anything else   | retries per config | transient failure           |

Both halves matter. Returning `200` while reporting failure in the body
silently drops the task. Returning an error for a **malformed payload**
is equally wrong: no retry can repair it, so it would only burn the
retry budget before being dropped anyway. Cloud Tasks has no "permanent
failure" status, so a payload that can never succeed is logged and
acknowledged.

## Configuration

| Variable           | Local   | Deployed                              |
| ------------------ | ------- | ------------------------------------- |
| `SERVICE_URL`      | unset   | the Cloud Run URL, from `main.tf`     |
| `TASKS_LOCATION`   | unset   | `var.region`                          |
| `TASKS_INVOKER_SA` | unset   | the invoker account's email           |

None are secret, so all three are plain environment variables on the
Cloud Run service rather than Secret Manager entries. The project id is
not configured at all — both clients resolve it from the metadata
server, the same way `server/utils/secrets/secrets.ts` does.

`SERVICE_URL` is *computed* in Terraform rather than read back off the
service, because Cloud Tasks needs the address before the service
exists and reading `.uri` would be a dependency cycle. Cloud Run derives
its URL from the project number, which is known up front. **Verify this
after the first apply** — a project still issuing legacy hashed URLs
needs the real value substituted.

## Queue settings, and why they differ

| Queue     | Attempts | Concurrency | Backoff   |
| --------- | -------- | ----------- | --------- |
| `email`   | 10       | 20          | 5s–300s   |
| `reviews` | 3        | 5           | 30s–600s  |

Mail is cheap to retry and worth retrying for an hour: a provider outage
should drain late rather than lose a sign-up code. Review generation
calls a paid model, so every retry costs money — few attempts, slow
backoff, and a concurrency ceiling that doubles as a spend limit.

## Not done yet

- `useMail().sendConfirmation` logs instead of sending. Picking a
  transactional provider is the only thing left there; throwing on a
  failed send is correct, since the queue will retry.
- The `reviews` queue exists but has no runner and no endpoint. Adding
  one is an entry in `taskRunners` plus a file under `server/api/tasks/`.
- Nothing deploys yet — there is no Dockerfile and `ci.yml` stops after
  the tests, so the Cloud Run service has no image to run.
