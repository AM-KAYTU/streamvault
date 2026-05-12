"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Analytics {
  totals: {
    videos: number; totalPurchases: number; activePurchases: number;
    exhaustedPurchases: number; totalRevenue: number; totalWatchMinutes: number;
  };
  topVideos: Array<{ id: string; title: string; views: number; _count: { watchEvents: number } }>;
  recentPurchases: Array<{ id: string; pin: string; createdAt: string; pack: { name: string; price: number } }>;
}

function Stat({ label, value, sub, color = "text-white" }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <p className="text-muted text-sm font-medium mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const symbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "₵";

  useEffect(() => {
    fetch("/api/admin/analytics").then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-surface border border-border rounded-2xl shimmer" />)}
    </div>
  );

  if (!data) return <p className="text-muted">Failed to load analytics.</p>;
  const { totals, topVideos, recentPurchases } = data;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted text-sm mt-0.5">StreamVault at a glance</p>
        </div>
        <span className="text-xs text-gray-600 bg-surface-high border border-border rounded-lg px-3 py-1.5">
          {new Date().toLocaleDateString("en-US", { dateStyle: "long" })}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Stat label="Total Revenue" value={`${symbol}${totals.totalRevenue.toLocaleString()}`} color="text-gold" />
        <Stat label="Active PINs" value={totals.activePurchases} sub="Time remaining" color="text-green-400" />
        <Stat label="Total Sales" value={totals.totalPurchases} sub="All time purchases" />
        <Stat label="Watch Time Served" value={`${totals.totalWatchMinutes.toLocaleString()} min`} sub={`${totals.exhaustedPurchases} exhausted PINs`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-bold flex items-center gap-2 mb-5">
            <span className="w-1 h-5 bg-gold rounded-full" />Recent Sales
          </h2>
          {recentPurchases.length === 0 ? <p className="text-muted text-sm">No sales yet.</p> : (
            <div className="space-y-3">
              {recentPurchases.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-mono font-medium text-gold tracking-wider">
                      {p.pin.slice(0, 3)}-{p.pin.slice(3)}
                    </p>
                    <p className="text-xs text-muted">{p.pack.name} · {new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="text-gold text-sm font-bold">{symbol}{p.pack.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-bold flex items-center gap-2 mb-5">
            <span className="w-1 h-5 bg-gold rounded-full" />Top Videos
          </h2>
          {topVideos.length === 0 ? <p className="text-muted text-sm">No videos yet.</p> : (
            <div className="space-y-3">
              {topVideos.map((v, i) => (
                <div key={v.id} className="flex items-center gap-4 py-2 border-b border-border last:border-0">
                  <span className="text-2xl font-bold text-gray-700 w-6 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <Link href={`/video/${v.id}`} target="_blank" className="text-sm font-medium text-white hover:text-gold transition-colors truncate block">
                      {v.title}
                    </Link>
                    <p className="text-xs text-muted">{v._count.watchEvents} watch events</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gold">{v.views.toLocaleString()}</p>
                    <p className="text-xs text-gray-600">views</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
