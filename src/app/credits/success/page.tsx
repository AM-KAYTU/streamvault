"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatPin } from "@/lib/pin";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const pin = params.get("pin") || "";
  const [copied, setCopied] = useState(false);
  const [timeInfo, setTimeInfo] = useState<{
    minutesLeft: number; minutesTotal: number; packName: string
  } | null>(null);

  useEffect(() => {
    if (!pin) return;
    localStorage.setItem("sv_pin", pin);
    fetch(`/api/credits/check?pin=${pin}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valid || d.minutesTotal) {
          setTimeInfo({ minutesLeft: d.minutesLeft, minutesTotal: d.minutesTotal, packName: d.packName });
        }
      });
  }, [pin]);

  function copyPin() {
    navigator.clipboard.writeText(formatPin(pin));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!pin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Invalid page. <Link href="/credits" className="text-gold">Buy time</Link></p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Success icon */}
        <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
        <p className="text-muted mb-8">Your watch time is active. Here is your PIN.</p>

        {/* PIN display */}
        <div className="bg-surface border-2 border-gold/40 rounded-2xl p-8 mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Your Access PIN</p>
          <div className="text-5xl font-bold tracking-[0.3em] text-gold font-mono mb-4">
            {formatPin(pin)}
          </div>
          <button
            onClick={copyPin}
            className={`flex items-center gap-2 mx-auto text-sm px-4 py-2 rounded-lg border transition-all ${
              copied
                ? "border-green-500/40 text-green-400 bg-green-500/10"
                : "border-border text-gray-400 hover:text-white hover:border-gold/40"
            }`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy PIN
              </>
            )}
          </button>
        </div>

        {/* Time info */}
        {timeInfo && (
          <div className="bg-surface border border-border rounded-xl p-4 mb-6 flex justify-around text-sm">
            <div className="text-center">
              <p className="text-gold font-bold text-2xl">{timeInfo.minutesLeft}</p>
              <p className="text-muted">Minutes Left</p>
            </div>
            <div className="w-px bg-border" />
            <div className="text-center">
              <p className="text-white font-bold text-2xl">{timeInfo.minutesTotal}</p>
              <p className="text-muted">Total Minutes</p>
            </div>
            <div className="w-px bg-border" />
            <div className="text-center">
              <p className="text-white font-bold text-sm pt-1">{timeInfo.packName}</p>
              <p className="text-muted">Pack</p>
            </div>
          </div>
        )}

        {/* Warning */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-8 flex items-start gap-3 text-left">
          <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-gray-400">
            <span className="text-amber-400 font-semibold">Save your PIN now.</span>{" "}
            It has been saved in this browser automatically, but write it down or screenshot this page — you&apos;ll need it on other devices.
          </p>
        </div>

        <Link href="/" className="btn-gold w-full py-4 flex items-center justify-center gap-2 text-base">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.841z" />
          </svg>
          Start Watching
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
