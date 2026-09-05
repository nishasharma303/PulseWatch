import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, ChevronDown } from "lucide-react";
import { RadialScore } from "./RadialScore";
import { FreshnessBadge } from "./FreshnessBadge";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { SignalTimeline } from "./SignalTimeline";
import { AttentionTrendSparkline } from "./AttentionTrendSparkline";
import { AttentionCard as AttentionCardType, fetchNarration, postFeedback, updateHolding, ConflictError } from "../lib/api";

export function AttentionCard({
  card,
  watchlistId,
  index,
  onConflict,
}: {
  card: AttentionCardType;
  watchlistId: string;
  index: number;
  onConflict?: (title: string, subtitle: string) => void;
}) {
  const [open, setOpen] = useState(card.attentionScore >= 55);
  const [narration, setNarration] = useState<string | null>(null);
  const [loadingNarration, setLoadingNarration] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingNarration(true);
    fetchNarration(watchlistId, card.symbol, card.isHolding)
      .then((res) => {
        if (!cancelled) setNarration(res.text);
      })
      .catch(() => {
        if (!cancelled) setNarration(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingNarration(false);
      });
    return () => {
      cancelled = true;
    };
  }, [card.symbol, watchlistId, card.isHolding]);

  const glowClass = card.attentionScore >= 70 ? "bg-rose" : card.attentionScore >= 40 ? "bg-amber" : "bg-teal";
  const up = card.changePct >= 0;

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    postFeedback("price_anomaly", next ? "open" : "dismiss");
  }

  async function toggleHolding(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await updateHolding(watchlistId, card.symbol, !card.isHolding, card.version);
    } catch (err) {
      if (err instanceof ConflictError) {
        onConflict?.(
          "Edit conflict detected",
          `${card.symbol} was already changed elsewhere — showing the latest version.`
        );
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.005 }}
      className="glass rounded-3xl p-6 relative overflow-hidden"
      style={
        card.attentionScore >= 55
          ? { boxShadow: `0 0 ${Math.min(card.attentionScore, 90)}px -30px rgba(244,63,94,0.5)` }
          : undefined
      }
    >
      <div className={`absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl opacity-20 pointer-events-none ${glowClass}`} />

      <div className="flex items-start justify-between gap-4 relative cursor-pointer" onClick={toggleOpen}>
        <div className="flex items-center gap-4">
          <RadialScore score={card.attentionScore} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-xl tracking-tight">{card.symbol}</h3>
              {card.is52wHigh && (
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-teal/15 text-teal px-2.5 py-1 rounded-full border border-teal/30">
                  52W High
                </span>
              )}
              {card.is52wLow && (
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-rose/15 text-rose px-2.5 py-1 rounded-full border border-rose/30">
                  52W Low
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5 mt-1.5">
              <span className="font-display text-lg text-white/90 font-tnum">₹{card.price.toFixed(2)}</span>
              <span
                className={`flex items-center gap-0.5 text-sm font-medium font-tnum px-2 py-0.5 rounded-full ${
                  up ? "text-teal bg-teal/10" : "text-rose bg-rose/10"
                }`}
              >
                {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {Math.abs(card.changePct).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <FreshnessBadge updatedAt={card.updatedAt} stale={card.stale} />
          <AttentionTrendSparkline symbol={card.symbol} />
          <button
            onClick={toggleHolding}
            className={`text-[10px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
              card.isHolding ? "border-violet/40 text-violet bg-violet/10" : "border-white/10 text-white/40 hover:text-white/70"
            }`}
          >
            {card.isHolding ? "Holding" : "Mark as holding"}
          </button>
        </div>
      </div>

      <p className="mt-4 text-sm text-white/60 leading-relaxed">
        {loadingNarration ? "Generating explanation…" : narration ?? "No narration available."}
      </p>

      <ScoreBreakdown open={open} breakdown={card.breakdown} />

      {open && (
        <div className="mt-4 pt-4 border-t border-white/8">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTimeline((v) => !v);
            }}
            className="flex items-center gap-1 text-xs font-medium text-white/40 hover:text-white/70 transition-colors"
          >
            {showTimeline ? "Hide signal timeline" : "Show signal timeline"}
            <ChevronDown size={13} className={`transition-transform ${showTimeline ? "rotate-180" : ""}`} />
          </button>
          {showTimeline && (
            <div className="mt-3">
              <SignalTimeline symbol={card.symbol} />
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}