import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { fetchUserWeights } from "../lib/api";

interface Weight {
  signalType: string;
  multiplier: number;
}

const LABELS: Record<string, string> = {
  price_anomaly: "Price anomalies",
  volume_anomaly: "Volume anomalies",
  market_divergence: "Market divergence",
  sector_divergence: "Sector divergence",
  historical_significance: "Historical significance",
};

export function UserWeightsProfile() {
  const { data: weights = [] } = useQuery<Weight[]>({
    queryKey: ["user-weights"],
    queryFn: fetchUserWeights,
  });

  if (weights.length === 0) {
    return (
      <div className="glass rounded-2xl p-5">
        <h3 className="font-display font-semibold mb-2">Your signal profile</h3>
        <p className="text-white/40 text-sm">
          Open and dismiss a few cards — we'll learn what you actually care about.
        </p>
      </div>
    );
  }

  const sorted = [...weights].sort((a, b) => b.multiplier - a.multiplier);
  const top = sorted[0];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
      <h3 className="font-display font-semibold mb-1">Your signal profile</h3>
      {top && (
        <p className="text-white/50 text-xs mb-4">
          You tend to care about {LABELS[top.signalType] ?? top.signalType} more than average — we've adjusted your scores.
        </p>
      )}
      <div className="space-y-2.5">
        {sorted.map((w) => {
          const pct = Math.min(100, (w.multiplier / 2) * 100);
          const boosted = w.multiplier > 1.02;
          const suppressed = w.multiplier < 0.98;
          return (
            <div key={w.signalType} className="flex items-center gap-3 text-sm">
              <span className="w-40 text-white/60 shrink-0">{LABELS[w.signalType] ?? w.signalType}</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${boosted ? "bg-teal" : suppressed ? "bg-rose" : "bg-white/30"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <span className="w-12 text-right text-white/70 tabular-nums text-xs">{w.multiplier.toFixed(2)}x</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}