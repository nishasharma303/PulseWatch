import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

interface ClientInfo {
  ws: WebSocket;
  userId: string;
  deviceId: string;
}

const clients = new Set<ClientInfo>();

export function initWsHub(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    try {
      const url = new URL(req.url ?? "", "http://localhost");
      const token = url.searchParams.get("token") ?? "";
      const deviceId = url.searchParams.get("deviceId") ?? "unknown";
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };

      const info: ClientInfo = { ws, userId: payload.userId, deviceId };
      clients.add(info);

      ws.on("close", () => clients.delete(info));
      ws.on("error", () => clients.delete(info));
    } catch {
      ws.close(4001, "unauthorized");
    }
  });

  return wss;
}

// Shared, market-wide push — every connected client gets this regardless of
// user. Mirrors the stock-level compute tier: computed once per tick, pushed
// to everyone watching, instead of every client polling independently.
export function broadcastSnapshotUpdate(payload: { tickId: number; durationMs: number; symbolsProcessed: number }) {
  const message = JSON.stringify({ type: "snapshot-update", ...payload });
  for (const c of clients) {
    if (c.ws.readyState === c.ws.OPEN) c.ws.send(message);
  }
}

// User-scoped push — only the SAME user's other connected devices/tabs get
// this. A watchlist edit made on one device shows up live on another as
// "edited elsewhere" — the concrete, demoable answer to "how does state
// stay consistent across sessions/devices."
export function broadcastWatchlistChange(
  userId: string,
  payload: { watchlistId: string; symbol: string; field: string; value: unknown; deviceId: string; conflict: boolean }
) {
  const message = JSON.stringify({ type: "watchlist-changed", ...payload });
  for (const c of clients) {
    if (c.userId === userId && c.ws.readyState === c.ws.OPEN) c.ws.send(message);
  }
}

export function connectedClientCount(): number {
  return clients.size;
}