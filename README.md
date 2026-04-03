# Real-Time Notification System

A full-stack notification broadcasting app built with TanStack Start, deployed on Cloudflare Workers. Admins send messages from a dashboard; all connected clients receive them instantly via WebSocket.

## Stack

- **TanStack Start** — SSR framework with file-based routing and server functions
- **Cloudflare Workers + Durable Objects** — edge runtime and stateful WebSocket coordination
- **Neon (PostgreSQL)** — message persistence via Drizzle ORM
- **Better Auth** — email/password authentication
- **Tailwind CSS v4 + shadcn/ui** — styling

## Project Structure

```
src/
├── durable-objects/broadcast.ts   # BroadcastRoom DO — manages all WS connections
├── routes/
│   ├── index.tsx                  # Landing page
│   ├── feed.tsx                   # Live notification feed (WebSocket client)
│   ├── admin.tsx                  # Admin broadcast panel (auth-gated)
│   ├── auth/                      # Login & register pages
│   └── api/
│       └── auth/$.ts              # Better Auth HTTP handler
├── db/
│   ├── schema.ts                  # Drizzle schema (auth tables + broadcastMessages)
│   └── index.ts                   # DB client
├── lib/
│   ├── auth.ts                    # Server-side Better Auth config
│   └── auth-client.ts             # Browser-side auth client
└── worker.ts                      # Cloudflare Worker entry point (handles /api/ws directly)
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```sh
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `DATABASE_URL_DIRECT` | Neon direct connection string (used by Drizzle migrations) |
| `BETTER_AUTH_SECRET` | Random secret for Better Auth session signing |
| `BETTER_AUTH_URL` | Base URL of the app (e.g. `http://localhost:3000` in dev) |
| `ADMIN_EMAIL` | Email address granted admin access |
| `ADMIN_PASSWORD` | Password used by `bun db:seed` to create the admin user |

In dev, `bun dev` auto-provisions a Neon database and writes `DATABASE_URL` / `DATABASE_URL_DIRECT` to `.env` automatically via `vite-plugin-neon-new`.

## Running Locally

**Prerequisites:** [Bun](https://bun.sh), a [Neon](https://neon.tech) database (auto-provisioned in dev)

```sh
bun install
bun dev          # starts on http://localhost:3000
```

The dev server auto-provisions a Neon database, runs `db/init.sql`, and seeds an admin user (`admin@example.com` / `admin1234`).

Open `/feed` in one tab and `/admin` in another, then broadcast a message to see it arrive in real time.

## Other Commands

```sh
bun build        # production build (client + SSR worker bundle)
bun deploy       # build + deploy to Cloudflare Workers

bun check        # Biome lint + format check
bun test         # Vitest

bun db:push      # sync Drizzle schema to production DB
bun db:seed      # create admin user from ADMIN_EMAIL / ADMIN_PASSWORD env vars
bun db:studio    # open Drizzle Studio
```

## Real-Time Mechanism

WebSockets, coordinated by a **Cloudflare Durable Object** (`BroadcastRoom`).

All browser clients connect to `/api/ws`, which is intercepted directly in `src/worker.ts` **before** the request reaches TanStack Start. It forwards the upgrade to a single shared `BroadcastRoom` instance (keyed by `idFromName('main')`). The DO uses the **hibernatable WebSockets API** (`ctx.acceptWebSocket`) — connections survive Worker restarts and don't consume memory while idle.

> **Why handle `/api/ws` in the worker instead of a TanStack Start API route?**
> TanStack Start's response pipeline reconstructs `Response` objects, stripping Cloudflare's non-standard `webSocket` property from the Durable Object's 101 response. By intercepting the upgrade in `worker.ts` first, the raw DO response is returned directly to the CF runtime, which handles the upgrade correctly.

When an admin broadcasts, the server function calls `POST /broadcast` on the DO, which iterates `ctx.getWebSockets()` and fans out to every connected client in one place.

**Why not SSE or polling?**
- SSE is unidirectional and would still need a coordination layer for fan-out across multiple Worker instances
- Polling adds unnecessary latency and load
- WebSockets + a single DO give us a clean, stateful hub with no external pub/sub service required

## Dev vs Production

Cloudflare's Vite plugin doesn't forward HTTP upgrade requests to miniflare in dev mode, so the Durable Object can't accept WebSocket connections locally.

In dev, a `devBroadcast()` Vite plugin spins up a small HTTP server on port 3001. The admin server function posts to it, and it relays the payload to all browser tabs via Vite's existing HMR WebSocket as a custom `app:broadcast` event. The feed page listens on `import.meta.hot` in dev and the real `/api/ws` socket in production.

## Trade-offs & Notable Decisions

- **Single DO instance** — all connections share one `BroadcastRoom`. Simple and sufficient for this use case; wouldn't scale to millions of concurrent connections without sharding.
- **No role column** — admin access is determined solely by matching `ADMIN_EMAIL` env var. Avoids schema complexity for a single-admin model.
- **Messages persisted in Neon** — the feed loads history from the DB on mount and then appends live WebSocket events, so late-joining clients see past messages without any extra sync protocol.
- **Auth via Better Auth** — the admin route guards with a server-side session check (`auth.api.getSession`); unauthenticated requests redirect to `/auth/login`.
