import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StockAvatar } from "./StockAvatar";
import { AttentionCard as AttentionCardType } from "../lib/api";

type Tab = "new" | "trending" | "movers";

export function WatchlistPanel({
  cards,
  onSelect,
  selectedSymbol,
}: {
  cards: AttentionCardType[];
  onSelect: (symbol: string) => void;
  selectedSymbol: string | null;
}) {
  const [tab, setTab] = useState<Tab>("trending");

  const sorted = [...cards].sort((a, b) => {
    if (tab === "trending") return b.attentionScore - a.attentionScore;
    if (tab === "movers") return Math.abs(b.changePct) - Math.abs(a.changePct);
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="glass rounded-3xl p-6">
      <h3 className="font-display font-bold text-lg mb-4 tracking-tight">Watchlist</h3>
      <div className="flex gap-1 bg-white/[0.04] rounded-full p-1 mb-5 text-xs">
        {[
          { id: "new" as Tab, label: "New" },
          { id: "trending" as Tab, label: "Trending" },
          { id: "movers" as Tab, label: "Gainers & losers" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-full font-medium transition-all ${
              tab === t.id
                ? "bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr,auto,auto] gap-2 text-[10px] font-semibold uppercase tracking-wider text-white/30 px-3 mb-2">
        <span>Name</span>
        <span className="text-right">Volume</span>
        <span className="text-right">Change</span>
      </div>

      <div className="space-y-1">
        <AnimatePresence initial={false}>
          {sorted.map((c, i) => (
            <motion.button
              key={c.symbol}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onSelect(c.symbol)}
              className={`w-full grid grid-cols-[1fr,auto,auto] items-center gap-2 px-3 py-3 rounded-2xl transition-colors text-left ${
                selectedSymbol === c.symbol ? "bg-white/8 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" : "hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <StockAvatar symbol={c.symbol} size={34} />
                <span className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate">{c.symbol}</span>
                  {c.attentionScore >= 55 && <span className="text-[10px] font-medium text-rose">needs attention</span>}
                </span>
              </span>
              <span className="text-sm text-white/50 font-tnum text-right">{(c.volume / 1_000_000).toFixed(2)}M</span>
              <span className={`text-sm font-semibold font-tnum text-right ${c.changePct >= 0 ? "text-teal" : "text-rose"}`}>
                {c.changePct >= 0 ? "+" : ""}
                {c.changePct.toFixed(2)}%
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}