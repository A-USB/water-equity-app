# Amazi — Water Equity Monitor (pilot)

A closed, two-portal system between **Sector officials** and **WASAC** — no
public or citizen layer. Users pick their role up front, then sign in or
create an account for that role. Sectors report their own water availability;
WASAC sees every district, drills into its sectors, and ranks everything by
a computed need score.

- **Backend:** Express + a JSON file as the data store (no database setup needed).
- **Frontend:** React (Vite) with a sidebar shell and recharts for trend charts. Talks to the API through a dev proxy.
- **Auth:** username/password, self-service signup for both roles, sessions
  kept in memory on the server. Good enough for a local pilot — see
  "Before this goes anywhere real" below.

## Flow

1. **Landing page** — explains what Amazi is and what each portal does, before asking anyone to sign in.
2. **Role select** — "Executive Secretary" or "WASAC".
3. **Sign in or sign up** for that role. Sector signup also registers the
   sector itself (name, district, population) in one step.
4. **Sector portal** — an official sees only their own sector: current
   status, a form to submit a new report, and their report history.
5. **WASAC portal (dashboard)** — districts shown as cards with aggregated
   stats (avg availability across the district's sectors, total population,
   how many sectors have reported, an average need score, and how many need
   attention). Click a district to drill into its sectors, paginated 6 at a time.
6. **Sector drill-down** — click any sector (from a district view or the
   "Needs attention" panel) to open its full report history plus a trend
   chart of availability over time.
7. **Stale-report alerts** — a sector with no report in over 14 days is
   flagged "Stale"; over 30 days (or never reported) is flagged "Needs
   attention." Shows on the sector card itself, rolls up into a count on
   each district card, and surfaces as a ranked national list at the top of
   the WASAC dashboard.

## API

- `POST /api/auth/login` — `{ username, password }`
- `POST /api/auth/signup` — `{ role, username, password, ...sector fields if role="sector" }`
- `GET /api/me` — validate a token, return the current session
- `GET /api/districts` — **WASAC only.** Aggregated stats per district
- `GET /api/districts/:district/sectors?page=&pageSize=` — **WASAC only.** Paginated sectors in a district
- `GET /api/sectors` — WASAC gets every sector; a sector account gets only its own
- `POST /api/sectors` — **WASAC only.** Register a new sector administratively (signup does this too, self-service)
- `POST /api/reports` — **Sector accounts only.** Always tied to the authenticated session's own sector
- `GET /api/sectors/:id/reports` — a sector account can only request its own sector's id

**Need score** = 50% population weight + 50% scarcity weight (`100 - availability%`),
both normalized 0–1 across current sectors. Tune the weighting in
`backend/server.js` (`computeScores`) once you have real data to calibrate against.
District `avgNeedScore` is a plain average of its sectors' need scores;
`avgAvailability` only counts sectors that have actually reported.

**Staleness** — a sector is "Stale" past 14 days since its last report, and
"Needs attention" past 30 days or if it's never reported at all. The threshold
is `STALE_DAYS` in `backend/server.js` and must be kept in sync with the same
constant in `frontend/src/utils.js`.

The nine seeded sectors (three each in Nyanza, Nyabihu, Nyarugenge) use
**illustrative population figures** — replace them with real NISR numbers before
this is used for anything beyond a demo.

## Demo accounts

| Username | Password | Role |
|---|---|---|
| `wasac_hq` | `wasac123` | WASAC |
| `nyamirambo`, `busasamana`, `jenda`, etc. (slugified sector name) | `sector123` | Sector |

Or just use the signup form to create your own of either kind.

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
- **Signup is currently wide open** — anyone can create a WASAC account or
  register a new "sector." Before real deployment, gate this behind an
  invite code, an admin-approval step, or restrict signup to a known list
  of sector names.
- Pull real population figures from NISR instead of the illustrative seed data.

## Next steps to consider

- Swap the JSON file store for SQLite/Postgres once you have real report volume.
- An allocation-planning view — turn the ranked need list into an actual
  suggested rationing schedule, not just a sorted table.
- Sidebar "Reports" and "Settings" are placeholders for now — you'll want to
  say what should live there.
- A district-level map view — see below.
