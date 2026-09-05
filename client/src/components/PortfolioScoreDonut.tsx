import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { AttentionCard as AttentionCardType } from "../lib/api";

export function PortfolioScoreDonut({ cards }: { cards: AttentionCardType[] }) {
  const high = cards.filter((c) => c.attentionScore >= 70).length;
  const moderate = cards.filter((c) => c.attentionScore >= 40 && c.attentionScore < 70).length;
  const quiet = cards.filter((c) => c.attentionScore < 40).length;

  const data = [
    { name: "High", value: high, color: "#F43F5E" },
    { name: "Moderate", value: moderate, color: "#F59E0B" },
    { name: "Quiet", value: quiet, color: "#2DD4BF" },
  ].filter((d) => d.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="glass rounded-2xl p-5 flex items-center gap-4"
    >
      <div className="w-20 h-20 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={26} outerRadius={38} paddingAngle={3} animationDuration={800}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div>
        <p className="text-white/50 text-sm mb-1">Portfolio score</p>
        <div className="space-y-0.5 text-xs">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: d.color }} />
              <span className="text-white/60">
                {d.name}: {d.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}