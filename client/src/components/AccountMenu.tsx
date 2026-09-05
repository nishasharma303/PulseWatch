import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, LogOut } from "lucide-react";

export function AccountMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const initials = email.slice(0, 2).toUpperCase();

  function updatePosition() {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
  }

  function toggleOpen() {
    if (!open) updatePosition();
    setOpen((v) => !v);
  }

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleScrollOrResize() {
      updatePosition();
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open]);

  function handleLogout() {
    localStorage.clear();
    window.location.href = "/";
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggleOpen}
        className="flex items-center gap-1.5 cursor-pointer"
      >
        <div className="h-9 w-9 rounded-full bg-accent-gradient flex items-center justify-center text-xs font-semibold text-white">
          {initials}
        </div>
        <ChevronDown size={14} className={`text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="w-56 rounded-2xl p-2 shadow-2xl"
              style={{
                position: "fixed",
                top: coords.top,
                right: coords.right,
                zIndex: 9999,
                background: "#151A24",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div className="px-3 py-2 border-b border-white/10 mb-1">
                <p className="text-xs text-white/40">Signed in as</p>
                <p className="text-sm text-white truncate">{email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              >
                <LogOut size={14} />
                Log out
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}