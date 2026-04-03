/**
 * Seeds the initial admin user into the database.
 * Requires DATABASE_URL and ADMIN_EMAIL to be set in .env
 *
 * Usage:  bun db:seed
 */
import { eq } from 'drizzle-orm'
import { db, schema } from '../src/db/index'

const { hashPassword } = (await import(
  '../node_modules/better-auth/dist/crypto/index.mjs'
)) as { hashPassword: (pw: string) => Promise<string> }

const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD ?? 'admin1234'
const name = process.env.ADMIN_NAME ?? 'Admin'

if (!email) {
  console.error('Error: ADMIN_EMAIL is not set in .env')
  process.exit(1)
}

if (!db) {
  console.error('Error: DATABASE_URL is not set')
  process.exit(1)
}

const [existing] = await db
  .select({ id: schema.users.id })
  .from(schema.users)
  .where(eq(schema.users.email, email))
  .limit(1)

if (existing) {
  console.log(`Admin user already exists: ${email}`)
  process.exit(0)
}

const userId = crypto.randomUUID()
const now = new Date()
const hashed = await hashPassword(password)

await db.insert(schema.users).values({
  id: userId,
  name,
  email,
  emailVerified: true,
  createdAt: now,
  updatedAt: now,
})

await db.insert(schema.accounts).values({
  id: crypto.randomUUID(),
  accountId: email,
  providerId: 'credential',
  userId,
  password: hashed,
  createdAt: now,
  updatedAt: now,
})

console.log('✓ Admin user created')
console.log(`  Email:    ${email}`)
console.log(`  Password: ${password}`)
