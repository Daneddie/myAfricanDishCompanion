# V2 Plan — Managed-static to self-hosted backend (Stack B)

Supersedes the V1 constraint (PRD §12: local-only) where noted.
V1 (`index.html` + `app.js` + `data/dishes.json` + `localStorage`) keeps working
fully offline/anonymous throughout — V2 adds sync, it doesn't remove local mode.

## Stack lock (V2)

- **Frontend:** same app, deployed on **Cloudflare Pages** (free, CDN, pairs with R2).
- **Backend:** Node API (Hono or Express) hosting auth + dish/user-state endpoints.
  Host on Render / Fly.io / Railway (pick one at build time; all have free/low tiers).
- **Auth:** **Better Auth** (self-hosted) — email/password first, social/passkeys later.
  Sessions in Postgres via Better Auth's schema.
- **Database:** **Postgres** (Neon free tier recommended; serverless-friendly).
- **Media:** **Cloudflare R2** — `mad-dishes/` and `mad-ingredients/` prefixes (or two
  buckets), served via custom domain. Replaces `assets/` JPGs in git.
- **Secrets:** backend `.env` (Better Auth secret, DB URL, R2 keys) — never in the repo.
  Frontend gets only a public API base URL + R2 public base URL.

## Data model (new)

- Better Auth tables (managed by the library): `user`, `session`, `account`, `verification`.
- `dishes` — seeded 1:1 from `data/dishes.json` (frozen Phase-1 schema + `image` URL).
  `dishes.json` stays as the offline seed/fallback copy.
- Per-user state (replaces per-browser `localStorage` when logged in):
  `favorites(user_id, dish_id)`, `cooked(user_id, dish_id, cooked_at)`,
  `shopping(user_id, dish_id)`, `shopping_checks(user_id, item_key)`,
  `cook_progress(user_id, dish_id, step_index)`.
- Anonymous users: everything still works exactly as V1 via `localStorage`;
  on first login, offer one-time "upload my local cookbook" merge.

## Phases

### B0 — Hosting (no code changes)
- Cloudflare Pages from `main`; custom domain optional.
- Output: public URL replaces htmlpreview; localhost flow unchanged.

### B1 — Backend + Auth
- Scaffold Node API + Postgres (Neon) + Better Auth email/password.
- Endpoints: signup/login/logout/session/me.
- Frontend: login UI, session-aware header; anonymous mode untouched.
- Output: can create an account and stay logged in across devices.

### B2 — User-state sync
- CRUD endpoints for favorites / cooked / shopping / checks / cook progress / units.
- Frontend: when logged in, read/write API with `localStorage` as offline cache
  (write-through when online, reconcile on reconnect — last-write-wins for V2).
- One-time local → account merge on first login.
- Output: cookbook, shopping ticks, and cooking progress follow the user.

### B3 — R2 media
- Create R2 bucket(s) + public custom domain; upload the 8 dish photos and all
  future ones; tick off `assets/PHOTOS_NEEDED.md` as you go.
- `dishes.image` becomes absolute R2 URLs; app falls back to emoji when absent.
- Remove JPGs from git (keep `assets/PHOTOS_NEEDED.md` as the shot list).
- Output: repo slims down; photos CDN-served.

### B4 — Dishes API + seed
- `GET /api/dishes` (with ETag caching) seeded from `data/dishes.json`;
  frontend prefers API, falls back to local JSON offline.
- Enables region-by-region expansion without app releases.
- Output: new dishes shippable data-only.

### B5 — Post-V1 features (unblocked by B1–B4, each separable)
- Summed shopping lists, notes/ratings per cook, community-contributed dishes,
  Cook With What You Have, weekly planner. Not committed — pick after B2.

## Costs (approx, free tiers first)

- Cloudflare Pages: free. R2: 10 GB free, zero egress fees.
- Neon Postgres: free tier suffices to start. Backend host: free/low tier.
- Email delivery for auth (needed at B1): Resend/Postmark free tier.

## Risks & mitigations

- **Backend ops burden** (the Stack-B trade-off): mitigate with managed host +
  managed Postgres; keep API surface tiny (auth + 6 small resources).
- **Sync conflicts:** last-write-wins is fine for V2 scope; document it.
- **R2 public URLs:** use custom domain (not raw r2.dev) so URLs stay stable.
- **V1 regression:** every phase keeps anonymous-local mode green; static audit
  scripts in `/tmp` get re-run (schema validation, pairing checks).

## Open decisions (resolve at build time)

1. Backend host: Render vs Fly.io vs Railway.
2. Node framework: Hono vs Express.
3. Social login providers (post-B1): Google first?
4. R2 layout: one bucket + prefixes vs two buckets.
