# PulseWatch

**A market watchlist that tells you what changed and why — not just what the price is.**
---

## The problem with every watchlist app

Every stock app already shows price, percent change, volume, a chart. None of that is hard to build, and none of it answers the actual question a person watching 20–30 stocks has: *which of these actually needs my attention today?*

That question gets harder, not easier, as a watchlist grows. More stocks means more numbers to manually scan, not more insight. PulseWatch flips the responsibility — the system decides what's worth surfacing, explains why in plain language, and gets quieter (not noisier) as your watchlist grows, because most of what it detects is filtered out before you ever see it.

## What it actually does

- **Detects anomalies relative to each stock's own history** — a 3% move means something different for a stock that normally moves 0.5% a day than one that normally moves 4%. A flat percentage threshold can't tell the difference; a z-score against the stock's own rolling volatility can.
- **Contextualizes every move against the market and sector** — a stock up 5% on a day the index is up 4.8% did nothing. The same move on a flat day is real. Every score factors in both.
- **Explains itself, always** — every attention score expands into its exact weighted breakdown. No score is ever a black box, which matters more in a financial product than almost anywhere else.
- **Learns what you personally care about** — dismissing volume alerts and opening price alerts a few times shifts your personal weighting accordingly, visibly, in your own signal profile.
- **Distinguishes holding from watching** — the same signal means something different depending on whether real money is at stake or you're just curious, and the scoring reflects that.
- **Reasons about your portfolio, not just individual stocks** — sector concentration risk and correlated multi-stock moves are surfaced as their own insights, not left for you to notice by scanning cards one at a time.
- **Talks back** — an in-app assistant answers questions about your watchlist by calling real backend functions, never by guessing at numbers it wasn't given.

## Architecture

```
Ingestion (poll) → Change Detection → Context → Attention Engine → Narrator (Gemini) → API → Frontend
                                                                                            ↕
                                                                                      WebSocket push
```

**Three engines carry the product:**

1. **Change Detection** — price anomaly (z-score against the stock's own volatility, not a flat threshold), volume anomaly (vs. 20-day average), 52-week high/low flags.
2. **Context** — market divergence (stock return vs. NIFTY) and sector divergence (stock return vs. sector average), computed once per tick and shared across everyone watching that stock.
3. **Attention Engine** — a deterministic, fully auditable weighted sum of the above, with two personalization layers applied at read time: a holding-vs-watching bias, and an adaptive per-user multiplier learned from engagement.

**Narrator (Gemini):** receives only pre-computed structured JSON, never raw prices, and is never asked to calculate anything — its only job is phrasing. If the call fails or times out, a deterministic template built from the same JSON takes over instantly. The same constraint applies to the in-app chat assistant, which answers only via function-calling against real backend endpoints (`getAttentionScore`, `getUnusualStocks`, `getWatchlistSummary`) rather than free-form generation.

**Event-sourced core:** every signal is written once to an append-only `signal_events` log and never edited or deleted. The current score lives in a materialized `stock_snapshots` table, recomputed on every write so reads stay cheap. That one decision — log everything, cache the derived view — is what makes the signal timeline, the "while you were away" digest, and the attention-trend sparkline all fall out of the same mechanism instead of three separate features.

## What happens when a session ends and another begins

A watchlist that resets every time you close the tab isn't really a watchlist — it's a search. Two things had to hold up here, and both were treated as real engineering problems rather than assumptions:

**Returning later.** Every session end is a `last_seen_at` timestamp; every return replays the event log between that timestamp and now into a plain-language digest, which is then persisted — so "what changed" is a history you can scroll, not a popup that's gone the moment you dismiss it.

**Being open in two places at once.** A phone and a laptop open on the same account are a normal case, not an edge case, so state doesn't just eventually converge — it stays live. A WebSocket layer pushes shared market updates to every connected client, and pushes a user's own watchlist edits to that same user's other open sessions in real time. When two devices edit the same thing close enough together to actually collide, the write path checks version numbers before committing, and the losing device gets told about the conflict instead of quietly overwriting or being overwritten.

## Handling an unreliable dependency

There's no free, official real-time NSE/BSE API — that's a genuine constraint of the domain, not a corner we cut. `getPrice(symbol)` is the single function every other module depends on for a price, and it never throws: it tries a live source, and on failure or timeout falls back to the last known value with a `stale: true` flag, backed by a real per-symbol circuit breaker (closed → open → half-open) rather than a boolean "is it broken" check. The rest of the pipeline never knows or cares which path served the number — which is also what makes the data source itself swappable behind one env var.

For this build, `PRICE_SOURCE` defaults to a deterministic seeded generator rather than the live path — full reasoning in **Data source** below.

## Data source — the honest part

This app runs on **seeded, deterministic data by default**, and that's a deliberate choice, not a fallback we're hoping you don't notice.

The only free live option is an unofficial, delayed, rate-limited Yahoo Finance endpoint — wired up and working (`PRICE_SOURCE=live`), but not something worth depending on for a live demo or a stable review process. Seeded data is generated from a fixed random seed per symbol (so it's reproducible, not random noise), with two symbols engineered to have a genuinely unusual day, so the detection pipeline always has something real to find.

What's real regardless of source: every anomaly score, every divergence calculation, every cluster and exposure computation, the AI narration, the sync, and the conflict handling are running against whatever numbers `getPrice()` returns — live or seeded, the downstream code is identical.

## Tech stack

**Frontend:** React + Vite + TypeScript, Tailwind CSS, TanStack Query, Framer Motion, Recharts, native WebSocket client

**Backend:** Node.js + Express + TypeScript, one modular service (`ingestion` / `engine` / `narrator` / `api` / `ws`), no fake microservices

**Database:** Postgres via Prisma — chosen so the schema is self-documenting through migrations rather than hand-maintained SQL

**AI:** Gemini API, called only from `narrator/`, with a real fallback path exercised on every failure, not a commented-out TODO

**Realtime:** `ws`, authenticated per-connection via the same JWT used for REST calls

## Project structure

```
server/
  prisma/schema.prisma        data model — see comments for append-only vs. materialized tables
  src/
    ingestion/                getPrice() circuit breaker, seeded data, poller
    engine/                   detection / context / attention — pure functions, no I/O
    narrator/                 Gemini narration, template fallback, chat function-calling
    ws/                       WebSocket hub — shared broadcasts + per-user pushes
    api/routes/                REST endpoints
client/
  src/
    components/               ranked cards, charts, sync status, conflict toasts, etc.
    pages/                    Dashboard / Timeline / Digest
    lib/                      api client (with 401 handling), WebSocket client
```

## Local setup

### Requirements
- Node 18+
- A free Neon Postgres project (or any Postgres connection string)
- Optional: a Gemini API key — everything works without one, using the fallback narrator/chat

### Backend
```bash
cd server
cp .env.example .env
# paste your DATABASE_URL into .env
npm install
npx prisma migrate dev --name init
npx tsx src/db/seedWatchlist.ts demo@pulsewatch.dev demo1234
npm run dev
```
Runs on `:4000`, starts polling immediately, opens a WebSocket at `/ws`.

### Frontend
```bash
cd client
npm install
npm run dev
```
Open `:5173`, log in with `demo@pulsewatch.dev` / `demo1234`.

### Switching to live prices
Set `PRICE_SOURCE=live` in `server/.env`. Nothing else changes — the circuit breaker handles the rest.

### Enabling Gemini
Set `GEMINI_API_KEY` in `server/.env`. Without it, narration and chat silently use their deterministic fallbacks.

