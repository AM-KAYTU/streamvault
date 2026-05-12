"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface CreditInfo {
  valid: boolean;
  minutesLeft: number;
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [showPinBar, setShowPinBar] = useState(false);
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("sv_pin");
    if (saved) fetchCredits(saved);
  }, []);

  async function fetchCredits(pin: string) {
    try {
      const res = await fetch(`/api/credits/check?pin=${pin}`);
      const data = await res.json();
      if (data.valid) {
        setCreditInfo({ valid: true, minutesLeft: data.minutesLeft });
      } else {
        setCreditInfo(null);
        if (data.exhausted) localStorage.removeItem("sv_pin");
      }
    } catch {
      setCreditInfo(null);
    }
  }

  async function handlePinSubmit() {
    const pin = pinInput.toUpperCase().replace(/-/g, "").trim();
    if (pin.length !== 6) { setPinError("PIN must be 6 characters"); return; }
    setPinError("");
    const res = await fetch(`/api/credits/check?pin=${pin}`);
    const data = await res.json();
    if (data.valid) {
      localStorage.setItem("sv_pin", pin);
      setCreditInfo({ valid: true, minutesLeft: data.minutesLeft });
      setShowPinBar(false);
      setPinInput("");
    } else {
      setPinError(data.exhausted ? "This PIN has no time remaining." : "PIN not found.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("sv_pin");
    setCreditInfo(null);
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.841z" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight">
                Stream<span className="text-gold">Vault</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Browse</Link>
              <Link href="/credits" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Buy Time</Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              {creditInfo ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-1.5 text-sm">
                    <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gold font-bold">{creditInfo.minutesLeft}</span>
                    <span className="text-gray-400">min left</span>
                  </div>
                  <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-red-400 transition-colors">Sign out</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPinBar(!showPinBar)}
                    className="btn-outline text-sm py-2 px-4"
                  >
                    Enter PIN
                  </button>
                  <Link href="/credits" className="btn-gold text-sm py-2 px-4">Buy Time</Link>
                </div>
              )}
            </div>

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* PIN entry bar */}
        {showPinBar && (
          <div className="border-t border-border bg-surface px-4 py-3">
            <div className="max-w-sm mx-auto flex gap-2">
              <input
                type="text"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
                placeholder="Enter your PIN (e.g. X7K-9PQ)"
                maxLength={7}
                className="input-field text-sm py-2 flex-1 font-mono tracking-widest"
                autoFocus
              />
              <button onClick={handlePinSubmit} className="btn-gold py-2 px-4 text-sm">Go</button>
            </div>
            {pinError && <p className="text-red-400 text-xs text-center mt-2">{pinError}</p>}
          </div>
        )}
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[65px] z-40 bg-surface border-b border-border px-4 py-4 space-y-3">
          <Link href="/" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white py-2">Browse Videos</Link>
          <Link href="/credits" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white py-2">Buy Watch Time</Link>
          {creditInfo && (
            <div className="flex items-center gap-2 py-2 text-sm">
              <span className="text-gold font-bold">{creditInfo.minutesLeft}</span>
              <span className="text-gray-400">minutes remaining</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
