type WsHandler = (msg: any) => void;

const WS_URL = (import.meta.env.VITE_WS_URL as string | undefined) ?? "ws://localhost:4000/ws";

let socket: WebSocket | null = null;
let handlers: WsHandler[] = [];

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem("pw_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("pw_device_id", id);
  }
  return id;
}

export function getDeviceId(): string {
  return getOrCreateDeviceId();
}

export function connectWs(onStatusChange?: (connected: boolean) => void) {
  const token = localStorage.getItem("pw_token");
  if (!token) return;
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;

  socket = new WebSocket(`${WS_URL}?token=${token}&deviceId=${getDeviceId()}`);

  socket.onopen = () => onStatusChange?.(true);
  socket.onclose = () => {
    onStatusChange?.(false);
    setTimeout(() => connectWs(onStatusChange), 3000); // auto-reconnect
  };
  socket.onerror = () => socket?.close();
  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      handlers.forEach((h) => h(msg));
    } catch {
      // ignore malformed messages
    }
  };
}

export function onWsMessage(handler: WsHandler) {
  handlers.push(handler);
  return () => {
    handlers = handlers.filter((h) => h !== handler);
  };
}