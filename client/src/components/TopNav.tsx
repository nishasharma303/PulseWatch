import { Search, MessageCircle, Zap } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { AccountMenu } from "./AccountMenu";
import { AttentionCard } from "../lib/api";

type Page = "dashboard" | "timeline" | "digest";

export function TopNav({
  alertCount,
  search,
  onSearchChange,
  page,
  onNavigate,
  cards,
}: {
  alertCount: number;
  search: string;
  onSearchChange: (v: string) => void;
  page: Page;
  onNavigate: (p: Page) => void;
  cards: AttentionCard[];
}) {
  const items: { id: Page; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "timeline", label: "Timeline" },
    { id: "digest", label: "Digest" },
  ];

  const email = localStorage.getItem("pw_email") ?? "you@pulsewatch.dev";

  return (
    <div className="glass rounded-3xl px-5 sm:px-7 py-4 flex items-center justify-between mb-6">
      <div className="flex items-center gap-3 sm:gap-10">
        <span className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight">
          <span className="h-8 w-8 rounded-xl bg-accent-gradient flex items-center justify-center shadow-glow-sm shrink-0">
            <Zap size={16} className="text-white" fill="currentColor" strokeWidth={0} />
          </span>
          <span className="bg-accent-gradient bg-clip-text text-transparent">PulseWatch</span>
        </span>
        <nav className="hidden md:flex items-center gap-1 text-sm bg-white/[0.03] border border-white/5 rounded-full p-1">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => onNavigate(it.id)}
              className={`px-4 py-1.5 rounded-full font-medium transition-all ${
                page === it.id
                  ? "bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                  : "text-white/45 hover:text-white/80"
              }`}
            >
              {it.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-full px-4 py-2.5 w-60 focus-within:border-teal/50 focus-within:shadow-glow-teal transition-all">
          <Search size={15} className="text-white/35" />
          <input
            placeholder="Search symbol…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent outline-none text-sm placeholder:text-white/30 w-full font-tnum"
          />
        </div>

        <NotificationBell cards={cards} />

        <button
          onClick={() => document.dispatchEvent(new CustomEvent("open-ask-chat"))}
          className="h-10 w-10 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all"
        >
          <MessageCircle size={16} />
        </button>

        <AccountMenu email={email} />
      </div>
    </div>
  );
}