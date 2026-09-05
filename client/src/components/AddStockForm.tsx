import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronDown, Check } from "lucide-react";
import { DEMO_SYMBOLS } from "../lib/symbols";
import { addStock } from "../lib/api";

export function AddStockForm({ watchlistId, onAdded }: { watchlistId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [isHolding, setIsHolding] = useState(false);
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleAdd() {
    if (!symbol) return;
    setError("");
    try {
      await addStock(watchlistId, symbol.toUpperCase(), isHolding);
      setSymbol("");
      setIsHolding(false);
      setOpen(false);
      onAdded();
    } catch {
      setError("Couldn't add that stock — try again.");
    }
  }

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="glass rounded-full px-5 py-2.5 text-sm font-medium flex items-center gap-1.5 hover:border-white/20 hover:bg-white/5 transition-all"
      >
        <Plus size={15} />
        Add stock
      </button>
      {/* Fade + slide instead of a height/overflow-hidden animation — that pattern was
          clipping/garbling the dropdown panel nested inside it. */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="glass rounded-2xl p-5 mt-3 flex flex-col gap-3 max-w-sm"
          >
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none hover:border-white/20 focus:border-teal/40 transition-colors"
              >
                <span className={symbol ? "text-white" : "text-white/40"}>{symbol || "Select symbol…"}</span>
                <ChevronDown
                  size={15}
                  className={`text-white/40 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    // Solid, near-opaque background — this panel sits ON TOP of the
                    // checkbox/button below it, so it must fully block them, not blend.
                    className="absolute z-30 mt-2 w-full rounded-xl border border-white/10 bg-[#10141C] p-1.5 max-h-56 overflow-y-auto shadow-card-lift"
                  >
                    {DEMO_SYMBOLS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setSymbol(s);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                          symbol === s ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/8 hover:text-white"
                        }`}
                      >
                        {s}
                        {symbol === s && <Check size={14} className="text-teal" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={isHolding}
                onChange={(e) => setIsHolding(e.target.checked)}
                className="accent-violet"
              />
              I'm holding this stock
            </label>
            {error && <p className="text-rose text-xs">{error}</p>}
            <button
              onClick={handleAdd}
              className="rounded-xl bg-accent-gradient py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity shadow-glow-sm"
            >
              Add to watchlist
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}