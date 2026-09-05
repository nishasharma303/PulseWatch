import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { RadialScore } from "./RadialScore";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { SignalTimeline } from "./SignalTimeline";
import { FreshnessBadge } from "./FreshnessBadge";
import { AttentionCard as AttentionCardType, fetchNarration, postFeedback } from "../lib/api";

export function StockDetailDrawer({
  card,
  watchlistId,
  onClose,
}: {
  card: AttentionCardType | null;
  watchlistId: string;
  onClose: () => void;
}) {
  const [narration, setNarration] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!card) return;
    setNarration(null);
    setLoading(true);
    postFeedback("price_anomaly", "open");
    fetchNarration(watchlistId, card.symbol, card.isHolding)
      .then((r) => setNarration(r.text))
      .catch(() => setNarration(null))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.symbol]);

  return (
    <AnimatePresence>
      {card && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 h-full w-full max-w-md glass p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-semibold">{card.symbol}</h2>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <RadialScore score={card.attentionScore} size={80} />
              <div>
                <p className="text-2xl font-display font-semibold tabular-nums">₹{card.price.toFixed(2)}</p>
                <p className={`text-sm tabular-nums ${card.changePct >= 0 ? "text-teal" : "text-rose"}`}>
                  {card.changePct >= 0 ? "▲" : "▼"} {Math.abs(card.changePct).toFixed(2)}%
                </p>
                <div className="mt-1">
                  <FreshnessBadge updatedAt={card.updatedAt} stale={card.stale} />
                </div>
              </div>
            </div>

            <p className="text-sm text-white/70 leading-relaxed mb-6">
              {loading ? "Generating explanation…" : narration ?? "No narration available."}
            </p>

            <h3 className="text-xs uppercase tracking-wide text-white/40 mb-3">Score breakdown</h3>
            <ScoreBreakdown open breakdown={card.breakdown} />

            <h3 className="text-xs uppercase tracking-wide text-white/40 mt-8 mb-3">Signal timeline</h3>
            <SignalTimeline symbol={card.symbol} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}