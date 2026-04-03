import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { desc } from 'drizzle-orm'
import { useEffect, useRef, useState } from 'react'
import { db, schema } from '#/db'

// ─── Types ────────────────────────────────────────────────────────────────────

type StoredMessage = typeof schema.broadcastMessages.$inferSelect

type LiveMessage = {
  id: number | string
  title: string
  content: string
  sentBy: string
  timestamp: string
}

type FeedMessage = StoredMessage | LiveMessage

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

// ─── Server Function ───────────────────────────────────────────────────────────

const loadMessages = createServerFn({ method: 'GET' }).handler(async () => {
  if (!db) return [] as StoredMessage[]
  return db
    .select()
    .from(schema.broadcastMessages)
    .orderBy(desc(schema.broadcastMessages.createdAt))
    .limit(50)
})

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/feed')({
  loader: async () => {
    const messages = await loadMessages()
    return { messages }
  },
  component: FeedPage,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTime(msg: FeedMessage): string {
  if ('timestamp' in msg && msg.timestamp) return msg.timestamp
  if ('createdAt' in msg && msg.createdAt) return msg.createdAt.toISOString()
  return new Date().toISOString()
}

function getSentBy(msg: FeedMessage): string {
  if ('sentBy' in msg) return msg.sentBy ?? 'admin'
  if ('sent_by' in msg) return (msg as { sent_by: string }).sent_by ?? 'admin'
  return 'admin'
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

function FeedPage() {
  const { messages: initial } = Route.useLoaderData()
  const [messages, setMessages] = useState<FeedMessage[]>(initial)
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [newIds, setNewIds] = useState<Set<number | string>>(new Set())
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('connected')
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }

    ws.onclose = () => {
      setStatus('disconnected')
      reconnectTimer.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => ws.close()

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as LiveMessage
        const incoming: LiveMessage = {
          ...msg,
          id: msg.id ?? `live-${Date.now()}`,
        }
        setMessages((prev) => [incoming, ...prev])
        setNewIds((prev) => {
          const next = new Set(prev)
          next.add(incoming.id)
          setTimeout(
            () =>
              setNewIds((s) => {
                const copy = new Set(s)
                copy.delete(incoming.id)
                return copy
              }),
            2500,
          )
          return next
        })
      } catch {
        // ignore malformed
      }
    }
  }

  useEffect(() => {
    // In dev mode Vite's HMR WebSocket is already open in every tab.
    // We reuse it via custom events so we don't need a separate WS connection.
    if (import.meta.hot) {
      setStatus('connected')

      const handler = (data: LiveMessage) => {
        const incoming: LiveMessage = {
          ...data,
          id: data.id ?? `live-${Date.now()}`,
        }
        setMessages((prev) => [incoming, ...prev])
        setNewIds((prev) => {
          const next = new Set(prev)
          next.add(incoming.id)
          setTimeout(
            () =>
              setNewIds((s) => {
                const copy = new Set(s)
                copy.delete(incoming.id)
                return copy
              }),
            2500,
          )
          return next
        })
      }

      import.meta.hot.on('app:broadcast', handler)
      return () => import.meta.hot?.off('app:broadcast', handler)
    }

    // Production: use the dedicated WebSocket at /api/ws (Durable Object)
    connect()
    return () => {
      wsRef.current?.close()
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const statusConfig = {
    connecting: {
      dot: 'bg-amber-400 animate-pulse',
      ring: '',
      label: 'Connecting…',
      text: 'text-amber-600 dark:text-amber-400',
    },
    connected: {
      dot: 'bg-emerald-500',
      ring: 'animate-ping bg-emerald-400',
      label: 'Live',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    disconnected: {
      dot: 'bg-red-400',
      ring: '',
      label: 'Reconnecting…',
      text: 'text-red-500 dark:text-red-400',
    },
  }[status]

  return (
    <main className="page-wrap px-4 pb-12 pt-14">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <div className="island-kicker mb-2">Notifications</div>
          <h1 className="display-title text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
            Live Feed
          </h1>
          <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
            Real-time messages broadcast from admin.
          </p>
        </div>

        <div className="island-shell flex flex-shrink-0 items-center gap-2 rounded-full px-4 py-2">
          <span className="relative flex h-2.5 w-2.5">
            {status === 'connected' && (
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${statusConfig.ring}`}
              />
            )}
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${statusConfig.dot}`}
            />
          </span>
          <span className={`text-sm font-semibold ${statusConfig.text}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Messages */}
      {messages.length === 0 ? (
        <div className="island-shell rounded-2xl px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--chip-bg)] text-2xl">
            📭
          </div>
          <h2 className="text-base font-semibold text-[var(--sea-ink)]">
            No messages yet
          </h2>
          <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
            Messages from admin will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg, i) => {
            const time = getTime(msg)
            const sender = getSentBy(msg)
            const id = msg.id
            const isNew = newIds.has(id)

            return (
              <article
                key={`${id}-${i}`}
                className={[
                  'island-shell rise-in rounded-2xl p-5 transition-all duration-500',
                  isNew
                    ? 'border-[var(--lagoon-deep)] shadow-[0_0_0_2px_rgba(50,143,151,0.25)]'
                    : '',
                ].join(' ')}
                style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--chip-bg)] text-base">
                    {isNew ? '🔔' : '📣'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold leading-snug text-[var(--sea-ink)]">
                        {msg.title}
                        {isNew && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-[rgba(50,143,151,0.15)] px-2 py-0.5 text-xs font-semibold text-[var(--lagoon-deep)]">
                            New
                          </span>
                        )}
                      </p>
                      <time
                        dateTime={time}
                        className="flex-shrink-0 font-mono text-xs text-[var(--sea-ink-soft)]"
                        title={new Date(time).toLocaleString()}
                      >
                        {timeAgo(time)}
                      </time>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--sea-ink-soft)]">
                      {msg.content}
                    </p>
                    <p className="mt-2 text-xs text-[var(--sea-ink-soft)]/60">
                      From {sender}
                    </p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}
