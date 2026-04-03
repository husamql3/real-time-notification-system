import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

function createDb() {
  const url = process.env.DATABASE_URL
  if (!url) return null
  return drizzle(neon(url), { schema })
}

export const db = createDb()
export { schema }
export type Db = NonNullable<typeof db>

// Raw neon client for backwards-compatible raw SQL (used by demo pages)
export async function getClient() {
  const url = process.env.DATABASE_URL
  if (!url) return undefined
  return neon(url)
}
