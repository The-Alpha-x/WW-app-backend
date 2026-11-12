# Witch Woofie API — Cloudflare Workers edition

Express 5 API for the Witch Woofie app. Uses MongoDB Atlas with Mongoose 9, JWT access/refresh tokens, HttpOnly cookies, couple invitations, and couple-scoped task CRUD.

## Runtime architecture

- Cloudflare Workers runs the Express app through `httpServerHandler`.
- MongoDB access uses a **new Mongoose connection per API request**, scoped with `AsyncLocalStorage`; it closes when the response finishes.
- The per-request connection design avoids reusing TCP sockets across Worker invocations. The trade-off is connection setup latency on every API request. This direct-connection option is intended for low-traffic use and initial deployment/testing. If connection overhead becomes material, migrate database operations into a Durable Object to reuse the MongoDB connection.
- Couple creation and invitation acceptance continue to use MongoDB transactions. Use MongoDB Atlas or another replica-set deployment that supports transactions.

## Requirements

- Node.js 20.19+ for local development
- npm
- Cloudflare account
- MongoDB Atlas cluster with network access configured for Cloudflare Workers

## Local development

Install dependencies:

```bash
npm install
```

For local Node.js server mode, copy `.env.example` to `.env`, fill in the values, then run:

```bash
npm run dev:node
```

For Cloudflare's local Worker runtime, copy `.dev.vars.example` to `.dev.vars`, fill in the secrets, then run:

```bash
npm run dev
```

The API health endpoint is `/health`. Local Node mode defaults to `http://localhost:4000`; Wrangler prints its local URL (usually `http://localhost:8787`).

### 4. GitHub automatic deployment (optional)

You can connect the repository through the Cloudflare Workers Builds dashboard. Set the build/deploy command to `npx wrangler deploy`; no separate frontend build is required. Ensure the repository root is this backend folder if it is in a monorepo. Configure the three secrets in the Worker settings rather than in GitHub source.

## Worker environment variables

`wrangler.jsonc` currently sets these non-secret production values:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `FRONTEND_ORIGINS` | `http://localhost:3000,https://witch-woofie-app.pages.dev` |
| `COOKIE_DOMAIN` | empty |
| `COOKIE_SAME_SITE` | `none` |
| `COOKIE_SECURE` | `true` |
| `ACCESS_TOKEN_TTL` | `15m` |
| `REFRESH_TOKEN_DAYS` | `30` |
| `INVITATION_TTL_HOURS` | `48` |
| `BCRYPT_ROUNDS` | `12` |

Change `FRONTEND_ORIGINS` if your Pages hostname changes. Keep `COOKIE_DOMAIN` empty for `pages.dev` + `workers.dev`. Since these are different sites, cookies use `SameSite=None; Secure`; browser third-party-cookie restrictions may still prevent authentication cookies from working in some browsers. A custom domain arrangement under the same registrable domain is recommended for reliable cookie auth.

## MongoDB Atlas network access

Workers do not provide a single fixed outbound IP address by default. Atlas must accept connections from the Worker. For a quick test, Atlas Network Access may need `0.0.0.0/0`; this permits connections from any IP, so only do this with a strong database password, a dedicated least-privilege database user, and an appropriately secured cluster. Review Cloudflare's current static-egress options before production if you need IP allowlisting.

## API endpoints

All JSON request bodies use `Content-Type: application/json`. Browser requests must use `credentials: "include"`.

### Authentication

- `POST /api/auth/register` — `{ "email", "password", "displayName" }`; password minimum 12 characters.
- `POST /api/auth/login` — `{ "email", "password" }`
- `POST /api/auth/refresh` — rotates refresh token using the HttpOnly refresh cookie.
- `POST /api/auth/logout` — revokes current refresh session and clears cookies.
- `GET /api/auth/me` — current user.

### Couples

All require authentication.

- `POST /api/couples` — create your couple: `{ "name": "Our Little World" }`
- `POST /api/couples/invitation` — create one-time invitation.
- `POST /api/couples/join` — second account joins: `{ "invitationCode": "..." }`
- `GET /api/couples/me` — current couple and member profiles.

### Tasks

All require authentication and couple membership.

- `GET /api/tasks`
- `POST /api/tasks` — `{ "title", "description?", "assignedTo?", "dueDate?", "priority?" }`
- `PATCH /api/tasks/:taskId`
- `DELETE /api/tasks/:taskId`

## Important production limitations

1. **Direct MongoDB connection latency:** Each API request establishes and closes a connection. Cloudflare documents this direct approach for low-traffic use; Durable Objects are recommended for connection reuse and lower warm-request latency.
2. **Rate limiting:** `express-rate-limit`'s default in-memory store is per Worker isolate, not a globally shared counter. Use a shared rate-limit store or Cloudflare rate limiting rules before relying on it for production abuse prevention.
3. **Third-party cookies:** `pages.dev` and `workers.dev` are cross-site. `SameSite=None; Secure` is necessary for cross-site cookie requests but does not override browser third-party-cookie blocking.
4. **CSRF:** Add Origin validation/CSRF protection to cookie-authenticated state-changing endpoints before production.
5. **MongoDB transactions:** Couple creation and invitation acceptance require a replica-set deployment supporting transactions.
6. **Test the full auth and transaction flows** in the deployed browser before putting real user data into the app.

## Frontend request example

```ts
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
  method: "GET",
  credentials: "include",
  headers: { "Content-Type": "application/json" }
});
```
