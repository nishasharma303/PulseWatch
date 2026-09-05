import { getDeviceId } from "./ws";

const BASE_URL = import.meta.env.VITE_API_URL ?? "https://pulsewatch-5atg.onrender.com/api";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("pw_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Central fetch wrapper: on 401, the token is dead (expired/stale secret/etc).
// Clear it and force back to login instead of silently failing every call.
async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...options.headers, ...authHeaders() },
  });
  if (res.status === 401) {
    localStorage.removeItem("pw_token");
    localStorage.removeItem("pw_watchlist");
    window.location.reload();
    throw new Error("session expired, reloading");
  }
  return res;
}

export interface AttentionCard {
  symbol: string;
  isHolding: boolean;
  version: number;
  is52wHigh: boolean;
  is52wLow: boolean;
  price: number;
  prevClose: number;
  changePct: number;
  volume: number;
  attentionScore: number;
  breakdown: { signalType: string; rawValue: number; baseWeight: number; contribution: number }[];
  stale: boolean;
  source: "live" | "seeded";
  updatedAt: string;
}

export async function fetchAttention(watchlistId: string): Promise<AttentionCard[]> {
  const res = await apiFetch(`/attention/${watchlistId}`);
  if (!res.ok) throw new Error("failed to fetch attention");
  return res.json();
}

export async function fetchAway(watchlistId: string) {
  const res = await apiFetch(`/away/${watchlistId}`);
  if (!res.ok) throw new Error("failed to fetch away digest");
  return res.json();
}

export async function fetchNarration(watchlistId: string, symbol: string, held: boolean) {
  const res = await apiFetch(`/attention/${watchlistId}/${symbol}/narration?held=${held}`);
  if (!res.ok) throw new Error("failed to fetch narration");
  return res.json();
}

export async function postFeedback(signalType: string, action: "open" | "dismiss") {
  await apiFetch(`/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signalType, action }),
  });
}

export async function simulateNextTick() {
  const res = await apiFetch(`/dev/simulate-tick`, { method: "POST" });
  return res.json();
}

export interface HistoryBar {
  date: string;
  close: number;
}

export async function fetchHistory(symbol: string, range: string): Promise<HistoryBar[]> {
  const res = await apiFetch(`/history/${symbol}?range=${range}`);
  if (!res.ok) throw new Error("failed to fetch history");
  return res.json();
}

export async function fetchNiftyHistory(range: string): Promise<HistoryBar[]> {
  const res = await apiFetch(`/history/market/nifty?range=${range}`);
  if (!res.ok) throw new Error("failed to fetch nifty history");
  return res.json();
}

export async function addStock(watchlistId: string, symbol: string, isHolding: boolean) {
  const res = await apiFetch(`/watchlists/${watchlistId}/stocks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, isHolding, deviceId: getDeviceId() }),
  });
  if (!res.ok) throw new Error("failed to add stock");
  return res.json();
}

export class ConflictError extends Error {
  current: any;
  constructor(current: any) {
    super("conflict");
    this.current = current;
  }
}

export async function updateHolding(watchlistId: string, symbol: string, isHolding: boolean, expectedVersion: number) {
  const res = await apiFetch(`/watchlists/${watchlistId}/stocks/${symbol}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isHolding, expectedVersion, deviceId: getDeviceId() }),
  });
  if (res.status === 409) {
    const data = await res.json();
    throw new ConflictError(data.current);
  }
  if (!res.ok) throw new Error("failed to update holding");
  return res.json();
}

export async function fetchScaleMetrics() {
  const res = await apiFetch(`/dev/scale-metrics`);
  if (!res.ok) throw new Error("failed to fetch scale metrics");
  return res.json();
}

export async function fetchTimeline(symbol: string) {
  const res = await apiFetch(`/timeline/${symbol}`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchUserWeights() {
  const res = await apiFetch(`/feedback/weights`);
  if (!res.ok) return [];
  return res.json();
}

export interface BreakerSymbolState {
  symbol: string;
  breakerState: "closed" | "open" | "half-open";
  failureCount: number;
  stale: boolean;
  source: "live" | "seeded";
  lastWrite: string;
}

export async function fetchBreakerStates(): Promise<{ globalSource: string; symbols: BreakerSymbolState[] }> {
  const res = await apiFetch(`/dev/circuit-breakers`);
  if (!res.ok) throw new Error("failed to fetch breaker states");
  return res.json();
}

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

export async function sendChatMessage(
  watchlistId: string,
  message: string,
  history: ChatTurn[]
): Promise<{ text: string; source: "gemini" | "fallback" }> {
  const res = await apiFetch(`/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ watchlistId, message, history }),
  });
  if (!res.ok) throw new Error("chat failed");
  return res.json();
}

export interface SectorExposure {
  totalHoldings: number;
  sectors: { sector: string; count: number; symbols: string[]; pct: number; avgAttention: number }[];
  mostConcentratedSector: string | null;
  concentrationPct: number;
}

export async function fetchExposure(watchlistId: string): Promise<SectorExposure> {
  const res = await apiFetch(`/portfolio/exposure/${watchlistId}`);
  if (!res.ok) throw new Error("failed to fetch exposure");
  return res.json();
}

export interface Cluster {
  sector: string;
  symbols: string[];
  avgScore: number;
  direction: "up" | "down" | "mixed";
}

export async function fetchClusters(watchlistId: string): Promise<{ clusters: Cluster[] }> {
  const res = await apiFetch(`/portfolio/clusters/${watchlistId}`);
  if (!res.ok) throw new Error("failed to fetch clusters");
  return res.json();
}

export async function fetchTrend(symbol: string): Promise<{ series: { tick: number; score: number }[]; direction: string }> {
  const res = await apiFetch(`/trend/${symbol}`);
  if (!res.ok) throw new Error("failed to fetch trend");
  return res.json();
}

export async function fetchGlobalFeed(watchlistId: string) {
  const res = await apiFetch(`/timeline/watchlist/${watchlistId}/feed`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchDigestHistory(watchlistId: string) {
  const res = await apiFetch(`/away/${watchlistId}/history`);
  if (!res.ok) return [];
  return res.json();
}