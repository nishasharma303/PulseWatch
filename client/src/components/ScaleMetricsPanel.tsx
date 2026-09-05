import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { fetchScaleMetrics } from "../lib/api";

export function ScaleMetricsPanel() {
  const { data } = useQuery({
    queryKey: ["scale-metrics"],
    queryFn: fetchScaleMetrics,
    refetchInterval: 10000,
  });

  if (!data) return null;
  const { lastTick, connectedClients } = data;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
      <h3 className="font-display font-semibold mb-1">Scale &amp; compute split</h3>
      <p className="text-white/40 text-xs mb-4">
        Shared compute runs once per tick no matter how many users watch. Per-user personalization is a cheap read-time transform, applied separately.
      </p>
      {lastTick ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <Metric label="Last tick total" value={`${lastTick.durationMs}ms`} />
          <Metric label="Symbols processed" value={String(lastTick.symbolsProcessed)} />
          <Metric label="Shared compute" value={`${lastTick.sharedComputeMs}ms`} />
          <Metric label="Per-symbol compute" value={`${lastTick.perSymbolComputeMs}ms`} />
          <Metric label="Connected clients" value={String(connectedClients)} />
          <Metric
            label="Avg per symbol"
            value={`${(lastTick.perSymbolComputeMs / Math.max(1, lastTick.symbolsProcessed)).toFixed(1)}ms`}
          />
        </div>
      ) : (
        <p className="text-white/30 text-sm">No tick run yet — hit "Simulate next tick."</p>
      )}
    </motion.div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-3">
      <p className="text-white/40 text-[11px]">{label}</p>
      <p className="font-display font-semibold tabular-nums mt-0.5">{value}</p>
    </div>
  );
}