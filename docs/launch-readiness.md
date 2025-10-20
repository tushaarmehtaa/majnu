# Launch Readiness Checklist

## Regression Pass

- [ ] Complete the full loop: play → result → leaderboard → replay → share (win and loss variants).
- [ ] Confirm the final word reveals in both win and loss screens.
- [ ] Toggle sound, reload, and ensure preference persists via localStorage.
- [ ] Simulate offline (DevTools) and verify retry toasts + offline banner copy.
- [ ] Verify leaderboard pagination + summary data without duplicated rows.

## Device & Browser Matrix

| Device        | Browser        | Notes |
| ------------- | -------------- | ----- |
| iPhone SE     | Safari         | Check viewport scaling + CTA spacing |
| iPhone 14     | Safari / Chrome| Verify animations + Haptics           |
| Pixel 7       | Chrome         | Validate PWA install prompt           |
| MacBook Air   | Safari / Chrome| Confirm keyboard shortcuts + audio    |
| Windows Laptop| Chrome / Edge  | Inspect typography + audio autoplay   |
| Desktop       | Firefox        | Ensure service worker & share flows   |

## Observability

- Trigger a handled error (e.g. `window.dispatchEvent(new ErrorEvent("error"))`) and confirm Sentry captures it with context.
- Load `/api/status` and confirm `status: ok`, version matches `NEXT_PUBLIC_APP_VERSION`, and leaderboard totals update after a new game.
- Stress the InstantDB mock (win + lose several rounds) and ensure no `instantdb_retry_error` logs fire.

## Analytics Verification

- Trace PostHog live events for a full round and confirm single firing of `game_start`, `hint_used`, `game_win/loss`, `share_clicked`, `leaderboard_viewed`, `follow_clicked`.
- Reconcile PostHog count vs internal `logEvent` buffer (<3% variance).
- Validate device type + referrer properties populate on captured events.

## PWA & Offline

- Install via “Add to Home Screen” on mobile and confirm splash/icon branding.
- While online, visit `/play` → execute a round; go offline and reload to confirm cached shell + offline handoff.
- Inspect `navigator.serviceWorker.getRegistrations()` to verify version `majnu-static-v1.0.0` is active; unregister after testing.

## Deployment

- Populate Vercel environment variables: `INSTANT_*`, `NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_POSTHOG_*`, `SENTRY_*`.
- Run `npm run build` + `npm run start` locally before promoting to production.
- Tag release `v1.0.0` once smoke tests pass and notify internal testers with the staging URL.

## Incident Snapshot

1. `/api/status` for uptime + leaderboard sanity.
2. Sentry errors (`fatal_error`, `instantdb_*`).
3. PostHog funnel drop (`game_start` vs `game_win/loss`).
4. InstantDB availability + rate limits.
5. Service worker cache invalidation (bump `NEXT_PUBLIC_APP_VERSION`).

