import { authClient } from '#/lib/auth-client'
import { Link } from '@tanstack/react-router'

export default function BetterAuthHeader() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="h-8 w-20 animate-pulse rounded-full bg-[var(--chip-bg)]" />
    )
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)]">
          <span className="text-xs font-semibold text-[var(--sea-ink)]">
            {session.user.name?.charAt(0).toUpperCase() ?? 'U'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => void authClient.signOut()}
          className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <Link
      to="/auth/login"
      className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--sea-ink-soft)] no-underline transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
    >
      Sign in
    </Link>
  )
}
