import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { AttentionCard } from "../lib/api";

export function NotificationBell({ cards }: { cards: AttentionCard[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const alerts = cards
    .filter((c) => c.attentionScore >= 55)
    .sort((a, b) => b.attentionScore - a.attentionScore);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
      >
        <Bell size={16} />
        {alerts.length > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose text-[10px] flex items-center justify-center">
            {alerts.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 w-80 glass rounded-2xl p-3 z-50 max-h-96 overflow-y-auto"
          >
            <p className="text-xs uppercase tracking-wide text-white/40 px-2 pb-2">Needs attention</p>
            {alerts.length === 0 ? (
              <p className="text-sm text-white/40 px-2 py-4 text-center">Nothing needs your attention right now.</p>
            ) : (
              <div className="space-y-1">
                {alerts.map((a) => (
                  <div key={a.symbol} className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-white/5">
                    <div>
                      <p className="text-sm font-medium">{a.symbol}</p>
                      <p className="text-xs text-white/40">
                        {a.changePct >= 0 ? "+" : ""}
                        {a.changePct.toFixed(2)}% today
                      </p>
                    </div>
                    <span className="font-display font-semibold text-rose text-sm">{a.attentionScore}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}