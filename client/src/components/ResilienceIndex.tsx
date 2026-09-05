import { motion } from "framer-motion";
import { AttentionCard as AttentionCardType } from "../lib/api";

export function ResilienceIndex({ cards }: { cards: AttentionCardType[] }) {
  const holdings = cards.filter((c) => c.isHolding);
  const pool = holdings.length > 0 ? holdings : cards;
  const avgAttention = pool.length > 0 ? pool.reduce((a, c) => a + c.attentionScore, 0) / pool.length : 0;
  const resilience = Math.round(100 - avgAttention);

  const label = resilience >= 70 ? "Calm" : resilience >= 40 ? "Watchful" : "Volatile";
  const color = resilience >= 70 ? "text-teal" : resilience >= 40 ? "text-amber" : "text-rose";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="glass rounded-2xl p-5"
    >
      <p className="text-white/50 text-sm mb-1">Resilience index</p>
      <div className="flex items-baseline gap-2">
        <span className={`font-display text-3xl font-semibold ${color}`}>{resilience}</span>
        <span className={`text-sm ${color}`}>{label}</span>
      </div>
      <p className="text-white/30 text-xs mt-2">
        Based on {pool.length} {holdings.length > 0 ? "holdings" : "watched stocks"}
      </p>
    </motion.div>
  );
}