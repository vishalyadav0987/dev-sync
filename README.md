# DSA Portfolio Platform

## Stack
React + Tailwind + Monaco (client) · Express + Prisma (server) · PostgreSQL

## Folder structure
```
dsa-portfolio/
├── server/
│   ├── prisma/schema.prisma      # Category, Problem, GuestSession, Blog, Comment, StudySession, Note
│   ├── prisma/seed.js
│   ├── src/
│   │   ├── index.js               # Express app entry
│   │   ├── lib/prisma.js          # Prisma client singleton
│   │   ├── middleware/guestAuth.js # x-guest-id identity + admin bearer token
│   │   └── routes/
│   │       ├── problems.js        # GET /api/categories, /api/problems, /api/problems/:slug
│   │       ├── blogs.js           # CRUD blogs + comments, owner-checked via guestId
│   │       ├── sessions.js        # Study sessions + notes, scoped to req.guestId
│   │       └── admin.js           # Daily content entry, token-gated
│   └── .env.example
└── client/
    ├── src/
    │   ├── hooks/useGuestId.js     # mints/reads localStorage UUID
    │   ├── lib/api.js              # fetch wrapper, auto-attaches x-guest-id
    │   ├── lib/streak.js           # pure streak calculation (unit-testable)
    │   ├── components/Header/Header.jsx      # nav + streak badge
    │   ├── components/DSA/FolderTree.jsx     # hierarchical category nav
    │   ├── components/DSA/CodeAnalyzer.jsx   # complexity/edge-case/visual card
    │   ├── pages/DSAPage.jsx       # folder tree + analyzer + Monaco solution
    │   ├── pages/BlogPage.jsx      # markdown posts + comments
    │   ├── pages/SessionsPage.jsx  # study sessions + notes
    │   ├── pages/AdminPage.jsx     # unlinked /author-console daily entry form
    │   └── App.jsx
    └── .env.example
```

## Setup
```bash
# 1. Database
createdb dsa_portfolio

# 2. Server
cd server
cp .env.example .env        # fill DATABASE_URL + ADMIN_TOKEN
npm install
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev                 # http://localhost:4000

# 3. Client
cd ../client
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

## Design decisions worth knowing
- **Guest identity is a trust-based UUID, not auth.** `x-guest-id` is read straight
  from the client and upserted into `GuestSession`. Ownership checks (blog edit,
  note edit) compare `authorId === guestId` — good enough for a no-login portfolio
  site, not a substitute for real auth if you ever add sensitive data.
- **Streak logic is a pure function** (`computeNextStreak`) separated from the
  localStorage read/write so it's trivially unit-testable without mocking `window`.
- **`visualHtml` is rendered via `dangerouslySetInnerHTML`.** It's only ever
  written through the token-gated admin route (i.e., authored by you), so it's
  treated as trusted content. If you ever let guests submit visualizations,
  sanitize server-side (e.g. `sanitize-html`) before storing.
- **Rate limiting** is on write-heavy, unauthenticated `/api/blogs*` routes since
  there's no login to throttle by account.
- **Folder tree** is stored as a self-referencing `Category` table and flattened
  to the client, which rebuilds the nested tree client-side — keeps the API
  simple and cacheable.

## Next steps to harden for production
1. Swap the admin bearer token for a real signed session (even a simple magic-link).
2. Sanitize `contentMd` / `visualHtml` server-side before persisting.
3. Add Prisma indexes you actually query by in production (already added for FKs).
4. Add optimistic UI + React Query for the client instead of raw `useEffect` fetches.
