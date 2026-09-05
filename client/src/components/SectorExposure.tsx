import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { fetchExposure } from "../lib/api";

const SECTOR_COLORS: Record<string, string> = {
  energy: "#F59E0B",
  banking: "#8B5CF6",
  it: "#2DD4BF",
  other: "#64748B",
};

export function SectorExposure({ watchlistId }: { watchlistId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["exposure", watchlistId],
    queryFn: () => fetchExposure(watchlistId),
  });

  if (isLoading || !data) return null;

  if (data.totalHoldings === 0) {
    return (
      <div className="glass rounded-2xl p-5">
        <h3 className="font-display font-semibold mb-2">Sector exposure</h3>
        <p className="text-white/40 text-sm">Mark a stock as "Holding" to see your concentration risk.</p>
      </div>
    );
  }

  const isConcentrated = data.concentrationPct >= 60;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display font-semibold">Sector exposure</h3>
        {isConcentrated && (
          <span className="text-[10px] uppercase tracking-wide bg-amber/15 text-amber px-2 py-0.5 rounded-full border border-amber/30">
            Concentrated
          </span>
        )}
      </div>
      <p className="text-white/40 text-xs mb-4">
        {isConcentrated
          ? `${data.concentrationPct}% of your holdings are in ${data.mostConcentratedSector} — a bad day for that sector hits harder than it should.`
          : "Your holdings are reasonably spread across sectors."}
      </p>

      <div className="w-full h-3 rounded-full overflow-hidden flex mb-4">
        {data.sectors.map((s) => (
          <div
            key={s.sector}
            style={{ width: `${s.pct}%`, background: SECTOR_COLORS[s.sector] ?? "#64748B" }}
            className="h-full"
          />
        ))}
      </div>

      <div className="space-y-2">
        {data.sectors.map((s) => (
          <div key={s.sector} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: SECTOR_COLORS[s.sector] ?? "#64748B" }} />
              <span className="capitalize text-white/70">{s.sector}</span>
              <span className="text-white/30 text-xs">({s.symbols.join(", ")})</span>
            </span>
            <span className="text-white/50 tabular-nums text-xs">
              {s.pct}% &middot; avg attn {s.avgAttention}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}