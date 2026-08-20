# Amazi — Water Equity Monitor (pilot)

A closed, two-portal system between **Sector officials** and **WASAC** — no
public or citizen layer. Sectors report their own water availability; WASAC
sees every sector ranked by a computed need score.

- **Backend:** Express + a JSON file as the data store (no database setup needed).
  Swap `backend/data/*.json` for a real database later if this grows.
- **Frontend:** React (Vite). Talks to the API through a dev proxy.
- **Auth:** simple username/password login, sessions kept in memory on the
  server. Good enough for a local pilot — see "Before this goes anywhere real" below.

## The two portals

- **Sector portal** — a sector official logs in and sees only their own
  sector: current status, and a form to submit a new availability report.
  They cannot see or report on any other sector.
- **WASAC portal** — sees every sector, ranked by need score, and can
  register new sectors (which auto-creates that sector's login).

## API

- `POST /api/auth/login` — `{ username, password }` → `{ token, role, sectorId, sectorName }`
- `GET /api/me` — validate a token, return the current session
- `GET /api/sectors` — WASAC gets every sector; a sector account gets only its own
- `POST /api/sectors` — **WASAC only.** Register a new sector; auto-creates its login
- `POST /api/reports` — **Sector accounts only.** Submits a report for *their own*
  sector — `sectorId` is taken from the authenticated session, never from the request body
- `GET /api/sectors/:id/reports` — full report history; a sector account can only
  request its own sector's id

**Need score** = 50% population weight + 50% scarcity weight (`100 - availability%`),
both normalized 0–1 across current sectors. Tune the weighting in
`backend/server.js` (`computeScores`) once you have real data to calibrate against.

The nine seeded sectors (three each in Nyanza, Nyabihu, Nyarugenge) use
**illustrative population figures** — replace them with real NISR numbers before
this is used for anything beyond a demo.

## Demo accounts

| Username | Password | Role |
|---|---|---|
| `wasac_hq` | `wasac123` | WASAC |
| `nyamirambo`, `busasamana`, `jenda`, etc. (slugified sector name) | `sector123` | Sector |

Every seeded sector shares the same demo password — fine for a pilot, not for
production.

## Run it

**Backend** (in one terminal):
```
cd backend
npm install
npm run dev        # or: npm start
```
Runs on `http://localhost:4000`.

**Frontend** (in another terminal):
```
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173` and proxies `/api/*` to the backend.

Open `http://localhost:5173` in your browser.

## Before this goes anywhere real

- Sessions live in an in-memory `Map` on the server — they reset if the
  backend restarts, and there's no expiry. Fine for a pilot; swap for
  JWTs or a real session store before wider rollout.
- Every seeded sector shares one demo password. Force a password change
  on first login before handing this to real Sector Executive Secretaries.
- Pull real population figures from NISR instead of the illustrative seed data.

## Next steps to consider

- Swap the JSON file store for SQLite/Postgres once you have real report volume.
- WASAC drill-down: click into a sector from the WASAC portal to see its full
  report history, not just the latest number.
- An allocation-planning view on the WASAC side — turn the ranked need list
  into an actual suggested rationing schedule, not just a sorted table.
