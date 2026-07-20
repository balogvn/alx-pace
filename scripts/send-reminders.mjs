/**
 * Weekly Web Push sender — run by .github/workflows/remind.yml.
 *
 * Requires env: PUSH_ENDPOINT, PUSH_SENDER_TOKEN, VAPID_PUBLIC_KEY,
 * VAPID_PRIVATE_KEY. Exits 0 quietly when PUSH_ENDPOINT is not configured,
 * so the scheduled workflow is a no-op until the worker is deployed.
 */
const { PUSH_ENDPOINT, PUSH_SENDER_TOKEN, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env

if (!PUSH_ENDPOINT) {
  console.log('PUSH_ENDPOINT not configured — nothing to do.')
  process.exit(0)
}
for (const [name, value] of Object.entries({ PUSH_SENDER_TOKEN, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY })) {
  if (!value) {
    console.error(`Missing required secret: ${name}`)
    process.exit(1)
  }
}

// Imported only when configured, so the dormant no-op path needs no deps.
const webpush = (await import('web-push')).default

webpush.setVapidDetails('mailto:kbalogun@alxafrica.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

const listRes = await fetch(`${PUSH_ENDPOINT}/subscriptions`, {
  headers: { authorization: `Bearer ${PUSH_SENDER_TOKEN}` },
})
if (!listRes.ok) {
  console.error(`Failed to list subscriptions: ${listRes.status}`)
  process.exit(1)
}
const subscriptions = await listRes.json()
console.log(`Sending to ${subscriptions.length} subscription(s)…`)

const payload = JSON.stringify({
  title: 'ALX Pace — new week, new grind 💪',
  body: 'Open your tracker to see this week’s lessons and graded milestones.',
})

let sent = 0
let pruned = 0
for (const sub of subscriptions) {
  try {
    await webpush.sendNotification(sub, payload)
    sent += 1
  } catch (err) {
    const status = err?.statusCode
    if (status === 404 || status === 410) {
      // Subscription expired or revoked — prune it from the store.
      await fetch(`${PUSH_ENDPOINT}/subscribe`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      }).catch(() => {})
      pruned += 1
    } else {
      console.error(`Send failed (${status ?? 'unknown'}): ${String(err?.message ?? err).slice(0, 120)}`)
    }
  }
}
console.log(`Done: ${sent} sent, ${pruned} pruned, ${subscriptions.length - sent - pruned} failed.`)
