<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Screenshots (Chromium 152 headless)
- Local Network Access checks block CDP `Page.navigate` / iframes to 127.0.0.1 (initiator treated as public page); flags (`--disable-features=LocalNetworkAccessChecks`), `Browser.grantPermissions(localNetworkAccess)`, and `/etc/.../local-network.json` (`LocalNetworkAccessAllowedForUrls`) did NOT unblock it — don't waste time retrying.
- Working method: temp `public/shot-seed.html` (same origin) that seeds localStorage then `location.replace(to)`; open a `file://` starter page via CDP and set `location.href` to the seed URL from page JS (top-level JS navigation is allowed). Then CDP screenshot as usual. Delete `public/shot-seed.html` and any temp policy files afterwards; keep `screenshots/` untracked (local delivery only).
- Before full-page screenshots set viewport height = content height, else below-fold content may not rasterize.

## Project notes (my-store)

- Prisma: `npm i prisma` currently resolves to the v8 RC (new platform CLI, no `migrate`/`generate`). This project pins the stable ORM: `prisma@6` / `@prisma/client@6`.
- npm 10 on this VM sometimes fails with `Cannot read properties of null (reading 'edgesOut')`. Fix: `npm cache clean --force`, retry with `--legacy-peer-deps`.
- Prisma engine binaries cannot be downloaded directly on this VM (egress proxy blocks direct HTTPS and fetch-engine ignores the proxy). Install with `npm install --ignore-scripts`, then run `bash scripts/setup-prisma-engines.sh` (downloads via proxy, verifies sha256). Local prisma commands need `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1`. Not needed on Vercel.
- DB: Neon Postgres. `DATABASE_URL` = pooled connection (app), `DIRECT_URL` = direct connection (migrations). Both live in `.env.local` (gitignored) — never commit real credentials.
- This VM cannot open direct TCP to Neon (firewall). DB work needs the tunnel: `node scripts/db-tunnel.mjs` (keep running; 5433→direct, 5434→pooler via proxy CONNECT). `.env.local` points at 127.0.0.1:5433/5434. Because the tunnel drops TLS SNI, both URLs must carry `options=endpoint%3D<endpoint-id>` (endpoint id = first DNS label of the Neon host); without it Neon rejects the connection. Not needed on Vercel (real hostnames → SNI works).
