# ALX Pace — moved

This repository no longer hosts the app. **ALX Pace is published by ALX Data
Programs:**

### → https://alxdataprograms.github.io/alx-pace/

Source: https://github.com/alxdataprograms/alx-pace

---

## Why this repository still exists

`localStorage` is scoped to the origin, so every learner who used the app at
`balogvn.github.io/alx-pace/` has their start date and completed lessons stored
against *this* hostname — unreachable from the new one. Only a page served from
here can read them.

The `bridge` branch serves a single page that:

1. retires the old service worker and its caches, so an installed PWA stops
   being fed the retired app from cache and never learns there is a new address;
2. reads the learner's saved progress;
3. hands it to the new home in a URL **fragment** — never a query string, so a
   learner's name is never sent to a server or written to an access log.

Do not delete this repository or change its Pages source while learners may
still hold the old link or an old home-screen icon. It costs nothing to leave
running.

The `main` branch keeps the original history up to the move, for reference only.
