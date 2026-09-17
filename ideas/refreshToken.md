# Refresh tokens

Notes on moving ChalkStudio's auth from a single long-lived JWT to an
access token + refresh token pair. Nothing here is implemented yet; the
current implementation lives in `chalkstudio/server/utils/auth/auth.ts`.

## Why two tokens

The two properties we want are mutually exclusive in a single token. A
token that travels on every request should be **short-lived**, because a
JWT cannot be revoked — `verifyJWT` never touches the database, it just
recomputes an HMAC. A token that keeps someone logged in for a week
needs to be **revocable**, which requires server-side state. One token
cannot be both, so the two roles get split.

## The refresh token is not a JWT

A JWT is self-describing because the server keeps no state to consult —
the claims travel inside it. A refresh token is the opposite: its
validity comes entirely from a database row, so there is nothing to
encode. The right shape is an opaque random string:

```ts
randomBytes(32).toString("base64url")
```

256 bits of randomness, unguessable, carrying no claims that can go
stale. Store a **hash** of it, exactly like a password, so a database
leak does not hand out a pile of live sessions.

## Shape of the two tokens

|             | Access token       | Refresh token              |
| ----------- | ------------------ | -------------------------- |
| Form        | JWT                | random opaque string       |
| Lifetime    | 15 min             | 7–30 days                  |
| Sent        | every request      | only to `/api/auth/refresh`|
| Verified by | signature math     | DB lookup                  |
| Revocable   | no                 | yes — delete the row       |

Both are issued at login, after the password check, as
`httpOnly; Secure; SameSite=Lax` cookies.

The refresh cookie gets `Path=/api/auth/refresh`. This is the detail
that keeps it rarely exposed: the browser will not attach it to any
other request, so it never reaches the board endpoints, the WebSocket
handshake in `server/routes/ws/session/[room].ts`, or the header-logging
middleware in `server/middleware/logs.ts`.

## The refresh cycle

1. Client calls an API; the access token is past its 15 minutes;
   `verifyJWT` returns `Token expired`; the endpoint answers **401**.
2. Client calls `POST /api/auth/refresh`, with no body — the cookie
   rides along automatically.
3. Server hashes the presented token and looks up the `sessions` row.
   No row, expired, or already revoked → 401, and the user logs in again.
4. Server **re-reads the `users` row** and builds the claims from it,
   rather than copying them out of the old token.
5. Server issues a new access token *and* a new refresh token, deleting
   the old session row. This is **rotation**.
6. Client retries the original request.

Steps 1, 2 and 6 belong in a client-side fetch interceptor, so the user
never sees any of it.

## Rotation makes theft detectable

Each refresh token is single-use. If one is ever presented twice, two
parties hold it — the legitimate client and whoever copied it. That
second presentation is proof of compromise, so the whole session family
gets deleted and everyone re-logs-in. This detector cannot be built with
a stateless token: nothing in a JWT-only design can notice that the same
token is being used from two places.

## Logout

Delete the session row and the refresh token is dead. The access token
stays valid for up to 15 more minutes; that residual window is the price
of statelessness, and it is exactly why the access lifetime is short.

## On stale claims

`UserJWTId.role` encodes subscription tiers (`teacher-basic`,
`teacher-pro`, `teacher-ultra`), so a role that lags behind the database
is a billing problem as much as a permissions one.

The fast path is client-driven: when the frontend observes an event that
invalidates its claims — a tier change, a demotion, a logout — it drops
its access token and the next request goes through the refresh route
above, rebuilding claims from the `users` row. That is immediate, and
better than waiting out the expiry.

It is not a substitute for the short expiry, for three reasons:

- The frontend is not a trust boundary. Discarding the token is a
  request to the client, and a client that benefits from ignoring it
  (a cancelled subscriber holding a valid `teacher-ultra` token) simply
  will not comply.
- Only the device that receives the signal acts on it. If an admin
  demotes a user, it is the *admin's* browser that knows. The demoted
  user's other tabs, phone and second laptop keep their old tokens
  until something pushes the change to them.
- With `httpOnly` cookies, client-side JavaScript cannot read or clear
  the token at all — that is the point of `httpOnly`. Clearing it means
  asking the server, which is server-side revocation again, and still
  does nothing about copies taken off the wire.

So: client-driven refresh is a latency optimisation for the cooperative
case, and the 15-minute expiry is the backstop that bounds the
uncooperative one.

## Schema work needed

`chalkstudio/server/utils/db/schema.ts` has no session storage yet. A
`sessions` table needs roughly:

- `id`
- `userId` — references `users.id`
- `tokenHash`
- `expiresAt`
- `createdAt`
- a device / user-agent label, if active-session UI is wanted

## Unrelated but worth doing first

`server/middleware/logs.ts` logs `JSON.stringify(event.headers)` on
every request that is not `/`. Once auth is wired up, that writes tokens
to stdout on every call, and on Cloud Run stdout goes to Cloud Logging —
retained and searchable. The `authorization` and `cookie` headers should
be redacted before any of this reaches production.
