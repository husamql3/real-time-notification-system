import { DurableObject } from 'cloudflare:workers'

export type BroadcastMessage = {
  id: number
  title: string
  content: string
  sentBy: string
  timestamp: string
}

export class BroadcastRoom extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.endsWith('/connect')) {
      const upgradeHeader = request.headers.get('Upgrade')
      if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
        return new Response('Expected WebSocket upgrade', { status: 426 })
      }

      const { 0: client, 1: server } = new WebSocketPair()
      this.ctx.acceptWebSocket(server)

      return new Response(null, { status: 101, webSocket: client })
    }

    if (url.pathname.endsWith('/broadcast') && request.method === 'POST') {
      const message = (await request.json()) as BroadcastMessage
      const sockets = this.ctx.getWebSockets()
      const payload = JSON.stringify(message)

      let sent = 0
      for (const ws of sockets) {
        try {
          ws.send(payload)
          sent++
        } catch {
          // client disconnected, skip
        }
      }

      return Response.json({ sent })
    }

    return new Response('Not found', { status: 404 })
  }

  async webSocketMessage(
    _ws: WebSocket,
    _message: string | ArrayBuffer,
  ): Promise<void> {
    // broadcast-only; no client→server messages needed
  }

  async webSocketClose(_ws: WebSocket): Promise<void> {
    // cleanup is automatic with hibernatable WebSockets
  }
}
