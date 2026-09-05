import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, TrendingUp, ListPlus, Wallet, ArrowRight, LineChart, Sparkles, Zap, ShieldCheck, BellRing } from "lucide-react";
import { Dashboard } from "./pages/Dashboard";

const API_URL = import.meta.env.VITE_API_URL ?? "https://pulsewatch-5atg.onrender.com/api";
const DEMO_EMAIL = "demo@pulsewatch.dev";
const DEMO_PASSWORD = "demo1234";

// ---- cosmetic-only live ticker, self-contained, no relation to real auth state ----
const TICKER_SEED = [
  { symbol: "RELIANCE", price: 3257.45, change: 5.99 },
  { symbol: "TCS", price: 3961.5, change: -1.81 },
  { symbol: "INFY", price: 1791.21, change: 0.09 },
];

const MARQUEE_STOCKS = [
  { s: "RELIANCE", c: 5.99 }, { s: "TCS", c: -1.81 }, { s: "INFY", c: 0.09 },
  { s: "HDFCBANK", c: -3.62 }, { s: "ICICIBANK", c: 0.57 }, { s: "SBIN", c: 1.24 },
  { s: "TATAMOTORS", c: 2.41 }, { s: "WIPRO", c: -0.38 }, { s: "ADANIENT", c: 3.05 },
  { s: "BAJFINANCE", c: -0.92 },
];

function LiveTicker() {
  const [rows, setRows] = useState(TICKER_SEED);

  useEffect(() => {
    const id = setInterval(() => {
      setRows((prev) =>
        prev.map((r) => {
          const drift = (Math.random() - 0.5) * 2.2;
          return {
            ...r,
            price: +(r.price * (1 + drift / 100)).toFixed(2),
            change: +(r.change + drift * 0.3).toFixed(2),
          };
        })
      );
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {rows.map((r) => {
        const up = r.change >= 0;
        return (
          <div
            key={r.symbol}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md"
          >
            <span className="text-sm font-semibold tracking-wide text-white">{r.symbol}</span>
            <span className="text-sm text-white/70">
              ₹{r.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                up ? "bg-cyan-400/15 text-cyan-300" : "bg-rose-400/15 text-rose-300"
              }`}
            >
              {up ? "▲" : "▼"} {Math.abs(r.change).toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---- full-width scrolling market strip (fills the hero gap) ----
function MarketStrip() {
  const doubled = [...MARQUEE_STOCKS, ...MARQUEE_STOCKS];
  return (
    <div className="relative mt-14 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] py-3 backdrop-blur-md [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="pw-marquee flex w-max items-center gap-10 px-6">
        {doubled.map((r, i) => {
          const up = r.c >= 0;
          return (
            <span key={i} className="flex items-center gap-2 text-sm whitespace-nowrap">
              <span className="font-semibold text-white/85">{r.s}</span>
              <span className={`font-semibold ${up ? "text-cyan-300" : "text-rose-300"}`}>
                {up ? "▲" : "▼"} {Math.abs(r.c).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function HeroMockups() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* glow behind the cards */}
      <div className="absolute -inset-10 rounded-[3rem] bg-cyan-500/20 blur-3xl" />

      {/* back card — portfolio value + mini chart */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -4 }}
        animate={{ opacity: 1, y: 0, rotate: -4 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="pw-float relative rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#101726] to-[#0A0F18] p-6 shadow-2xl shadow-black/60"
        style={{ animationDuration: "7s" }}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-widest text-white/50">
            Portfolio value
          </p>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-300">
            <LineChart className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-3 text-4xl font-bold tracking-tight text-white">₹4,23,530</p>

        {/* mini bar chart */}
        <div className="mt-5 flex h-20 items-end gap-2">
          {[35, 55, 40, 70, 50, 85, 62, 95, 74, 100].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-md bg-gradient-to-t from-cyan-500/40 to-cyan-300"
              style={{ height: `${h}%`, opacity: 0.35 + (i / 10) * 0.65 }}
            />
          ))}
        </div>

        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-300">
          <TrendingUp className="h-3.5 w-3.5" /> +1.61% today
        </p>
      </motion.div>

      {/* front card — compact watchlist */}
      <motion.div
        initial={{ opacity: 0, y: 50, rotate: 3 }}
        animate={{ opacity: 1, y: 0, rotate: 3 }}
        transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
        className="pw-float absolute -bottom-16 -right-2 w-64 rounded-[1.75rem] border border-white/10 bg-[#0C1220]/90 p-5 shadow-2xl shadow-black/70 backdrop-blur-xl"
        style={{ animationDuration: "8.5s", animationDelay: "0.6s" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-widest text-white/50">Watchlist</p>
          <span className="relative flex h-2 w-2">
            <span className="absolute h-2 w-2 animate-ping rounded-full bg-cyan-400 opacity-60" />
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
          </span>
        </div>
        {[
          { s: "RELIANCE", c: 5.99, up: true },
          { s: "TCS", c: -1.81, up: false },
          { s: "INFY", c: 0.09, up: true },
        ].map((r) => (
          <div
            key={r.s}
            className="flex items-center justify-between border-b border-white/5 py-2.5 last:border-0"
          >
            <span className="text-sm font-medium text-white">{r.s}</span>
            <span className={`text-xs font-semibold ${r.up ? "text-cyan-300" : "text-rose-300"}`}>
              {r.up ? "▲" : "▼"} {Math.abs(r.c).toFixed(2)}%
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span className="pw-shimmer bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-400 bg-[length:200%_auto] bg-clip-text text-transparent">
      {children}
    </span>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-md transition-colors hover:border-cyan-400/40 hover:bg-white/[0.06]"
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/25 to-blue-500/10 text-cyan-300 ring-1 ring-cyan-400/30">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/60">{body}</p>
    </motion.div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("pw_token"));
  const [watchlistId, setWatchlistId] = useState(localStorage.getItem("pw_watchlist"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (token && !watchlistId) {
      fetch(`${API_URL}/watchlists`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((lists) => {
          if (lists[0]) {
            setWatchlistId(lists[0].id);
            localStorage.setItem("pw_watchlist", lists[0].id);
          }
        });
    }
  }, [token]);

  async function handleAuth(mode: "login" | "register") {
    setError("");
    const res = await fetch(`${API_URL}/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "something went wrong");
    localStorage.setItem("pw_token", data.token);
    localStorage.setItem("pw_email", email);
    setToken(data.token);
  }

  function fillDemoCredentials() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
  }

  if (!token) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[#05070C] text-white antialiased">
        <style>{`
          @keyframes pw-shimmer-move { 0% { background-position: 0% center; } 100% { background-position: 200% center; } }
          .pw-shimmer { animation: pw-shimmer-move 3.5s linear infinite; }
          @media (prefers-reduced-motion: reduce) { .pw-shimmer { animation: none; } }
          @keyframes pw-float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-14px) rotate(-1deg); } }
          .pw-float { animation-name: pw-float; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
          @media (prefers-reduced-motion: reduce) { .pw-float { animation: none; } }
          @keyframes pw-marquee-move { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .pw-marquee { animation: pw-marquee-move 28s linear infinite; }
          @media (prefers-reduced-motion: reduce) { .pw-marquee { animation: none; } }
        `}</style>

        {/* Ambient background */}
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -top-40 left-1/2 h-[32rem] w-[50rem] -translate-x-1/2 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[24rem] w-[24rem] rounded-full bg-cyan-400/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
        </div>

        {/* Nav */}
        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/25">
              <Activity className="h-5 w-5 text-[#05070C]" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight">PulseWatch</span>
          </div>
          <nav className="flex items-center gap-8">
            <a
              href="#features"
              className="hidden text-sm font-medium text-white/60 transition-colors hover:text-cyan-300 sm:block"
            >
              Features
            </a>
            <a
              href="#signin"
              className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-5 py-2 text-sm font-semibold text-cyan-300 transition-all hover:bg-cyan-400 hover:text-[#05070C]"
            >
              Sign in
            </a>
          </nav>
        </header>

        {/* Hero */}
        <section className="relative z-10 mx-auto max-w-6xl px-6 pt-10 pb-24">
          <div className="grid items-center gap-20 lg:grid-cols-2">
            {/* left: copy + sign-in card */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-300">
                <Sparkles className="h-3.5 w-3.5" />
                Live market tracking
              </div>

              <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
                Start your
                <br />
                <GradientText>investment journey</GradientText>
                <br />
                with clarity.
              </h1>

              <p className="mt-6 max-w-md  text-base leading-relaxed !text-blue-300">
                Build a watchlist, mark what you're holding, and see price swings the second they
                happen — no refreshing, no delayed feeds.
              </p>

              <div className="mt-8">
                <LiveTicker />
              </div>


              {/* Sign-in card */}
              <div
                id="signin"
                className="mt-10 max-w-md rounded-3xl border border-white/10 bg-white/[0.05] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
              >
                <h2 className="text-lg font-semibold">Sign in</h2>
                <p className="mt-1 text-sm text-white/50">
                  Pick up your watchlist where you left off.
                </p>

                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-5 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/35 outline-none transition-colors focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/35 outline-none transition-colors focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                />

                {error && (
                  <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                    {error}
                  </p>
                )}

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => handleAuth("login")}
                    className="flex-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 py-3 text-sm font-semibold text-[#05070C] shadow-lg shadow-cyan-500/25 transition-transform hover:scale-[1.02] hover:opacity-95 active:scale-[0.98]"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => handleAuth("register")}
                    className="flex-1 rounded-full border border-white/15 py-3 text-sm font-semibold transition-colors hover:bg-white/5"
                  >
                    Register
                  </button>
                </div>

                {/* demo credentials */}
                <div className="mt-5 rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-400/5 p-4">
                  <p className="text-xs text-white/60">
                    Demo credentials —{" "}
                    <button
                      onClick={fillDemoCredentials}
                      className="font-semibold text-cyan-300 underline decoration-cyan-400/40 underline-offset-2 hover:text-cyan-200"
                    >
                      click to autofill
                    </button>
                  </p>
                  <p className="mt-1.5 font-mono text-xs text-white/45">email: {DEMO_EMAIL}</p>
                  <p className="font-mono text-xs text-white/45">password: {DEMO_PASSWORD}</p>
                </div>
              </div>
            </div>

            {/* right: phone-mockup cards */}
            <div className="hidden pb-16 lg:block">
              <HeroMockups />
            </div>
          </div>

          {/* scrolling market strip fills the bottom of the hero */}
          <MarketStrip />
        </section>

        {/* Stats row */}
        <section className="relative z-10 border-y border-white/5 bg-white/[0.02]">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-10 sm:grid-cols-4">
            {[
              { v: "30+", l: "Symbols tracked" },
              { v: "2.2s", l: "Refresh interval" },
              { v: "₹0", l: "Cost to use" },
              { v: "24×7", l: "Market watch" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <p className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
                  {s.v}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-widest text-white/45">
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="relative z-10 bg-[#070A10]">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
              Why PulseWatch
            </p>
            <h2 className="mt-3 max-w-xl text-4xl font-bold tracking-tight">
              Built around three things you actually check
            </h2>
            <p className="mt-4 max-w-lg text-white/55">
              Not a trading terminal — just the parts of watching the market that matter day to day.
            </p>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <FeatureCard
                index={0}
                icon={<Activity className="h-5 w-5" />}
                title="Live price feed"
                body="Prices update as they move, with the day's change shown at a glance next to every symbol."
              />
              <FeatureCard
                index={1}
                icon={<ListPlus className="h-5 w-5" />}
                title="Custom watchlists"
                body="Add any symbol in seconds and organize the ones you're actively watching separately from the rest."
              />
              <FeatureCard
                index={2}
                icon={<Wallet className="h-5 w-5" />}
                title="Holdings, flagged"
                body="Mark what you actually own so it stands out from stocks you're just keeping an eye on."
              />
            </div>

            {/* How it works strip */}
            <div className="mt-16 grid gap-6 rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 sm:grid-cols-3 sm:p-10">
              {[
                { icon: <Zap className="h-5 w-5" />, step: "01", t: "Create your account", b: "Register in seconds — email and password is all it takes." },
                { icon: <ListPlus className="h-5 w-5" />, step: "02", t: "Add your symbols", b: "Search and pin the stocks you want to keep an eye on." },
                { icon: <BellRing className="h-5 w-5" />, step: "03", t: "Watch them move", b: "Live prices and day change update right in front of you." },
              ].map((s) => (
                <div key={s.step} className="relative">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/30">
                      {s.icon}
                    </span>
                    <span className="font-mono text-xs font-semibold text-white/30">{s.step}</span>
                  </div>
                  <h3 className="mt-4 font-semibold text-white">{s.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/55">{s.b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA band */}
        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-cyan-400/20 bg-gradient-to-br from-blue-950 via-[#0A0F18] to-[#0A0F18] p-12">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
            <h2 className="max-w-lg text-3xl font-bold tracking-tight sm:text-4xl">
              Set up your watchlist in under a minute.
            </h2>
            <p className="mt-3 max-w-md text-white/55">
              No card, no install — just an account and the symbols you care about.
            </p>
            <a
              href="#signin"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-7 py-3.5 text-sm font-semibold text-[#05070C] shadow-lg shadow-cyan-500/25 transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              Start tracking
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <p className="mt-10 text-center text-xs text-white/35">
            © {new Date().getFullYear()} PulseWatch — prices shown are simulated for demo purposes.
          </p>
        </section>
      </div>
    );
  }

  if (!watchlistId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05070C] text-white/60">
        <div className="flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-300" />
          Setting up your watchlist…
        </div>
      </div>
    );
  }

  return <Dashboard watchlistId={watchlistId} />;
}
