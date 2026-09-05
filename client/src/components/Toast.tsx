import { AnimatePresence, motion } from "framer-motion";

export interface ToastItem {
  id: string;
  title: string;
  subtitle?: string;
  kind?: "alert" | "sync" | "conflict";
}

const BORDER: Record<string, string> = {
  alert: "border-rose",
  sync: "border-teal",
  conflict: "border-amber",
};

export function ToastStack({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 w-72">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`glass rounded-xl p-4 border-l-2 ${BORDER[t.kind ?? "alert"]} flex items-start justify-between gap-3`}
          >
            <div>
              <p className="text-sm font-medium">{t.title}</p>
              {t.subtitle && <p className="text-xs text-white/50 mt-0.5">{t.subtitle}</p>}
            </div>
            <button onClick={() => onDismiss(t.id)} className="text-white/30 hover:text-white/70 text-xs">
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}