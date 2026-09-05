const COLORS = ["#22D3EE", "#3B82F6", "#F59E0B", "#F43F5E", "#0EA5E9", "#10B981"];

function colorFor(symbol: string) {
  let h = 0;
  for (let i = 0; i < symbol.length; i++) h = (h * 31 + symbol.charCodeAt(i)) | 0;
  return COLORS[Math.abs(h) % COLORS.length];
}

export function StockAvatar({ symbol, size = 36 }: { symbol: string; size?: number }) {
  const color = colorFor(symbol);
  return (
    <div
      className="rounded-full flex items-center justify-center font-display font-bold text-white shrink-0 ring-1 ring-white/10"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color}, ${color}99)`,
        fontSize: size * 0.42,
        boxShadow: `0 0 ${size * 0.6}px -${size * 0.25}px ${color}`,
      }}
    >
      {symbol.slice(0, 1)}
    </div>
  );
}