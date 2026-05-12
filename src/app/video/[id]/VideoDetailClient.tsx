"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import VideoCard from "@/components/VideoCard";
import { formatDuration } from "@/lib/format";

interface Video {
  id: string; title: string; description: string; thumbnail: string;
  category: string | null; duration: number | null;
  views: number; featured: boolean; createdAt: Date;
}

interface TimeState {
  loaded: boolean; pin: string; minutesLeft: number; valid: boolean;
}

export default function VideoDetailClient({ video, related }: { video: Video; related: Video[] }) {
  const router = useRouter();
  const [time, setTime] = useState<TimeState>({ loaded: false, pin: "", minutesLeft: 0, valid: false });
  const [pinInput, setPinInput] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const pin = localStorage.getItem("sv_pin");
    if (!pin) { setTime((t) => ({ ...t, loaded: true })); return; }
    fetch(`/api/credits/check?pin=${pin}`)
      .then((r) => r.json())
      .then((d) => {
        setTime({ loaded: true, pin, minutesLeft: d.minutesLeft || 0, valid: !!d.valid });
      });
  }, []);

  function handleWatch(pin: string) {
    router.push(`/watch/${video.id}?pin=${pin}`);
  }

  async function handlePinSubmit() {
    const pin = pinInput.toUpperCase().replace(/-/g, "").trim();
    if (pin.length !== 6) { setError("PIN must be 6 characters"); return; }
    setError("");
    const res = await fetch(`/api/credits/check?pin=${pin}`);
    const data = await res.json();
    if (!data.valid) {
      setError(data.exhausted ? "PIN has no time remaining" : "PIN not found");
      return;
    }
    localStorage.setItem("sv_pin", pin);
    setTime({ loaded: true, pin, minutesLeft: data.minutesLeft, valid: true });
    setShowPinModal(false);
    handleWatch(pin);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          {/* Thumbnail */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-surface mb-6 group cursor-pointer"
            onClick={() => { if (time.valid) handleWatch(time.pin); }}>
            <Image src={video.thumbnail} alt={video.title} fill
              className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized priority />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-20 h-20 bg-gold/90 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-black ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.841z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Info */}
          {video.category && <span className="text-gold text-sm font-medium uppercase tracking-wide">{video.category}</span>}
          <h1 className="text-3xl font-bold mt-1 mb-3">{video.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted mb-6">
            <span>{video.views.toLocaleString()} views</span>
            {video.duration && <span>{formatDuration(video.duration)}</span>}
            <span>{new Date(video.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</span>
          </div>
          <p className="text-gray-300 leading-relaxed mb-8">{video.description}</p>

          {/* Access panel */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            {!time.loaded ? (
              <div className="h-16 shimmer rounded-xl" />
            ) : time.valid ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-white">Ready to watch</p>
                  <p className="text-sm text-muted">
                    You have <span className="text-gold font-bold">{time.minutesLeft}</span> minutes remaining
                  </p>
                </div>
                <button
                  onClick={() => handleWatch(time.pin)}
                  className="btn-gold py-3 px-8 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.841z" />
                  </svg>
                  Watch Now
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-white">Watch time required</p>
                  <p className="text-sm text-muted">Have a PIN? Enter it to start watching.</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button onClick={() => setShowPinModal(true)} className="btn-outline py-3 px-5 flex-1 sm:flex-none">
                    Enter PIN
                  </button>
                  <a href="/credits" className="btn-gold py-3 px-5 text-center flex-1 sm:flex-none">Buy Time</a>
                </div>
              </div>
            )}
            {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
            <span className="w-1 h-5 bg-gold rounded-full inline-block" />More Videos
          </h3>
          <div className="space-y-4">
            {related.map((v) => <VideoCard key={v.id} {...v} />)}
          </div>
        </div>
      </div>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPinModal(false)} />
          <div className="relative bg-surface border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <button onClick={() => setShowPinModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold mb-1">Enter Your PIN</h2>
            <p className="text-muted text-sm mb-5">Use the PIN from your watch time purchase</p>
            <input
              type="text"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
              placeholder="e.g. X7K-9PQ"
              maxLength={7}
              className="input-field font-mono tracking-widest text-center text-xl mb-4"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <button onClick={handlePinSubmit} className="btn-gold w-full py-3">
              Use PIN & Watch
            </button>
            <a href="/credits" className="block text-center text-sm text-gold hover:text-gold-light mt-3 transition-colors">
              Don&apos;t have a PIN? Buy watch time →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
