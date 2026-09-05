import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

export function WhileYouWereAway({
  open,
  onClose,
  digest,
  symbolsWithActivity,
}: {
  open: boolean;
  onClose: () => void;
  digest: string;
  symbolsWithActivity: string[];
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="glass rounded-3xl p-9 max-w-lg w-full relative overflow-hidden"
          >
            <div className="absolute -top-24 -left-16 h-56 w-56 rounded-full bg-accent-gradient opacity-25 blur-3xl pointer-events-none" />
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-white/50">
              <Sparkles size={13} />
              While you were away
            </span>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="font-display text-2xl font-bold mt-4 leading-snug tracking-tight"
            >
              {digest}
            </motion.p>

            {symbolsWithActivity.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {symbolsWithActivity.map((s, i) => (
                  <motion.span
                    key={s}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                    className="text-xs font-medium bg-white/8 border border-white/10 rounded-full px-3.5 py-1.5"
                  >
                    {s}
                  </motion.span>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              className="mt-8 w-full rounded-2xl bg-accent-gradient py-3.5 font-semibold text-sm hover:opacity-90 transition-opacity shadow-glow"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}