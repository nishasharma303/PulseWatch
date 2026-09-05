import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAttention, fetchAway, simulateNextTick } from "../lib/api";
import { connectWs, onWsMessage, getDeviceId } from "../lib/ws";
import { TopNav } from "../components/TopNav";
import { StatCard } from "../components/StatCard";
import { PromoCard } from "../components/PromoCard";
import { PriceChart } from "../components/PriceChart";
import { WatchlistPanel } from "../components/WatchlistPanel";
import { ResilienceIndex } from "../components/ResilienceIndex";
import { PortfolioScoreDonut } from "../components/PortfolioScoreDonut";
import { StockDetailDrawer } from "../components/StockDetailDrawer";
import { WhileYouWereAway } from "../components/WhileYouWereAway";
import { AddStockForm } from "../components/AddStockForm";
import { EmptyState } from "../components/EmptyState";
import { AttentionCard } from "../components/AttentionCard";
import { ToastStack, ToastItem } from "../components/Toast";
import { AskWatchlistChat } from "../components/AskWatchlistChat";
import { UserWeightsProfile } from "../components/UserWeightsProfile";
import { CircuitBreakerPanel } from "../components/CircuitBreakerPanel";
import { SectorExposure } from "../components/SectorExposure";
import { ClusterAlerts } from "../components/ClusterAlerts";
import { SyncStatus } from "../components/SyncStatus";
import { ScaleMetricsPanel } from "../components/ScaleMetricsPanel";
import { TimelinePage } from "./TimelinePage";
import { DigestPage } from "./DigestPage";

const ATTENTION_THRESHOLD = 35;
type Page = "dashboard" | "timeline" | "digest";

export function Dashboard({ watchlistId }: { watchlistId: string }) {
  const [page, setPage] = useState<Page>("dashboard");
  const [selected, setSelected] = useState<string | null>(null);
  const [awayOpen, setAwayOpen] = useState(false);
  const [digest, setDigest] = useState<{ digest: string; symbolsWithActivity: string[] } | null>(null);
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const prevScores = useRef<Record<string, number>>({});

  const { data: cards = [], refetch } = useQuery({
    queryKey: ["attention", watchlistId],
    queryFn: () => fetchAttention(watchlistId),
  });

  useEffect(() => {
    connectWs();
    const unsub = onWsMessage((msg) => {
      if (msg.type === "snapshot-update") {
        refetch();
      }
      if (msg.type === "watchlist-changed" && msg.watchlistId === watchlistId && msg.deviceId !== getDeviceId()) {
        setToasts((t) => [
          ...t,
          {
            id: `sync-${Date.now()}`,
            title: msg.conflict ? "Edit conflict detected" : "Updated on another device",
            subtitle: `${msg.symbol} was changed elsewhere — synced.`,
            kind: msg.conflict ? "conflict" : "sync",
          },
        ]);
        refetch();
      }
    });
    return unsub;
  }, [watchlistId]);

  useEffect(() => {
    for (const c of cards) {
      const prev = prevScores.current[c.symbol];
      if (prev !== undefined && prev < 55 && c.attentionScore >= 55) {
        setToasts((t) => [
          ...t,
          {
            id: `${c.symbol}-${Date.now()}`,
            title: `${c.symbol} needs attention`,
            subtitle: `Attention score just hit ${c.attentionScore}`,
            kind: "alert",
          },
        ]);
      }
      prevScores.current[c.symbol] = c.attentionScore;
    }
  }, [cards]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => setToasts((t) => t.slice(1)), 6000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const filtered = search ? cards.filter((c) => c.symbol.toLowerCase().includes(search.toLowerCase())) : cards;
  const selectedCard = cards.find((c) => c.symbol === selected) ?? null;
  const needsAttention = filtered.filter((c) => c.attentionScore >= ATTENTION_THRESHOLD);
  const quiet = filtered.filter((c) => c.attentionScore < ATTENTION_THRESHOLD);
  const avgScore = cards.length ? cards.reduce((a, c) => a + c.attentionScore, 0) / cards.length : 0;
  const sparkline = cards.length ? cards.map((c) => c.attentionScore) : [0];
  const chartSymbol = selectedCard?.symbol ?? cards[0]?.symbol;

  async function openAway() {
    const res = await fetchAway(watchlistId);
    setDigest(res);
    setAwayOpen(true);
  }

  async function handleSimulate() {
    await simulateNextTick();
    refetch();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
            <TopNav
        alertCount={needsAttention.length}
        search={search}
        onSearchChange={setSearch}
        page={page}
        onNavigate={setPage}
        cards={cards}
      />
      <SyncStatus />

      {page === "timeline" && <TimelinePage watchlistId={watchlistId} cards={cards} />}
      {page === "digest" && <DigestPage watchlistId={watchlistId} />}

      {page === "dashboard" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-[1.4fr,1fr] gap-4 mb-4">
            <StatCard
              title="Average attention"
              value={avgScore.toFixed(0)}
              delta={`${needsAttention.length} need attention`}
              positive={avgScore < 40}
              sparkline={sparkline}
            />
            <PromoCard onOpen={openAway} hasDigest={!!digest} />
          </div>

          <ClusterAlerts watchlistId={watchlistId} />

          <div className="grid grid-cols-1 md:grid-cols-[1.4fr,1fr] gap-4 mb-4">
            {chartSymbol ? (
              <PriceChart symbol={chartSymbol} />
            ) : (
              <div className="glass rounded-2xl p-6 flex items-center justify-center text-white/30 text-sm">
                Add a stock to see its chart
              </div>
            )}
            <WatchlistPanel cards={filtered} onSelect={setSelected} selectedSymbol={selected} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <ResilienceIndex cards={cards} />
            <PortfolioScoreDonut cards={cards} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <SectorExposure watchlistId={watchlistId} />
            <UserWeightsProfile />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <CircuitBreakerPanel />
            <ScaleMetricsPanel />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <AddStockForm watchlistId={watchlistId} onAdded={refetch} />
            <button
              onClick={handleSimulate}
              className="rounded-xl px-4 py-2 text-sm bg-accent-gradient hover:opacity-90 transition-opacity"
            >
              Simulate next tick
            </button>
          </div>

          {needsAttention.length === 0 && cards.length > 0 ? (
            <EmptyState count={cards.length} />
          ) : (
            <div className="space-y-4">
              {needsAttention
                .sort((a, b) => b.attentionScore - a.attentionScore)
                .map((card, i) => (
                  <AttentionCard
                    key={card.symbol}
                    card={card}
                    watchlistId={watchlistId}
                    index={i}
                    onConflict={(title, subtitle) =>
                      setToasts((t) => [...t, { id: `conflict-${Date.now()}`, title, subtitle, kind: "conflict" }])
                    }
                  />
                ))}
            </div>
          )}

          {quiet.length > 0 && (
            <div className="mt-6 space-y-3 opacity-70">
              <p className="text-xs uppercase tracking-wide text-white/30">{quiet.length} quiet</p>
              {quiet.map((card, i) => (
                <AttentionCard
                  key={card.symbol}
                  card={card}
                  watchlistId={watchlistId}
                  index={i}
                  onConflict={(title, subtitle) =>
                    setToasts((t) => [...t, { id: `conflict-${Date.now()}`, title, subtitle, kind: "conflict" }])
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      <StockDetailDrawer card={selectedCard} watchlistId={watchlistId} onClose={() => setSelected(null)} />
      <WhileYouWereAway
        open={awayOpen}
        onClose={() => setAwayOpen(false)}
        digest={digest?.digest ?? ""}
        symbolsWithActivity={digest?.symbolsWithActivity ?? []}
      />
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
      <AskWatchlistChat watchlistId={watchlistId} />
    </div>
  );
}