import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, BarChart3, GitBranch, Layers, History, ChevronDown, Radio } from "lucide-react";
import { fetchGlobalFeed, AttentionCard } from "../lib/api";
import { SignalTimeline } from "../components/SignalTimeline";

const LABELS: Record<string, string> = {
  price_anomaly: "Price anomaly",
  volume_anomaly: "Volume anomaly",
  market_divergence: "Market divergence",
  sector_divergence: "Sector divergence",
  historical_significance: "Historical significance",
};

const SIGNAL_META: Record<string, { icon: typeof Activity; color: string; bg: string }> = {
  price_anomaly: { icon: Activity, color: "text-teal", bg: "bg-teal/10" },
  volume_anomaly: { icon: BarChart3, color: "text-violet", bg: "bg-violet/10" },
  market_divergence: { icon: GitBranch, color: "text-amber", bg: "bg-amber/10" },
  sector_divergence: { icon: Layers, color: "text-violet", bg: "bg-violet/10" },
  historical_significance: { icon: History, color: "text-rose", bg: "bg-rose/10" },
};

export function TimelinePage({ watchlistId, cards }: { watchlistId: string; cards: AttentionCard[] }) {
  const [focusSymbol, setFocusSymbol] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: feed = [] } = useQuery({
    queryKey: ["global-feed", watchlistId],
    queryFn: () => fetchGlobalFeed(watchlistId),
    refetchInterval: 15000,
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr,340px] gap-4">
      <div className="glass rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="h-9 w-9 rounded-xl bg-accent-gradient flex items-center justify-center shadow-glow-sm shrink-0">
            <Radio size={16} className="text-white" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight">Watchlist activity feed</h2>
            <p className="text-xs text-white/40 mt-0.5">Live signal events across every symbol you track</p>
          </div>
        </div>

        {feed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <span className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
              <Activity size={20} className="text-white/30" />
            </span>
            <p className="text-white/40 text-sm max-w-xs">
              No material events recorded yet — try "Simulate next tick" a few times.
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[19px] top-3 bottom-3 w-px bg-gradient-to-b from-white/15 via-white/8 to-transparent" />
            <div className="space-y-1">
              {feed.map((e: any, i: number) => {
                const meta = SIGNAL_META[e.signalType] ?? { icon: Activity, color: "text-white/60", bg: "bg-white/5" };
                const Icon = meta.icon;
                return (
                  <motion.button
                    key={e.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => setFocusSymbol(e.symbol)}
                    className={`relative w-full flex items-center gap-3.5 text-left px-2.5 py-3 rounded-2xl transition-colors ${
                      focusSymbol === e.symbol ? "bg-white/8" : "hover:bg-white/5"
                    }`}
                  >
                    <span className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ring-1 ring-white/10 ${meta.bg}`}>
                      <Icon size={16} className={meta.color} />
                    </span>
                    <span className="flex-1 min-w-0 flex flex-col">
                      <span className="text-sm font-semibold truncate">{e.symbol}</span>
                      <span className="text-xs text-white/40 truncate">{LABELS[e.signalType] ?? e.signalType}</span>
                    </span>
                    <span className="text-xs text-white/30 font-tnum shrink-0">
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="glass rounded-3xl p-6 h-fit">
        <h3 className="font-display font-bold tracking-tight mb-1">Symbol detail</h3>
        <p className="text-xs text-white/40 mb-4">Pick a symbol or tap a feed row</p>

        {/* Custom listbox — same dark glass treatment everywhere, never a native white popup */}
        <div className="relative mb-5" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none hover:border-white/20 focus:border-teal/40 transition-colors"
          >
            <span className={focusSymbol ? "text-white" : "text-white/40"}>{focusSymbol || "Select a symbol…"}</span>
            <ChevronDown size={15} className={`text-white/40 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute z-20 mt-2 w-full glass rounded-xl p-1.5 max-h-56 overflow-y-auto shadow-card-lift"
              >
                {cards.map((c) => (
                  <button
                    key={c.symbol}
                    type="button"
                    onClick={() => {
                      setFocusSymbol(c.symbol);
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                      focusSymbol === c.symbol ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {c.symbol}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {focusSymbol ? (
          <SignalTimeline symbol={focusSymbol} />
        ) : (
          <p className="text-white/40 text-sm">Pick a symbol or click a feed row to see its full timeline.</p>
        )}
      </div>
    </div>
  );
}