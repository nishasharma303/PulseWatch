<div align="center">

# PulseWatch

**A market watchlist that tells you what changed, why it's unusual, and whether it deserves your attention — not just what the price is.**

Built for Groww CODE 2026

[Live Demo](https://pulsewatch-client.onrender.com/) · [Architecture](#architecture) · [Setup](#getting-started) · [API Reference](#api-reference)

</div>

---

## Table of Contents

- [Why this exists](#why-this-exists)
- [What it does](#what-it-does)
- [Architecture](#architecture)
- [The three engines](#the-three-engines)
- [State, sessions, and multiple devices](#state-sessions-and-multiple-devices)
- [Resilience](#resilience)
- [The AI layer](#the-ai-layer)
- [Data model](#data-model)
- [Data source](#data-source)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [API reference](#api-reference)
- [What's deliberately not here](#whats-deliberately-not-here)

---

## Why this exists

Every stock app already shows price, percent change, volume, and a chart. None of that is difficult to build, and none of it answers the question a person watching 20–30 stocks actually has: *which of these needs my attention right now?*

That question gets harder as a watchlist grows, not easier — more stocks means more numbers to manually scan, not more insight. PulseWatch inverts the responsibility: the system decides what's worth surfacing, explains its reasoning in plain language, and gets *quieter* as a watchlist grows, because most of what it detects is filtered out before it ever reaches the user.

## What it does

| | |
|---|---|
| **Detects anomalies relative to each stock's own history** | A 3% move means something different for a stock that typically moves 0.5% a day than one that typically moves 4%. A flat percentage threshold can't distinguish these; a rolling z-score against the stock's own volatility can. |
| **Contextualizes every move against market and sector** | A stock up 5% on a day the index is up 4.8% did nothing unusual. The same move on a flat day is real. Every score accounts for both. |
| **Explains itself, always** | Every attention score expands into its exact weighted breakdown. No score is ever a black box — a deliberate constraint in a financial product. |
| **Learns what a user personally cares about** | Dismissing volume alerts and opening price alerts a few times measurably shifts personal signal weighting, visible in a live profile. |
| **Distinguishes holding from watching** | The same signal carries different weight depending on whether real money is at stake or the user is simply curious. |
| **Reasons about the portfolio, not just individual stocks** | Sector concentration risk and correlated multi-stock moves are surfaced directly, instead of left for a user to notice by scanning cards one at a time. |
| **Stays live across devices** | A change made on one session appears on another in real time, with conflicting edits caught and surfaced rather than silently overwritten. |
| **Talks back** | An in-app assistant answers questions about the watchlist by calling real backend functions — never by guessing at numbers it wasn't given. |

## Architecture

```
                    ┌─────────────┐
                    │  Ingestion  │  poll every 30s, per symbol
                    │  getPrice() │  circuit breaker: live ⇄ seeded
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Change    │  z-score vs. own volatility
                    │  Detection  │  volume vs. 20d avg, 52w flags
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Context   │  vs. NIFTY, vs. sector average
                    │   Engine    │  (computed once/tick, shared)
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Attention  │  deterministic weighted score
                    │   Engine    │  + holding bias + adaptive weights
                    └──────┬──────┘
                           │
              ┌────────────┼─────────────┐
              │            │             │
       ┌──────▼─────┐ ┌────▼────┐  ┌─────▼──────┐
       │  Narrator  │ │  REST   │  │ WebSocket  │
       │  (Gemini)  │ │   API   │  │    Hub     │
       └────────────┘ └────┬────┘  └─────┬──────┘
                            │             │
                      ┌─────▼─────────────▼─────┐
                      │        Frontend          │
                      │  React · TanStack Query  │
                      └──────────────────────────┘
```

Every stage above is a pure, independently testable module with a single responsibility. Nothing is a fake microservice split apart for appearance — this is one modular service, boundaries drawn where the logic actually changes shape.

## The three engines

### 1. Change Detection

Computes, per symbol, per poll tick:
- **Price anomaly** — a z-score of today's return against that stock's own rolling daily volatility, not a fixed threshold like "±2%." A stock that normally swings 4% a day needs a much bigger move to register as unusual than one that normally swings 0.5%.
- **Volume anomaly** — current volume divided by its 20-day average.
- **State flags** — 52-week high/low, largest N-day move.

### 2. Context

Raw movement is meaningless without a reference point. This engine computes:
- **Market divergence** — stock return minus NIFTY return
- **Sector divergence** — stock return minus the average return of its sector peers

Sector averages are computed once per tick and shared across every stock in that sector and every user watching it — this is the shared, stock-level compute tier, and it's what lets the system scale with the number of *stocks* tracked rather than the number of *users* watching them.

### 3. Attention

Combines the above into one score via a deterministic weighted sum:

```
score = w1·price_anomaly + w2·volume_anomaly
      + w3·market_divergence + w4·sector_divergence
      + w5·historical_significance
```

No machine learning model sits behind this number on purpose — every point is traceable to a specific signal, which matters when the product is telling someone something about their money. Two personalization layers apply on top, both recomputed at read time rather than baked into the shared snapshot:

- **Holding vs. watching bias** — held stocks weight downside/volatility signals up; watch-only stocks weight breakout signals up.
- **Adaptive per-user weighting** — opening a card's detail (engagement) or dismissing it (disinterest) nudges a small per-signal multiplier for that user, visible in their own profile, not hidden inside a model.

## State, sessions, and multiple devices

A watchlist that resets every time a tab closes isn't really a watchlist — it's a search. Two requirements were treated as engineering problems here, not assumptions to wave past.

**Returning later.** Every session end is a `last_seen_at` timestamp. Every return replays the append-only event log between that timestamp and now into a plain-language digest — and that digest is persisted, so "what changed" is a scrollable history, not a popup gone the moment it's dismissed.

**Being open in two places at once.** A phone and a laptop signed into the same account is the normal case, not the edge case. A WebSocket layer pushes shared market updates to every connected client and pushes a user's own watchlist edits to that same user's other open sessions, in real time — no polling required for state to feel current. When two sessions edit the same field close enough together to actually collide, the write path checks a version number before committing; the losing write is rejected with a 409 and the client is told a conflict happened, instead of one edit silently vanishing.

## Resilience

There's no free, official, real-time NSE/BSE API — a genuine constraint of this domain, addressed rather than hidden.

`getPrice(symbol)` is the single function every other module depends on, and it never throws. It attempts a live source and, on failure or timeout, falls back to the last known value with `stale: true`, backed by a real per-symbol circuit breaker with three states — **closed** (calling normally), **open** (failing repeatedly, serving cache), **half-open** (testing recovery) — rather than a binary "is it broken" flag. No downstream module knows or cares which path served a given price, which is also what makes the source swappable behind one environment variable.

Signal writes are idempotent: each event carries a dedupe key derived from the symbol, signal type, and poll tick, so a retried tick can never double-count a signal into an inflated score.

## The AI layer

Gemini is used in two places, under one hard constraint: **it only ever phrases numbers that have already been computed. It never calculates, and it never sees raw prices.**

- **Narrator** — receives a small structured JSON payload per stock and turns it into one or two natural-language sentences. If the call fails or times out, a deterministic template built from the same JSON takes over immediately, so a narration is never missing and the product never breaks because of an external AI dependency.
- **Ask-Your-Watchlist chat** — answers questions via real function-calling against the backend (`getAttentionScore`, `getUnusualStocks`, `getWatchlistSummary`, `getSectorExposure`, `get52wExtremes`). The model decides which function to call; the function executes against real data; the model phrases the result. It cannot answer from general knowledge about the query, because it isn't given any facts except what the function returns. A rule-based fallback (not "please try again") covers the case where no API key is configured or the call fails.

## Data model

The core design decision underneath the whole system: **log everything, cache the derived view.**

- `signal_events` — append-only. Every computed signal is written once and never updated or deleted.
- `stock_snapshots` — a materialized, cached current state (score + breakdown), recomputed on every write so reads stay O(1) instead of replaying the full log each time.

This single decision produces three separate-feeling features from one mechanism: the per-stock signal timeline, the "while you were away" digest (an event replay between two timestamps), and the attention-trend sparkline (a reconstruction of score history per poll tick) — none of which required a dedicated history table.

## Data source

This build runs on **seeded, deterministic data by default**, and that is a stated design choice, not an unfinished feature.

The only free option for live prices is an unofficial, delayed, rate-limited Yahoo Finance endpoint — implemented and working (`PRICE_SOURCE=live`), but not something worth depending on for a stable demo or review process. Seeded data is generated from a fixed per-symbol seed (reproducible, not random noise), with select symbols engineered to have a genuinely unusual day, so the detection pipeline always has something real to find.

What doesn't change based on source: every anomaly score, every divergence calculation, every cluster and exposure computation, the AI narration, the sync, and the conflict handling run identically against whatever `getPrice()` returns.

## Tech stack

**Frontend** — React, Vite, TypeScript, Tailwind CSS, TanStack Query, Framer Motion, Recharts, native WebSocket client

**Backend** — Node.js, Express, TypeScript — one modular service (`ingestion` / `engine` / `narrator` / `api` / `ws`)

**Database** — PostgreSQL via Prisma, chosen so the schema is self-documenting through migrations rather than hand-maintained SQL

**AI** — Gemini API, called only from `narrator/`, with a real, exercised fallback path — not a commented-out TODO

**Realtime** — `ws`, authenticated per-connection using the same JWT issued for REST calls

## Project structure

```
server/
  prisma/schema.prisma       data model — append-only vs. materialized tables
  src/
    ingestion/                getPrice() circuit breaker, seeded data generator, poller
    engine/                   detection / context / attention — pure functions, no I/O
    narrator/                 Gemini narration, template fallback, chat function-calling
    ws/                       WebSocket hub — shared broadcasts + per-user pushes
    api/routes/                REST endpoints

client/
  src/
    components/                ranked cards, charts, sync status, conflict toasts
    pages/                     Dashboard / Timeline / Digest
    lib/                       API client (with auth + 401 handling), WebSocket client
```

## Getting started

### Requirements
- Node.js 18+
- A PostgreSQL database ([Neon](https://neon.tech) free tier works, no card required)
- Optional: a [Gemini API key](https://aistudio.google.com/apikey) — the app is fully functional without one

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
Starts the API and WebSocket server on `:4000` and begins polling immediately.

### Frontend
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` and sign in with `demo@pulsewatch.dev` / `demo1234` (or use the one-click autofill on the login screen).

### Switching to live prices
```
PRICE_SOURCE=live
```
in `server/.env`. Nothing else changes — the circuit breaker handles the rest.

### Enabling Gemini
```
GEMINI_API_KEY=your-key-here
```
Without it, narration and chat use their deterministic fallbacks silently.

## API reference

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/register`, `/api/auth/login` | Email/password auth, returns JWT |
| `GET` | `/api/watchlists` | List a user's watchlists |
| `POST` | `/api/watchlists/:id/stocks` | Add a symbol, optionally as a holding |
| `PATCH` | `/api/watchlists/:id/stocks/:symbol` | Update holding status — requires `expectedVersion`, returns `409` on conflict |
| `GET` | `/api/attention/:watchlistId` | Ranked attention cards for a watchlist |
| `GET` | `/api/attention/:watchlistId/:symbol/narration` | AI (or fallback) explanation for one stock |
| `GET` | `/api/timeline/:symbol` | Full signal event log for a stock |
| `GET` | `/api/timeline/watchlist/:id/feed` | Cross-stock activity feed |
| `GET` | `/api/away/:watchlistId` | While-you-were-away digest (also persists it) |
| `GET` | `/api/away/:watchlistId/history` | Digest history |
| `GET` | `/api/portfolio/exposure/:watchlistId` | Sector concentration |
| `GET` | `/api/portfolio/clusters/:watchlistId` | Correlated multi-stock moves |
| `GET` | `/api/trend/:symbol` | Attention score trend reconstruction |
| `POST` | `/api/chat` | Ask-Your-Watchlist, function-calling |
| `GET` | `/api/dev/circuit-breakers` | Live per-symbol breaker state |
| `GET` | `/api/dev/scale-metrics` | Last poll tick timing, compute-tier split |
| `WS` | `/ws?token=&deviceId=` | Live push: snapshot updates, watchlist changes, conflicts |


<div align="center">

**PulseWatch** — not a data display tool. An attention-management system.

</div>
