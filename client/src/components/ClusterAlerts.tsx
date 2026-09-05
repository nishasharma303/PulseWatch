import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { fetchClusters } from "../lib/api";

export function ClusterAlerts({ watchlistId }: { watchlistId: string }) {
  const { data } = useQuery({
    queryKey: ["clusters", watchlistId],
    queryFn: () => fetchClusters(watchlistId),
    refetchInterval: 15000,
  });

  const clusters = data?.clusters ?? [];
  if (clusters.length === 0) return null;

  return (
    <div className="space-y-3 mb-4">
      <AnimatePresence>
        {clusters.map((c) => (
          <motion.div
            key={c.sector}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl p-4 border border-violet/30 bg-violet/5 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium">
                {c.symbols.length} {c.sector} stocks moving together{" "}
                <span className={c.direction === "up" ? "text-teal" : c.direction === "down" ? "text-rose" : "text-amber"}>
                  ({c.direction})
                </span>
              </p>
              <p className="text-xs text-white/50 mt-0.5">
                {c.symbols.join(", ")} — this reads as a sector move, not isolated stock noise
              </p>
            </div>
            <span className="font-display text-lg font-semibold text-violet shrink-0 ml-3">{c.avgScore}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}