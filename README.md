# HURU — Hormuud University Digital Platform

Phase 1 foundation for Hormuud University’s digital ecosystem: secure identity, role-based access, user administration, audit trails, and a polished responsive web experience. Its design is deliberately modular so later academic, finance, communications, AI, and mobile modules can share the same platform services.

## Included in Phase 1

- React + Vite + TypeScript client with the HURU design system, responsive navigation, light/dark themes, accessible forms and protected routes.
- Express + TypeScript API with MongoDB/Mongoose models, Zod validation, consistent API responses, centralized errors and security middleware.
- JWT access tokens, rotating HTTP-only refresh tokens, bcrypt password hashing, password reset/change flows and login-rate protection.
- Central roles/permissions, reusable `authenticate`, `authorize`, and `requirePermission` middleware.
- User management API with filtering, search and pagination; audit logging for sensitive actions.

## Structure

```text
client/  React application, contexts, routes, pages, reusable UI and API services
server/  Express API: config, models, controllers, middleware, validators and routes
```

## Quick start

1. Copy `.env.example` to `server/.env` and replace development secrets with long random values.
2. Install packages: `npm.cmd install`
3. Ensure MongoDB is running and then seed development data: `npm.cmd run seed`
4. Start client and API: `npm.cmd run dev`

The web app runs at `http://localhost:5173`; the API runs at `http://localhost:5000`.

## Development seed accounts

All development seed accounts use `HuruDev2026!`. Never use this password in production.

- `superadmin@hormuud.edu.so` — SUPER_ADMIN
- `admin@hormuud.edu.so` — ADMIN
- `amina.hassan@hormuud.edu.so` — LECTURER
- `abdi.nur@hormuud.edu.so` — HOD
- `hodan.ali@hormuud.edu.so` — FINANCE
- `mohamed.ahmed@hormuud.edu.so` / `fadumo.osman@hormuud.edu.so` — STUDENT

## Environment variables

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection URL |
| `JWT_ACCESS_SECRET` | Access-token signing secret |
| `JWT_REFRESH_SECRET` | Refresh-token signing secret |
| `ACCESS_TOKEN_EXPIRES` | Access-token lifetime |
| `REFRESH_TOKEN_EXPIRES` | Refresh-token lifetime |
| `PORT` | API port |
| `CLIENT_URL` | Allowed frontend origin |

## API

Base URL: `/api/v1`. Authentication covers register, login, refresh, logout, reset/change password, and current user. User routes support paginated listing, creating, editing, changing status and role, and deletion. Role and audit-log endpoints are available to authorized administrators. All responses follow `{ success, message, data, meta? }`.

## Security

Helmet, strict CORS, rate limits, small JSON request limits, Zod validation, password hashing, HTTP-only refresh cookies, refresh-token rotation, account-status checks, permission gates, audit logs and production-safe errors are enabled. Password hashes and secrets are never returned by the API.

## Quality and next phases

Run `npm.cmd run build` to type-check and build both workspaces. The server separates models, validators, controllers and routes, while the client centralizes API calls, authentication and theme state. Future modules should consume these shared identity, RBAC, audit, API and design-system layers rather than duplicate them.
