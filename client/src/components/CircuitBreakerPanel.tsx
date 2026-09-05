import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { fetchBreakerStates } from "../lib/api";

const STATE_STYLES: Record<string, string> = {
  closed: "bg-teal/10 text-teal border-teal/20",
  "half-open": "bg-amber/10 text-amber border-amber/20",
  open: "bg-rose/10 text-rose border-rose/20",
};

export function CircuitBreakerPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["breakers"],
    queryFn: fetchBreakerStates,
    refetchInterval: 5000,
  });

  if (isLoading || !data) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold">Resilience &amp; data source</h3>
        <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/50">
          global: {data.globalSource}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {data.symbols.map((s) => (
          <div key={s.symbol} className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium">{s.symbol}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${STATE_STYLES[s.breakerState]}`}>
                {s.breakerState}
              </span>
            </div>
            <p className="text-[11px] text-white/40">
              {s.stale ? "stale cache" : "fresh"} &middot; {s.source}
            </p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-white/30 mt-3">
        Circuit breaker per symbol: closed = calling live source normally, open = failing repeatedly and serving cached data, half-open = testing recovery.
      </p>
    </motion.div>
  );
}