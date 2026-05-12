"use client";

import { useState } from "react";

interface Pack {
  id: string;
  name: string;
  minutes: number;
  price: number;
  popular: boolean;
}

export default function CreditsClient({ packs }: { packs: Pack[] }) {
  const [selected, setSelected] = useState<string>(
    packs.find((p) => p.popular)?.id || packs[0]?.id || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const symbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "₵";

  async function handleBuy() {
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      window.location.href = data.authorization_url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  if (packs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No Packs Available</h1>
          <p className="text-muted">Check back soon.</p>
        </div>
      </div>
    );
  }

  const selectedPack = packs.find((p) => p.id === selected);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 text-gold text-sm px-4 py-1.5 rounded-full mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Watch Time Packs
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          Buy Minutes,<br />
          <span className="text-gold">Watch Anything</span>
        </h1>
        <p className="text-muted text-lg max-w-xl mx-auto">
          Purchase a time pack and watch any video until your minutes run out.
          No accounts, no email — just your PIN.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Pack selection */}
        <div className="space-y-3">
          {packs.map((pack) => (
            <button
              key={pack.id}
              onClick={() => setSelected(pack.id)}
              className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 relative ${
                selected === pack.id
                  ? "border-gold bg-gold/5"
                  : "border-border bg-surface hover:border-gold/40"
              }`}
            >
              {pack.popular && (
                <div className="absolute -top-2.5 left-4 badge bg-gold text-black text-[10px] font-bold uppercase tracking-wide">
                  Most Popular
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-lg">{pack.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-gold text-sm font-semibold">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {pack.minutes} minutes
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gold">
                    {symbol}{pack.price.toLocaleString()}
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    selected === pack.id ? "border-gold bg-gold" : "border-gray-600"
                  }`}>
                    {selected === pack.id && (
                      <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}

          {/* How it works */}
          <div className="bg-surface-raised border border-border rounded-2xl p-5 mt-4">
            <p className="text-sm font-semibold text-white mb-3">How it works</p>
            <ul className="space-y-2 text-sm text-gray-400">
              {[
                "Choose a time pack and pay securely via Paystack",
                "Get a unique 6-character PIN instantly",
                "Save your PIN — use it on any device",
                "Watch any video; time deducts as you watch",
                "Buy another pack when yours runs out",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-gold/10 text-gold text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Checkout panel */}
        <div className="bg-surface border border-border rounded-2xl p-7 lg:sticky lg:top-24">
          <h2 className="text-xl font-bold mb-6">Order Summary</h2>

          {selectedPack && (
            <div className="bg-surface-high rounded-xl p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Pack</span>
                <span className="text-white font-medium">{selectedPack.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Watch time</span>
                <span className="text-gold font-bold">{selectedPack.minutes} minutes</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="font-semibold text-white">Total</span>
                <span className="text-gold font-bold text-lg">
                  {symbol}{selectedPack.price.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="bg-gold/5 border border-gold/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <svg className="w-5 h-5 text-gold shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <p className="text-sm text-gray-300">
              <span className="text-gold font-semibold">Your PIN is your access key.</span>{" "}
              No account or email needed. We&apos;ll show it to you right after payment — save it somewhere safe.
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleBuy}
            disabled={loading || !selected}
            className="btn-gold w-full py-4 flex items-center justify-center gap-2 text-base"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Redirecting to Paystack...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Pay with Paystack
              </>
            )}
          </button>
          <p className="text-center text-xs text-gray-600 mt-3">🔒 Secure · Anonymous · No account needed</p>
        </div>
      </div>
    </div>
  );
}
