import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { fetchDigestHistory } from "../lib/api";

interface DigestLogEntry {
  id: string;
  digest: string;
  symbols: string[];
  createdAt: string;
}

export function DigestPage({ watchlistId }: { watchlistId: string }) {
  const { data: logs = [] } = useQuery<DigestLogEntry[]>({
    queryKey: ["digest-history", watchlistId],
    queryFn: () => fetchDigestHistory(watchlistId),
  });

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="font-display text-lg font-semibold mb-1">Digest history</h2>
      <p className="text-white/40 text-sm mb-6">
        Every "while you were away" briefing you've ever seen, in order — not a popup that vanishes when you close it.
      </p>

      {logs.length === 0 ? (
        <p className="text-white/40 text-sm">
          No digests recorded yet. Open "While away" from the dashboard after some activity happens.
        </p>
      ) : (
        <div className="space-y-4">
          {logs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl bg-white/5 border border-white/8 p-4"
            >
              <p className="text-sm text-white/80 leading-relaxed">{log.digest}</p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex flex-wrap gap-1.5">
                  {log.symbols.map((s) => (
                    <span key={s} className="text-[10px] bg-white/8 rounded-full px-2 py-0.5 text-white/50">
                      {s}
                    </span>
                  ))}
                </div>
                <span className="text-[11px] text-white/30 shrink-0 ml-3">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}