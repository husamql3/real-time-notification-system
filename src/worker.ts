import type { ExportedHandler } from 'cloudflare:workers'

// TanStack Start's CF Workers handler
import startHandler from '@tanstack/react-start/server-entry'

// Cloudflare requires the DO class in the same module as the Worker default export
export { BroadcastRoom } from './durable-objects/broadcast'

type Env = {
	BROADCAST: DurableObjectNamespace
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url)

		// Intercept WebSocket upgrades before TanStack Start's response pipeline.
		// TanStack Start reconstructs Response objects, stripping CF's non-standard
		// `webSocket` property from the DO's 101 response — breaking the upgrade.
		if (
			url.pathname === '/api/ws' &&
			request.headers.get('Upgrade')?.toLowerCase() === 'websocket'
		) {
			const id = env.BROADCAST.idFromName('main')
			const room = env.BROADCAST.get(id)
			return room.fetch(new Request('http://internal/connect', { headers: request.headers }))
		}

		return (startHandler as ExportedHandler<Env>).fetch!(request, env, ctx)
	},
} satisfies ExportedHandler<Env>
