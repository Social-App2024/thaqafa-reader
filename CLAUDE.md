# CLAUDE.md — thaqafa-reader

## What this is

**thaqafa-reader** is the in-browser **ePub book reader** of the **Thaqafa** cultural
social network — a standalone web app where users read the purchased/free books that
are published on Thaqafa. It is a companion frontend to
[`../Thaqafa-Frontend`](../Thaqafa-Frontend) (the main social surface): the frontend
covers the feed/profiles/posts, this app covers the actual *reading*.

Features on top of plain reading: **dark/light mode**, **English/Arabic language
switch with RTL**, **text highlighting inside the epub**, and **sharing a highlighted
quote back to Thaqafa as an image post**, plus reading-position persistence synced to
the backend.

The repo is a **fork of [`react-reader`](https://github.com/gerhardsletten/react-reader)
v2.0.12** (git `upstream` remote still points there; `package.json` is still named
`react-reader`). It has **two halves**:

- `lib/` — the vendored, upstream react-reader library (a React wrapper around
  [epub.js](https://github.com/futurepress/epub.js)), publishable to npm from `dist/`.
- `src/` — the Thaqafa-specific app, which imports the library by **relative path**
  (`../lib` / `../../lib/index`), not from npm.

## Where this sits in the platform

Thaqafa's components live as **sibling repositories** under the same parent folder. The
central index is [`../thaqafa-ai-docbase`](../thaqafa-ai-docbase):

| Doc | What it gives you |
|-----|-------------------|
| [`../thaqafa-ai-docbase/INDEX.md`](../thaqafa-ai-docbase/INDEX.md) | Master catalog of every Thaqafa component + platform-wide constraints |
| [`../thaqafa-ai-docbase/components/thaqafa-reader.md`](../thaqafa-ai-docbase/components/thaqafa-reader.md) | This component's docbase page |
| [`../thaqafa-ai-docbase/components/thaqafa-frontend.md`](../thaqafa-ai-docbase/components/thaqafa-frontend.md) | Main web frontend summary |
| [`../app/CLAUDE.md`](../app/CLAUDE.md) | Backend source of truth |
| [`../app/api-contracts/`](../app/api-contracts) | **Per-endpoint JSON contracts — authoritative for every request/response shape** |

**Platform constraints that bind this repo** (canonical statement under
`## Platform context` in the docbase `INDEX.md`):

- **Region:** Middle East.
- **Interface languages:** Arabic and English. Arabic is right-to-left, so **every
  user-facing surface must be bilingual and RTL-capable** — a hard requirement.
- **Search languages:** Arabic, English, **and French**. French is a content/search
  language only; it is not an interface locale, so don't add a French UI locale here.

## Commands

- `npm run dev` — Vite dev server on **http://localhost:3000** (auto-opens browser)
- `npm run build` — **library** build (`clean` + `tsc -p tsconfig.prod.json` +
  `vite build --config vite.config.lib.ts` → `dist/`). ⚠️ Also runs automatically on
  `npm install` via the `prepare` script.
- `npm run build::app` — **app** build with the default Vite config
- `npm run build-vercel` — **app** build with `vite.config.vercel.ts` (what Vercel runs)
- `npm run preview` — preview a build
- `npm test` / `npm run jest` — Jest 29 + ts-jest, jsdom environment
- `npm run coverage` — Jest with coverage

The backend must be running on `http://localhost:9092/` for anything authenticated
(purchased books, protected book content, position sync, quote sharing) to work — see
[`../app/README.md`](../app/README.md) for its Docker Compose setup.

## Tech stack

- **React 18.3** + **react-router-dom 6** (`BrowserRouter`), **Vite 5** (`@vitejs/plugin-react`)
- **epubjs 0.3.93** — iframe-based epub rendering (epub 2 standard; most epub 3 works)
- **TypeScript 5.7** — `strict: true` **with `allowJs: true`**: JS and TS coexist
  (older files are `.js`/`.jsx`, newer ones `.ts`/`.tsx`)
- **axios** — HTTP client with a refresh-token interceptor (`src/api/client.js`)
- **i18next** + **react-i18next** — EN/AR localization (`src/i18n.ts`)
- **TailwindCSS 3.4** + PostCSS/autoprefixer
- **use-local-storage-state** — dark mode and reading positions in localStorage
- **react-swipeable** — swipe paging inside the vendored library
- **Jest 29 + ts-jest + Testing Library** — configured; **no test files exist yet**
- Prettier config in `package.json`: **no semicolons, single quotes**

## Repo layout

```
thaqafa-reader/
├── lib/                        # vendored react-reader library (upstream code)
│   ├── EpubView/               #   low-level epub.js iframe view (class component)
│   ├── ReactReader/            #   full reader chrome: TOC, arrows, swipe (class component)
│   └── index.ts                #   library barrel — src imports this via relative path
├── src/                        # the Thaqafa app
│   ├── main.tsx                #   entry: provider tree (see Boot section)
│   ├── App.tsx                 #   routes + NavBarMock + global NotificationContainer
│   ├── i18n.ts                 #   i18next init (en/ar, localStorage, <html dir>)
│   ├── api/                    #   axios wrappers (.js): client, bookContent, booksList,
│   │                           #   readingPosition, ShareCommand, userProfile
│   ├── components/             #   Reader.tsx (core), ReaderWrapper, BooksList,
│   │                           #   NavbarMock, ShareContextMenu, Notification*, config.ts
│   ├── context/PubSubContext.tsx   # global event bus (singleton via Context)
│   ├── data/                   #   providers: booksProvider, darkModeProvider,
│   │                           #   profileProvider, readingPositionProvider
│   ├── hooks/useReaderTheme.ts #   font-size + theme applier for a rendition
│   ├── localization/           #   en.json, ar.json
│   ├── util/pubSub.js          #   PubSub class (publish/subscribe/unsubscribe)
│   └── examples/               #   upstream react-reader demo pages (routed at
│                               #   /selection, /styling; rest are reference only)
├── public/files/               # demo epubs (alice.epub, book1–6.epub) + assets
├── index.html                  # app entry (Vite)
├── vite.config.ts              # dev server (:3000)
├── vite.config.lib.ts          # library build → dist/ (npm package)
├── vite.config.vercel.ts       # app build for Vercel deploy
├── vercel.json                 # SPA rewrite: all paths → /
└── .claude/skills/             # house skills: clean-code, js-design-patterns,
                                #   modern-best-practice-react-components
```

## Boot & provider tree

`src/main.tsx` nests (outer → inner): `StrictMode` → `BrowserRouter` →
`ProfileProvider` → `ReadingPositionProvider` → `DarkModeProvider` → `BooksProvider` →
`App`. `App.tsx` wraps everything in `PubSubProvider` and mounts a global
`NotificationContainer` outside the routed content.

Routes (`src/App.tsx`):

| Path | Element | Notes |
|------|---------|-------|
| `/` | `BooksList` + `Reader` | main screen: book shelf sidebar (md+) + reader |
| `/selection` | `examples/Selection` | upstream demo: highlight annotations list |
| `/styling` | `examples/Styling` | upstream demo: theme overrides |

`NavBarMock` is exactly what the name says — a **mock header for local development**
(the code comment says to remove it for a clean page). It carries the working EN/AR
language switch and the dark-mode toggle.

## Architecture

### Event bus (PubSub)

Cross-component communication uses a hand-rolled **PubSub** (`src/util/pubSub.js`)
exposed as a singleton through `PubSubContext` (`usePubSub()`). Known topics:

- `showContextMenu` — published by `Reader` on text selection, with viewport
  coordinates + selected text + book title/author; consumed by `ShareContextMenu`.
- `closeContextMenu` — published on mousedown / window resize / book change.
- `notification/show`, `notification/dismiss` — consumed by `NotificationContainer`.

`NotificationManager` is a **singleton facade** over the bus:
`NotificationManager.getInstance(pubsub).success(msg)` etc.

### Reading flow

1. `BooksProvider` fetches the shelf from `GET /reader/purchased-books`. On failure
   (e.g. 401) it falls back to a **fixed demo list** of the public epubs in
   `public/files/`. The selected book is persisted in localStorage under
   `thaqafa_selected_book`.
2. `Reader.tsx` resolves the book source: a public URL (`/files/...` or `http...`) is
   used directly; otherwise it fetches the protected bytes via
   `GET /reader/content/{bookId}` as a **blob** (60s timeout), validates the zip `PK`
   signature, and hands an `ArrayBuffer` to `<ReactReader>`.
3. `<ReactReader>` (from `lib/`) renders the epub in an iframe via epub.js and reports
   location changes as **epub CFI strings**.
4. Position is restored on book/user change and **saved debounced (1s)** through
   `ReadingPositionProvider`: written to localStorage (`reading-positions`, keyed
   `userId → bookId`) and POSTed to the backend. On load, backend positions are merged
   in — **backend wins when its timestamp is newer**.
5. Theme: `DarkModeProvider` (localStorage key `darkMode`) drives
   `rendition.themes.override('color'|'background', …)` — black bg / light text in dark
   mode. Epub chrome background follows via `readerStyles` override.

### Highlight → share-quote flow

1. `Reader` subscribes to epub.js `selected`: adds a blue `highlight` annotation,
   computes the selection's viewport position (selection rect + iframe offset), and
   publishes `showContextMenu`. `mousedown` clears the highlight and closes the menu.
2. `ShareContextMenu` renders the floating menu; **Share** renders the quote to an
   offscreen `<canvas>` (800px wide, word-wrapped, off-white card with decorative
   quote mark, title + author attribution) → PNG data URL → preview dialog.
3. Confirming calls `src/api/ShareCommand.js`: converts the data URL to a `File`,
   `POST /assets/upload` (multipart, `container: "tmp"`), then
   `POST /posts/publish` with `category: "photo"`, the uploaded URL, and tags
   `["book", "quote"]` — i.e. the quote lands on Thaqafa as an **image post**.
   Success/failure surfaces via `NotificationManager` and localized strings.

## Backend integration

`src/api/client.js` is a shared axios instance: base URL **hardcoded** to
`http://localhost:9092/`, `withCredentials: true` (carries the HttpOnly refresh-token
cookie), 10s timeout. The access token lives in localStorage (`access_token`) and is
sent as `Bearer`. On **401** the interceptor POSTs `/auth/refresh` (cookie-based),
queues concurrent requests until the refresh resolves, retries the original request
once, and clears the token if refresh fails.

Endpoints this app calls:

| File | Endpoint | Notes |
|------|----------|-------|
| `api/booksList.js` | `GET /reader/purchased-books` | the user's shelf |
| `api/bookContent.js` | `GET /reader/content/{bookId}` | protected epub bytes (blob); 403 = not purchased |
| `api/readingPosition.js` | `POST /reader/reading-position`, `GET /reader/reading-position/{bookId}`, `GET /reader/reading-positions`, `DELETE /reader/reading-position/{bookId}` | userId comes from the token server-side |
| `api/userProfile.js` | `GET /users/me` | profile; on failure `profileProvider` falls back to an **offline userId** |
| `api/ShareCommand.js` | `POST /assets/upload`, `POST /posts/publish` | quote-image post pipeline |
| `api/client.js` | `POST /auth/refresh` | token rotation |

**Contract caveat:** `../app/api-contracts` has **no `reader/` domain yet** — the
`/reader/*` endpoints above are not covered by contract files; verify shapes against
the running backend. `assets/upload.json`, `posts/publishPost.json`, and the `users/`
contracts do exist — read them before touching the corresponding API functions, and
note that `POST /posts/publish` accepts `category: "photo"` only (book posts are
event-driven server-side).

## Internationalization & RTL

- Init in `src/i18n.ts`: bundled `en`/`ar` resources (`src/localization/*.json`),
  fallback `en`, language persisted in localStorage (`language`). On change it sets
  `<html dir="rtl|ltr">` and `lang`.
- All user-visible strings go through `t()` with an `ar` counterpart — the share
  flow uses the `share.*` keys.
- Two kinds of direction coexist: **UI direction** (i18next-driven, above) and
  **book content direction** (the library's `ReactReader` accepts an `isRTL` prop
  that flips paging/swipe). The app does **not** drive `isRTL` yet — the demo books
  carry an `isRTL` field that is currently unused; wire it up when serving Arabic
  epubs whose progression is RTL.

## Conventions (house rules)

- **Style:** no semicolons, single quotes (Prettier config in `package.json`).
- **JS/TS coexist by design** — `api/*.js`, `booksProvider.jsx`, `BooksList.jsx`,
  `util/pubSub.js` are JS; newer code is TS/TSX. Don't mass-convert; match the file
  you're in.
- **Minimal edits:** don't rename/restructure adjacent code; the `lib/` half is
  vendored upstream code — avoid touching it unless fixing a real reader bug, and
  prefer keeping it mergeable with upstream `react-reader`.
- **The `prepare` script runs the library build on `npm install`** — expect a `dist/`
  rebuild after install.
- `console.log` debug logging is left throughout (`Reader`, API layer, share flow) —
  treat as scaffolding, not a logging standard to extend.
- Design patterns are deliberate here (see `.claude/skills/js-design-patterns`):
  PubSub for events, singleton facade for notifications, provider-per-concern for
  state.

## Known gaps & gotchas

- **`package.json` is still the upstream library's** — name `react-reader`, npm
  publishing fields (`main`/`module`/`exports`/`files`), and `build` = library build.
  For the app you want `build::app` (local) or `build-vercel` (deploy).
- **Jest is configured but there are no test files.**
- **API URL and auth are hardcoded** — no `import.meta.env` usage; the access token
  must be placed in localStorage manually for local authenticated testing
  (`setAccessToken` is exported from `src/api/client.js`).
- `NavBarMock` is dev scaffolding; `en.json`/`ar.json` still contain placeholder
  navbar values (`"home": "A"`, `"discover": "B"`, `"people": "C"`).
- `profileProvider` falls back to a hardcoded **offline userId** when `/users/me`
  fails — reading positions then sync under that ID.
- `useReaderTheme` (font-size/dark-mode hook) exists but `Reader.tsx` currently
  applies theme inline — minor duplication.
- Quote-image rendering uses a fixed Arial/Georgia canvas layout — Arabic quote text
  renders LTR-aligned; verify before shipping Arabic quote shares.
- epub.js limitations (upstream): no whole-book page numbers (per-chapter only),
  epub 2 standard, rendering happens in a sandboxed iframe.
