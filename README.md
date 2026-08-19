# Amazi — Water Equity Monitor (pilot)

A small full-stack app for tracking water availability by sector, weighted by
population, and computing a "need score" to prioritize where attention should
go next.

- **Backend:** Express + a JSON file as the data store (no database setup needed).
  Swap `backend/data/*.json` for a real database later if this grows.
- **Frontend:** React (Vite). Talks to the API through a dev proxy.

## What's in here

- `POST /api/sectors` — register a new sector (name, district, population)
- `GET /api/sectors` — list all sectors with their latest reported availability
  and computed need score, sorted highest-need first
- `POST /api/reports` — submit a water availability report for a sector
  (`reporterType`: `"official"` or `"citizen_check"`)
- `GET /api/sectors/:id/reports` — report history for one sector

**Need score** = 50% population weight + 50% scarcity weight (`100 - availability%`),
both normalized 0–1 across current sectors. It's intentionally simple — tune the
weighting in `backend/server.js` (`computeScores`) once you have real data to
calibrate against.

The nine seeded sectors (three each in Nyanza, Nyabihu, Nyarugenge) use
**illustrative population figures** — replace them with real NISR numbers before
this is used for anything beyond a demo.

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

## Next steps to consider

- Swap the JSON file store for SQLite/Postgres once you have real report volume.
- Add auth so only the assigned Sector Executive Secretary can report for their sector.
- Add the every-2-months citizen spot-check as a distinct view that flags sectors
  where the official report and citizen report diverge significantly.
- Pull real population figures from NISR instead of the seed data.
