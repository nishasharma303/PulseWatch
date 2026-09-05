import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { fetchTrend } from "../lib/api";

export function AttentionTrendSparkline({ symbol }: { symbol: string }) {
  const { data } = useQuery({
    queryKey: ["trend", symbol],
    queryFn: () => fetchTrend(symbol),
  });

  if (!data || data.series.length < 2) return null;

  const color = data.direction === "rising" ? "#F43F5E" : data.direction === "falling" ? "#2DD4BF" : "#64748B";
  const arrow = data.direction === "rising" ? "↗" : data.direction === "falling" ? "↘" : "→";

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.series}>
            <Line type="monotone" dataKey="score" stroke={color} strokeWidth={1.75} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <span className="text-xs" style={{ color }}>
        {arrow} {data.direction}
      </span>
    </div>
  );
}