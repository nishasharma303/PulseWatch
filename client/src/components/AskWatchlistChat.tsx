import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { sendChatMessage } from "../lib/api";
import { useEffect as useEffectAlias } from "react";


interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  source?: "gemini" | "fallback";
}

export function AskWatchlistChat({ watchlistId }: { watchlistId: string }) {
  const [open, setOpen] = useState(false);
    useEffect(() => {
    const handler = () => setOpen(true);
    document.addEventListener("open-ask-chat", handler);
    return () => document.removeEventListener("open-ask-chat", handler);
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

    async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text: input };
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await sendChatMessage(watchlistId, userMsg.text, history);
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", text: res.text, source: res.source }]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: `a-${Date.now()}`, role: "assistant", text: "Couldn't reach the assistant — try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 left-6 z-40 h-12 w-12 rounded-full bg-accent-gradient flex items-center justify-center shadow-glow"
      >
        {open ? <X size={18} /> : <MessageCircle size={18} />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 left-6 z-40 w-80 h-96 glass rounded-2xl flex flex-col overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-white/8">
              <p className="text-sm font-medium">Ask your watchlist</p>
              <p className="text-[11px] text-white/40">Answers only from your computed signals — never invented.</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <p className="text-xs text-white/30">
                  Try: "which of my stocks are acting weird today?" or "summary"
                </p>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                      m.role === "user" ? "bg-accent-gradient" : "bg-white/5 border border-white/10"
                    }`}
                  >
                    {m.text}
                    {m.source === "fallback" && (
                      <p className="text-[10px] text-white/30 mt-1">answered without AI phrasing</p>
                    )}
                  </div>
                </div>
              ))}
              {loading && <p className="text-xs text-white/30">Thinking…</p>}
              <div ref={bottomRef} />
            </div>

            <div className="p-3 border-t border-white/8 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask something…"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal/40"
              />
              <button
                onClick={handleSend}
                className="h-9 w-9 rounded-lg bg-accent-gradient flex items-center justify-center shrink-0"
              >
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}