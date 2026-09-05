import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { fetchHistory, fetchNiftyHistory } from "../lib/api";

const RANGES = ["1D", "1W", "1M", "1Y"];

export function PriceChart({ symbol }: { symbol: string }) {
  const [range, setRange] = useState("1M");
  const [showNifty, setShowNifty] = useState(true);

  const { data: stock = [], isLoading } = useQuery({
    queryKey: ["history", symbol, range],
    queryFn: () => fetchHistory(symbol, range),
  });
  const { data: nifty = [] } = useQuery({
    queryKey: ["history-nifty", range],
    queryFn: () => fetchNiftyHistory(range),
    enabled: showNifty,
  });

  // Normalize both series to % change from their first point so they're comparable on one axis.
  const merged = stock.map((bar, i) => {
    const base = stock[0]?.close ?? bar.close;
    const niftyBase = nifty[0]?.close ?? nifty[i]?.close ?? 1;
    return {
      date: bar.date,
      stockPct: ((bar.close - base) / base) * 100,
      niftyPct: nifty[i] ? ((nifty[i].close - niftyBase) / niftyBase) * 100 : null,
      price: bar.close,
    };
  });

  const up = stock.length > 1 && stock[stock.length - 1].close >= stock[0].close;
  const color = up ? "#22D3EE" : "#F43F5E";

  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="font-display text-xl font-bold tracking-tight">{symbol}</h3>
          {stock.length > 0 && (
            <p className={`text-sm mt-1 font-tnum font-medium ${up ? "text-teal" : "text-rose"}`}>
              ₹{stock[stock.length - 1].close.toFixed(2)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowNifty((v) => !v)}
            className={`text-xs font-medium px-3.5 py-2 rounded-full border transition-colors ${
              showNifty ? "border-violet/40 text-violet bg-violet/10" : "border-white/10 text-white/40"
            }`}
          >
            NIFTY overlay
          </button>
          <div className="flex gap-1 bg-white/[0.04] rounded-full p-1">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all ${
                  range === r
                    ? "bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-64">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-white/30 text-sm">Loading chart…</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={merged} key={range}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: "#12161F",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 14,
                  fontSize: 12,
                }}
                labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                formatter={(v: number, name: string) => [`${v.toFixed(2)}%`, name === "stockPct" ? symbol : "NIFTY"]}
              />
              <Area
                type="monotone"
                dataKey="stockPct"
                stroke={color}
                strokeWidth={3}
                fill="url(#priceGrad)"
                animationDuration={800}
              />
              {showNifty && (
                <Line
                  type="monotone"
                  dataKey="niftyPct"
                  stroke="#3B82F6"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                  animationDuration={800}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className="text-[11px] text-white/30 mt-3 leading-relaxed">
        Lines show % change from range start, so {symbol} and NIFTY are directly comparable — this is the same
        market-divergence signal the Attention Engine scores on.
      </p>
    </div>
  );
}