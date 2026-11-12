# Witch Woofie API

An Express API for a private two-person shared app. Includes MongoDB/Mongoose, email/password auth, short-lived JWT access tokens, rotating refresh sessions, HttpOnly cookies, one-time couple invitations, and couple-scoped task CRUD.

## Requirements

- Node.js 20+
- MongoDB Atlas cluster (M0 is sufficient for initial development; check current Atlas limits)
- Two independent strong secrets

## Local setup

```bash
npm install
npm run dev
```

API defaults to `http://localhost:4000`.

## API endpoints

All JSON request bodies use `Content-Type: application/json`. Browser requests must use `credentials: "include"`.

### Authentication

- `POST /api/auth/register` — `{ "email", "password", "displayName" }`; password minimum 12 characters.
- `POST /api/auth/login` — `{ "email", "password" }`
- `POST /api/auth/refresh` — rotates refresh token using the HttpOnly refresh cookie.
- `POST /api/auth/logout` — revokes current refresh session and clears cookies.
- `GET /api/auth/me` — current user.

### Couple

All require authentication.

- `POST /api/couples` — create my couple: `{ "name": "Our Little World" }`
- `POST /api/couples/invitation` — create one-time invitation; returns a private invitation code. Only available while the couple has one member.
- `POST /api/couples/join` — second account joins: `{ "invitationCode": "..." }`
- `GET /api/couples/me` — current couple and member profiles.

### Tasks

All require authentication and couple membership.

- `GET /api/tasks`
- `POST /api/tasks` — `{ "title", "description?", "assignedTo?", "dueDate?", "priority?" }`
- `PATCH /api/tasks/:taskId` — partial task update; may include `status`.
- `DELETE /api/tasks/:taskId`

Every task query is scoped by `coupleId`; clients cannot submit or override `coupleId` or `createdBy`.

## Frontend fetch example

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const response = await fetch(`${API_URL}/api/auth/me`, {
  method: "GET",
  credentials: "include",
  headers: { "Content-Type": "application/json" }
});
```

For mutations, include a CSRF defense before production. At minimum, keep `SameSite=Lax` when frontend and API are same-site subdomains, validate `Origin` on state-changing requests, and consider a CSRF token pattern. If frontend and API are on unrelated sites and `SameSite=None` is required, CSRF protection is mandatory and `Secure=true` is required.

## Cookie/domain deployment guidance

For production on sibling subdomains such as `app.example.com` and `api.example.com`:
- Set `FRONTEND_ORIGINS=https://app.example.com`
- Set `COOKIE_SECURE=true`
- Set `COOKIE_SAME_SITE=lax`
- Usually leave `COOKIE_DOMAIN` blank so cookies are host-only for the API.
- Use `credentials: "include"` in browser fetch calls.

If using unrelated domains (for example `pages.dev` frontend and `onrender.com` API), browser third-party cookie restrictions may block cookies even with `SameSite=None; Secure`. A custom domain arrangement is strongly recommended.

## Render deployment

- Root directory: backend folder (if monorepo)
- Build command: `npm install`
- Start command: `npm start`
- Add all `.env` values in Render environment settings.
- Set `NODE_ENV=production`, `COOKIE_SECURE=true`, and the exact frontend origin.
- Do not commit `.env`.

## Before production

1. Add CSRF protection / strict Origin checks for every cookie-authenticated state-changing route.
2. Add password reset and email verification.
3. Add account deletion, session/device management, and couple unlink/recovery flows.
4. Add validation and authorization tests, especially invitation races and cross-couple access.
5. Configure backups and monitor MongoDB storage.
6. Store uploaded images in object storage, not Render's ephemeral filesystem.
7. Add request logging with sensitive fields and cookies redacted.
8. Review rate limits and account lockout strategy.
9. Add a safe invitation delivery UX; never log invitation codes.
10. Review cookie behavior in the actual deployed browser/domain combination.

## Data model / privacy

Each shared record belongs to a `coupleId`. Every query and mutation must enforce that scope on the server. Do not rely on frontend filtering for privacy.
