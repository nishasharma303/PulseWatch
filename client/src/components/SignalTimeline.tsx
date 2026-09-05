import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { fetchTimeline } from "../lib/api";

interface SignalEvent {
  id: string;
  symbol: string;
  timestamp: string;
  signalType: string;
  value: number;
  contribution: number;
}

const LABELS: Record<string, string> = {
  price_anomaly: "Price anomaly",
  volume_anomaly: "Volume anomaly",
  market_divergence: "Market divergence",
  sector_divergence: "Sector divergence",
  historical_significance: "Historical significance",
};

const DOT_COLOR: Record<string, string> = {
  price_anomaly: "#F43F5E",
  volume_anomaly: "#F59E0B",
  market_divergence: "#8B5CF6",
  sector_divergence: "#8B5CF6",
  historical_significance: "#2DD4BF",
};

export function SignalTimeline({ symbol }: { symbol: string }) {
  const { data: events = [], isLoading } = useQuery<SignalEvent[]>({
    queryKey: ["timeline", symbol],
    queryFn: () => fetchTimeline(symbol),
  });

  if (isLoading) return <p className="text-white/40 text-sm">Loading timeline…</p>;
  if (events.length === 0) return <p className="text-white/40 text-sm">No events recorded yet.</p>;

  return (
    <div className="relative pl-4 border-l border-white/10 space-y-4">
      {events.map((e, i) => (
        <motion.div
          key={e.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03, duration: 0.3 }}
          className="relative"
        >
          <span
            className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-base"
            style={{ background: DOT_COLOR[e.signalType] ?? "#fff" }}
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/80">{LABELS[e.signalType] ?? e.signalType}</span>
            <span className="text-white/40 text-xs">{new Date(e.timestamp).toLocaleTimeString()}</span>
          </div>
          <span className="text-xs text-white/50">contribution {e.contribution.toFixed(1)}</span>
        </motion.div>
      ))}
    </div>
  );
}