import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { db, schema } from '#/db'
import { hashPassword, verifyPassword } from '#/lib/password'

export const auth = betterAuth({
  database: db
    ? drizzleAdapter(db, {
        provider: 'pg',
        schema: {
          user: schema.users,
          session: schema.sessions,
          account: schema.accounts,
          verification: schema.verifications,
        },
      })
    : undefined!,
  emailAndPassword: {
    enabled: true,
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
  },
  plugins: [tanstackStartCookies()],
})
