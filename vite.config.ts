import { createServer as createHttpServer } from 'node:http'
import { defineConfig, type Plugin } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import neon from './neon-vite-plugin.ts'

/**
 * Dev-mode broadcast bridge.
 *
 * Problem: miniflare intercepts fetch() calls to localhost:3000 (its own host)
 * and routes them back through the Cloudflare Worker — so a middleware on the
 * Vite dev server at that URL is never reached.
 *
 * Solution:
 *  - Spin up a tiny HTTP server on a DIFFERENT port (3001) that only accepts
 *    POST /broadcast from the admin server function.
 *  - Forward the payload to every browser tab via Vite's existing HMR
 *    WebSocket as a custom event ("app:broadcast").
 *  - feed.tsx listens to that custom event via import.meta.hot in dev, and
 *    uses the real /api/ws WebSocket in production.
 */
const DEV_BROADCAST_PORT = 3001

function devBroadcast(): Plugin {
  return {
    name: 'dev-broadcast',
    apply: 'serve',
    configureServer(server) {
      const http = createHttpServer((req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(404).end()
          return
        }

        let body = ''
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString()
        })
        req.on('end', () => {
          try {
            const data = JSON.parse(body)
            server.ws.send({ type: 'custom', event: 'app:broadcast', data })
          } catch {
            // ignore malformed
          }
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end('{"ok":true}')
        })
      })

      http.listen(DEV_BROADCAST_PORT)
      server.httpServer?.on('close', () => http.close())
    },
  }
}

const config = defineConfig({
  plugins: [
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    neon,
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    devBroadcast(),
  ],
})

export default config
