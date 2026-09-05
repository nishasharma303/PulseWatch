import { motion, AnimatePresence } from "framer-motion";

const LABELS: Record<string, string> = {
  price_anomaly: "Price anomaly",
  volume_anomaly: "Volume anomaly",
  market_divergence: "Market divergence",
  sector_divergence: "Sector divergence",
  historical_significance: "Historical significance",
};

export function ScoreBreakdown({
  open,
  breakdown,
}: {
  open: boolean;
  breakdown: { signalType: string; contribution: number }[];
}) {
  const max = Math.max(...breakdown.map((b) => b.contribution), 1);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className="pt-4 space-y-2.5">
            {breakdown.map((b, i) => (
              <div key={b.signalType} className="flex items-center gap-3 text-sm">
                <span className="w-40 text-white/60 shrink-0">{LABELS[b.signalType] ?? b.signalType}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-accent-gradient"
                    initial={{ width: 0 }}
                    animate={{ width: `${(b.contribution / max) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className="w-10 text-right text-white/80 tabular-nums">{Math.round(b.contribution)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
