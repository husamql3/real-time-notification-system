// Export the Durable Object class — Cloudflare requires it in the same module as the Worker default export
export { BroadcastRoom } from './durable-objects/broadcast'

// Re-export TanStack Start's Cloudflare Worker handler as the default entry
export { default } from '@tanstack/react-start/server-entry'
