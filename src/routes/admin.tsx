import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { useRef, useState } from 'react'
import { desc } from 'drizzle-orm'
import { env } from 'cloudflare:workers'
import { auth } from '#/lib/auth'
import { db, schema } from '#/db'

// ─── Types ────────────────────────────────────────────────────────────────────

type CloudflareEnv = {
  BROADCAST: DurableObjectNamespace
  ADMIN_EMAIL?: string
}

type StoredMessage = typeof schema.broadcastMessages.$inferSelect

// ─── Server Functions ─────────────────────────────────────────────────────────

const getSessionAndMessages = createServerFn({ method: 'GET' }).handler(
  async () => {
    const request = getRequest()
    if (!request) return { session: null, messages: [] as StoredMessage[], isAdmin: false }

    const session = await auth.api.getSession({ headers: request.headers })

    const cfEnv = env as unknown as CloudflareEnv
    const adminEmail = cfEnv.ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? ''
    const isAdmin = Boolean(
      session && adminEmail && session.user.email === adminEmail,
    )

    let messages: StoredMessage[] = []
    if (db) {
      messages = await db
        .select()
        .from(schema.broadcastMessages)
        .orderBy(desc(schema.broadcastMessages.createdAt))
        .limit(50)
    }

    return { session, messages, isAdmin }
  },
)

const broadcast = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => data as { title: string; content: string })
  .handler(async ({ data }) => {
    const request = getRequest()
    if (!request) throw new Error('No request context')

    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Not authenticated')

    const cfEnv = env as unknown as CloudflareEnv
    const adminEmail = cfEnv.ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? ''
    if (!adminEmail || session.user.email !== adminEmail) {
      throw new Error('Not authorized')
    }

    // Persist to DB
    if (db) {
      await db.insert(schema.broadcastMessages).values({
        title: data.title,
        content: data.content,
        sentBy: session.user.email,
      })
    }

    const message = JSON.stringify({
      title: data.title,
      content: data.content,
      sentBy: session.user.email,
      timestamp: new Date().toISOString(),
    })

    if (import.meta.env.DEV) {
      // miniflare intercepts fetch() to localhost:3000 (its own host) and
      // routes it back through the Worker. We use port 3001 instead — a
      // tiny HTTP server in vite.config.ts that forwards via server.ws.send().
      await fetch('http://localhost:3001', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: message,
      }).catch(() => {})
    } else {
      // Production: push via Durable Object
      const id = cfEnv.BROADCAST.idFromName('main')
      const room = cfEnv.BROADCAST.get(id)
      await room.fetch(
        new Request('http://internal/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: message,
        }),
      )
    }

    return { ok: true }
  })

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/admin')({
  loader: async () => {
    const data = await getSessionAndMessages()
    if (!data.session) throw redirect({ to: '/auth/login' })
    return data
  },
  component: AdminPage,
})

// ─── Component ────────────────────────────────────────────────────────────────

function AdminPage() {
  const { session, messages: initialMessages, isAdmin } = Route.useLoaderData()
  const [messages, setMessages] = useState(initialMessages)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [lastSent, setLastSent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || sending) return

    setSending(true)
    setError(null)

    try {
      await broadcast({ data: { title: title.trim(), content: content.trim() } })
      setMessages((prev) => [
        {
          id: Date.now(),
          title: title.trim(),
          content: content.trim(),
          sentBy: session!.user.email,
          createdAt: new Date(),
        },
        ...prev,
      ])
      setLastSent(title.trim())
      setTitle('')
      setContent('')
      titleRef.current?.focus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  if (!isAdmin) {
    return (
      <main className="page-wrap px-4 pb-8 pt-14">
        <div className="mx-auto max-w-lg pt-16 text-center">
          <div className="island-shell inline-flex items-center justify-center rounded-2xl p-6 mb-6">
            <span className="text-4xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--sea-ink)] mb-3">
            Access Restricted
          </h1>
          <p className="text-[var(--sea-ink-soft)] text-sm">
            You need admin privileges to access this page. Set{' '}
            <code className="rounded bg-[var(--chip-bg)] px-1.5 py-0.5 text-xs font-mono">
              ADMIN_EMAIL
            </code>{' '}
            in your environment to your account's email.
          </p>
          <p className="text-[var(--sea-ink-soft)] text-xs mt-2 font-mono">
            Signed in as: {session?.user.email}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="page-wrap px-4 pb-12 pt-14">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="island-kicker mb-2 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Broadcast Center
          </div>
          <h1 className="display-title text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
            Send a Message
          </h1>
          <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
            Delivered instantly to all connected users.
          </p>
        </div>
        <div className="island-shell flex-shrink-0 rounded-xl px-3 py-2 text-right">
          <p className="text-xs text-[var(--sea-ink-soft)]">Admin</p>
          <p className="max-w-[180px] truncate text-sm font-medium text-[var(--sea-ink)]">
            {session?.user.email}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Compose Form */}
        <section className="island-shell rounded-2xl p-6">
          <h2 className="mb-5 text-base font-semibold text-[var(--sea-ink)]">
            Compose Broadcast
          </h2>

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label
                htmlFor="msg-title"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]"
              >
                Title
              </label>
              <input
                id="msg-title"
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. System maintenance at 3 PM"
                maxLength={120}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-3 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)]/50 outline-none transition focus:border-[var(--lagoon-deep)] focus:ring-2 focus:ring-[rgba(50,143,151,0.2)]"
              />
            </div>

            <div>
              <label
                htmlFor="msg-content"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]"
              >
                Message
              </label>
              <textarea
                id="msg-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your message here…"
                rows={5}
                className="w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-3 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)]/50 outline-none transition focus:border-[var(--lagoon-deep)] focus:ring-2 focus:ring-[rgba(50,143,151,0.2)]"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </div>
            )}

            {lastSent && (
              <div className="rise-in rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                ✓ Broadcast sent: <strong>{lastSent}</strong>
              </div>
            )}

            <button
              type="submit"
              disabled={sending || !title.trim() || !content.trim()}
              className="w-full rounded-xl bg-[var(--lagoon-deep)] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              {sending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Sending…
                </span>
              ) : (
                'Broadcast to All Users'
              )}
            </button>
          </form>
        </section>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="island-shell rounded-2xl p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
              Stats
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--sea-ink-soft)]">
                  Total sent
                </span>
                <span className="font-mono text-sm font-semibold text-[var(--sea-ink)]">
                  {messages.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--sea-ink-soft)]">
                  Latest
                </span>
                <span className="text-sm text-[var(--sea-ink)]">
                  {messages[0]?.createdAt
                    ? new Date(messages[0].createdAt).toLocaleDateString()
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="island-shell rounded-2xl p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
              How it works
            </p>
            <ul className="space-y-2 text-xs text-[var(--sea-ink-soft)]">
              <li className="flex gap-2">
                <span className="text-[var(--sea-ink)]">→</span>
                Messages are pushed in real-time via WebSocket
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--sea-ink)]">→</span>
                Users on{' '}
                <a href="/feed" className="underline">
                  /feed
                </a>{' '}
                see them instantly
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--sea-ink)]">→</span>
                All messages are stored in the database
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Message History */}
      {messages.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-base font-semibold text-[var(--sea-ink)]">
            Broadcast History
          </h2>
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <article
                key={msg.id}
                className="island-shell rise-in rounded-xl px-5 py-4"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[var(--sea-ink)]">
                      {msg.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--sea-ink-soft)]">
                      {msg.content}
                    </p>
                  </div>
                  <time
                    dateTime={msg.createdAt?.toISOString()}
                    className="flex-shrink-0 font-mono text-xs text-[var(--sea-ink-soft)]"
                  >
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </time>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
