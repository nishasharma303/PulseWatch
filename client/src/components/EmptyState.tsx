import { motion } from "framer-motion";

export function EmptyState({ count }: { count: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass rounded-2xl p-10 flex flex-col items-center text-center gap-3"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 14 }}
        className="h-14 w-14 rounded-full bg-accent-gradient flex items-center justify-center text-2xl"
      >
        ✓
      </motion.div>
      <h3 className="font-display text-xl font-semibold">All caught up</h3>
      <p className="text-white/60 text-sm max-w-xs">
        {count} stocks monitored. Nothing needs your attention right now.
      </p>
    </motion.div>
  );
}
