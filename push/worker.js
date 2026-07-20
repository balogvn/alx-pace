/**
 * ALX Pace push-subscription store — a single-file Cloudflare Worker.
 *
 * Deploy (free tier is plenty):
 *   1. Cloudflare dashboard → Workers → create → paste this file.
 *   2. Bind a KV namespace as `SUBS`.
 *   3. Set vars: SENDER_TOKEN  (long random string; same value as the GitHub
 *      repo secret PUSH_SENDER_TOKEN) and ALLOWED_ORIGIN
 *      (https://balogvn.github.io).
 *   4. Put the worker URL in src/lib/pushConfig.js (PUSH_ENDPOINT) and in the
 *      repo secret PUSH_ENDPOINT.
 *
 * Endpoints:
 *   POST   /subscribe      {PushSubscription}    store (idempotent)
 *   DELETE /subscribe      {endpoint}            remove
 *   GET    /subscriptions  Bearer SENDER_TOKEN   list all (sender only)
 */

async function endpointKey(endpoint) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint))
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || 'https://balogvn.github.io',
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type',
    }
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors })

    const { pathname } = new URL(request.url)

    if (pathname === '/subscribe' && request.method === 'POST') {
      const sub = await request.json().catch(() => null)
      if (!sub || typeof sub.endpoint !== 'string' || !sub.endpoint.startsWith('https://')) {
        return new Response('bad request', { status: 400, headers: cors })
      }
      await env.SUBS.put(await endpointKey(sub.endpoint), JSON.stringify(sub))
      return new Response('ok', { headers: cors })
    }

    if (pathname === '/subscribe' && request.method === 'DELETE') {
      const body = await request.json().catch(() => null)
      if (!body || typeof body.endpoint !== 'string') {
        return new Response('bad request', { status: 400, headers: cors })
      }
      await env.SUBS.delete(await endpointKey(body.endpoint))
      return new Response('ok', { headers: cors })
    }

    if (pathname === '/subscriptions' && request.method === 'GET') {
      if (request.headers.get('authorization') !== `Bearer ${env.SENDER_TOKEN}`) {
        return new Response('unauthorized', { status: 401 })
      }
      const subs = []
      let cursor
      do {
        const page = await env.SUBS.list({ cursor })
        for (const key of page.keys) {
          const value = await env.SUBS.get(key.name)
          if (value) subs.push(JSON.parse(value))
        }
        cursor = page.list_complete ? null : page.cursor
      } while (cursor)
      return Response.json(subs)
    }

    return new Response('not found', { status: 404 })
  },
}
