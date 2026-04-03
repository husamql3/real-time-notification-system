import { createAPIFileRoute } from '@tanstack/react-start/api'
import { env } from 'cloudflare:workers'

type CloudflareEnv = {
  BROADCAST: DurableObjectNamespace
}

export const APIRoute = createAPIFileRoute('/api/ws')({
  GET: async ({ request }) => {
    const { BROADCAST } = env as unknown as CloudflareEnv
    const id = BROADCAST.idFromName('main')
    const room = BROADCAST.get(id)

    // Forward the WebSocket upgrade to the Durable Object
    return room.fetch(
      new Request('http://internal/connect', { headers: request.headers }),
    )
  },
})
