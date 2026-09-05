import { useEffect, useState } from "react";
import { connectWs, onWsMessage } from "../lib/ws";

export function SyncStatus() {
  const [connected, setConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [, forceTick] = useState(0);

  useEffect(() => {
    connectWs(setConnected);
    const unsub = onWsMessage((msg) => {
      if (msg.type === "snapshot-update") setLastSync(new Date());
    });
    return unsub;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const secondsAgo = lastSync ? Math.floor((Date.now() - lastSync.getTime()) / 1000) : null;

  return (
    <div className="flex items-center gap-2 text-xs font-medium text-white/40 px-2 mb-5">
      <span className="relative flex h-2 w-2">
        {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${connected ? "bg-teal shadow-glow-teal" : "bg-rose"}`} />
      </span>
      {connected ? (secondsAgo !== null ? `Synced live · ${secondsAgo}s ago` : "Connected") : "Reconnecting…"}
    </div>
  );
}