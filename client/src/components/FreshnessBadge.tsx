function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

export function FreshnessBadge({ updatedAt, stale }: { updatedAt: string; stale: boolean }) {
  if (stale) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/10 px-2.5 py-1 text-xs text-amber border border-amber/20">
        <span className="h-1.5 w-1.5 rounded-full bg-amber" />
        delayed &middot; {timeAgo(updatedAt)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-2.5 py-1 text-xs text-teal border border-teal/20">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal" />
      </span>
      live &middot; {timeAgo(updatedAt)}
    </span>
  );
}
