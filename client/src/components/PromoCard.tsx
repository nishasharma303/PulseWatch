import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function PromoCard({ onOpen, hasDigest }: { onOpen: () => void; hasDigest: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="rounded-3xl p-6 bg-accent-gradient relative overflow-hidden flex flex-col justify-between"
    >
      <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute top-4 right-4 h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
        <Sparkles size={16} className="text-white" />
      </div>
      <div>
        <h3 className="font-display text-xl font-bold tracking-tight">While you were away</h3>
        <p className="text-sm text-white/85 mt-2 max-w-xs leading-relaxed">
          {hasDigest ? "Something moved. Tap to see the briefing." : "Catch up on everything since your last visit."}
        </p>
      </div>
      <button
        onClick={onOpen}
        className="mt-5 self-start rounded-xl bg-black/20 hover:bg-black/30 transition-colors px-5 py-2.5 text-sm font-semibold backdrop-blur-sm"
      >
        View digest
      </button>
    </motion.div>
  );
}