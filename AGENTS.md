# AGENTS.md — thaqafa-reader

**Read [`CLAUDE.md`](./CLAUDE.md) before doing non-trivial work.** It is the full
source of truth for this repo: the two-half repo layout (vendored `lib/` vs. Thaqafa
`src/`), the reading/highlight/share flows, the PubSub event bus, backend integration,
i18n/RTL, and known gotchas. This file is only the bootstrap — the constraints below
are the ones you must not violate even on a quick task.

## Non-negotiables

- **Bilingual + RTL is a hard requirement.** Every user-facing surface works in
  English and Arabic. All user-visible strings go through `t()` with an `ar`
  counterpart in `src/localization/`; UI direction is driven by i18next setting
  `<html dir>`.
- **`lib/` is vendored upstream `react-reader` code.** Avoid touching it unless
  fixing a real reader bug; keep it mergeable with upstream. Thaqafa features belong
  in `src/`.
- **`npm run build` builds the npm library, not the app.** For the app use
  `npm run build::app` (local) or `npm run build-vercel` (deploy). Note `npm install`
  also triggers the library build via `prepare`.
- **Backend contracts are authoritative.** Before adding/changing an API call, check
  `../app/api-contracts/<domain>/` — but be aware the `/reader/*` endpoints have no
  contract files yet; verify against the running backend (`http://localhost:9092/`).
- **Cross-component events go through the PubSub bus** (`usePubSub()` topics), not
  prop-drilling or new ad-hoc channels. Notifications go through the
  `NotificationManager` singleton.
- **Minimal edits, house style:** no semicolons, single quotes (Prettier config in
  `package.json`); JS and TS coexist by design — match the file you're in, don't
  mass-convert; don't rename/restructure adjacent code.

## Task → doc map

| Doing | Read first |
|-------|-----------|
| Anything architectural / data / flows | [`CLAUDE.md`](./CLAUDE.md) |
| Touching the reader library | [`README.md`](./README.md) (upstream react-reader docs) + `lib/` source |
| Writing or changing API calls | `../app/api-contracts/<domain>/<endpoint>.json` (no `reader/` contracts exist yet) |
| Backend context | [`../app/CLAUDE.md`](../app/CLAUDE.md), [`../thaqafa-ai-docbase/INDEX.md`](../thaqafa-ai-docbase/INDEX.md) |

## Commands

- `npm run dev` — Vite dev server (http://localhost:3000); backend must run on `http://localhost:9092/`
- `npm run build` — library build to `dist/` (also runs on `npm install` via `prepare`)
- `npm run build::app` / `npm run build-vercel` — app builds (local / Vercel)
- `npm test` — Jest + ts-jest (configured; no test files exist yet)

## Verification

After changes: `npm run build::app` (app) or `npm run build` (if you touched `lib/`),
and exercise the reader manually at http://localhost:3000 with the backend running —
open a demo book, toggle dark mode and language, select text, and share a quote.
There is no test suite to run yet.
