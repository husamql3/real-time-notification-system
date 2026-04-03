/**
 * PBKDF2-based password hashing using the Web Crypto API.
 * Much faster than scrypt/bcrypt within Cloudflare Workers' CPU time budget.
 * Format: "pbkdf2:<hex-salt>:<hex-derived-key>"
 */

const ITERATIONS = 100_000
const KEY_BITS = 256
const SEP = ':'

async function deriveKey(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(password.normalize('NFKC')),
		{ name: 'PBKDF2' },
		false,
		['deriveBits'],
	)
	return crypto.subtle.deriveBits(
		{ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
		keyMaterial,
		KEY_BITS,
	)
}

function toHex(buf: ArrayBuffer | Uint8Array): string {
	return Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
}

function fromHex(hex: string): Uint8Array {
	const bytes = hex.match(/.{2}/g)
	if (!bytes) throw new Error('Invalid hex string')
	return new Uint8Array(bytes.map((b) => parseInt(b, 16)))
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16))
	const key = await deriveKey(password, salt)
	return ['pbkdf2', toHex(salt), toHex(key)].join(SEP)
}

export async function verifyPassword({
	password,
	hash,
}: {
	password: string
	hash: string
}): Promise<boolean> {
	const parts = hash.split(SEP)
	if (parts.length !== 3 || parts[0] !== 'pbkdf2') return false
	const salt = fromHex(parts[1])
	const expected = fromHex(parts[2])
	const actual = new Uint8Array(await deriveKey(password, salt))
	if (actual.length !== expected.length) return false
	// Constant-time comparison
	let diff = 0
	for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i]
	return diff === 0
}
