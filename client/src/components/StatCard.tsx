import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export function StatCard({
  title,
  value,
  delta,
  positive,
  sparkline,
}: {
  title: string;
  value: string;
  delta: string;
  positive: boolean;
  sparkline: number[];
}) {
  const data = sparkline.map((v, i) => ({ i, v }));
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-3xl p-6 flex items-center justify-between"
    >
      <div>
        <p className="flex items-center gap-1.5 text-white/40 text-xs font-semibold uppercase tracking-wide mb-3">
          <Activity size={13} />
          {title}
        </p>
        <p className="font-display text-4xl font-bold font-tnum tracking-tight">{value}</p>
        <span
          className={`inline-block mt-3 text-xs font-medium px-2.5 py-1 rounded-full ${
            positive ? "bg-teal/10 text-teal" : "bg-rose/10 text-rose"
          }`}
        >
          {delta}
        </span>
      </div>
      <div className="w-28 h-16">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={positive ? "#22D3EE" : "#F43F5E"} stopOpacity={0.5} />
                <stop offset="100%" stopColor={positive ? "#22D3EE" : "#F43F5E"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={positive ? "#22D3EE" : "#F43F5E"}
              strokeWidth={2.5}
              fill="url(#sparkGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}