"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Hls from "hls.js";

interface VideoPlayerProps {
  videoId: string;
  pin: string;
  title: string;
}

export default function VideoPlayer({ videoId, pin, title }: VideoPlayerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(true);
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const [exhausted, setExhausted] = useState(false);
  const [streamError, setStreamError] = useState("");
  const controlsTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastReportedTime = useRef(0);
  const touchTimer = useRef<ReturnType<typeof setTimeout>>();

  // Fetch signed HLS URL and initialise hls.js
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;

    async function initStream() {
      try {
        const res = await fetch(`/api/stream/${videoId}?pin=${encodeURIComponent(pin)}`);
        if (cancelled) return;
        if (!res.ok) { setStreamError("Unable to load video."); setBuffering(false); return; }
        const { streamUrl } = await res.json();

        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
          hlsRef.current = hls;
          hls.loadSource(streamUrl);
          hls.attachMedia(video!);
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) { setStreamError("Stream error."); setBuffering(false); }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          // Safari native HLS
          video.src = streamUrl;
        } else {
          setStreamError("Your browser doesn't support this video format.");
          setBuffering(false);
        }
      } catch {
        if (!cancelled) { setStreamError("Unable to load video."); setBuffering(false); }
      }
    }

    initStream();

    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [videoId, pin]);

  // Report watch progress every 15s
  const reportProgress = useCallback(async () => {
    if (!videoRef.current || videoRef.current.paused) return;
    const now = Math.floor(videoRef.current.currentTime);
    const delta = now - lastReportedTime.current;
    if (delta <= 0) return;
    lastReportedTime.current = now;
    try {
      const res = await fetch("/api/watch/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, pin, seconds: delta }),
      });
      const data = await res.json();
      if (data.ok) {
        setMinutesLeft(data.minutesLeft);
        if (data.exhausted) { setExhausted(true); videoRef.current?.pause(); }
      }
    } catch { /* keep playing silently on network error */ }
  }, [videoId, pin]);

  useEffect(() => {
    const interval = setInterval(reportProgress, 15000);
    return () => clearInterval(interval);
  }, [reportProgress]);

  // Fullscreen change listener
  useEffect(() => {
    function onFsChange() { setFullscreen(!!document.fullscreenElement); }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  function showControlsTemporarily() {
    setShowControls(true);
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false);
    }, 3000);
  }

  function togglePlay() {
    if (exhausted || !videoRef.current) return;
    videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
    showControlsTemporarily();
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    if (!videoRef.current) return;
    const t = parseFloat(e.target.value);
    videoRef.current.currentTime = t;
    setCurrentTime(t);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) { videoRef.current.volume = v; videoRef.current.muted = v === 0; }
    setMuted(v === 0);
  }

  function toggleMute() {
    if (!videoRef.current) return;
    const next = !muted;
    videoRef.current.muted = next;
    setMuted(next);
  }

  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen();
  }

  function skip(s: number) {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(Math.max(videoRef.current.currentTime + s, 0), duration);
    showControlsTemporarily();
  }

  function handleTap(e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
      touchTimer.current = undefined;
      skip(x < rect.width / 2 ? -10 : 10);
    } else {
      touchTimer.current = setTimeout(() => {
        touchTimer.current = undefined;
        togglePlay();
      }, 250);
    }
  }

  function fmt(s: number) {
    if (!s || isNaN(s)) return "0:00";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (streamError) {
    return (
      <div className="w-full bg-black rounded-xl overflow-hidden flex items-center justify-center" style={{ aspectRatio: "16/9" }}>
        <div className="text-center px-6">
          <p className="text-red-400 mb-4">{streamError}</p>
          <button onClick={() => router.back()} className="btn-outline px-6 py-2">Go Back</button>
        </div>
      </div>
    );
  }

  if (exhausted) {
    return (
      <div className="w-full bg-black rounded-xl overflow-hidden flex items-center justify-center" style={{ aspectRatio: "16/9" }}>
        <div className="text-center px-6">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-white font-bold text-xl mb-2">Watch Time Exhausted</h3>
          <p className="text-gray-400 text-sm mb-6">Your minutes have run out.</p>
          <button onClick={() => router.push("/credits")} className="btn-gold px-8 py-3">Buy More Time</button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full bg-black overflow-hidden select-none relative group"
      style={{ aspectRatio: "16/9" }}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => { if (playing) setShowControls(false); }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
        onLoadedMetadata={() => { setDuration(videoRef.current?.duration || 0); setBuffering(false); }}
        onPlay={() => { setPlaying(true); showControlsTemporarily(); }}
        onPause={() => { setPlaying(false); setShowControls(true); }}
        onWaiting={() => setBuffering(true)}
        onCanPlay={() => setBuffering(false)}
        onProgress={() => setBuffering(false)}
        playsInline
        preload="auto"
      />

      {/* Buffering spinner */}
      {buffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg className="w-14 h-14 text-gold animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {/* Click/tap overlay */}
      <div className="absolute inset-0 cursor-pointer" onClick={handleTap} />

      {/* Centre play button */}
      {!playing && !buffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 bg-gold/90 rounded-full flex items-center justify-center shadow-2xl">
            <svg className="w-8 h-8 text-black ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.841z" />
            </svg>
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${showControls || !playing ? "opacity-100" : "opacity-0"}`}
        style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.85))", paddingTop: 48 }}
      >
        {/* Title + time left */}
        <div className="flex items-center justify-between px-3 sm:px-4 mb-1">
          <p className="text-white text-xs sm:text-sm font-medium truncate flex-1 mr-4">{title}</p>
          {minutesLeft !== null && (
            <span className="text-gold text-xs font-semibold shrink-0 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {minutesLeft}m left
            </span>
          )}
        </div>

        {/* Seek bar */}
        <div className="px-3 sm:px-4 mb-2" onClick={(e) => e.stopPropagation()}>
          <div className="relative h-1 group/seek">
            <div className="absolute inset-0 bg-white/20 rounded-full" />
            <div className="absolute inset-y-0 left-0 bg-gold rounded-full" style={{ width: `${progress}%` }} />
            <input
              type="range" min={0} max={duration || 0} step={0.1} value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
            />
          </div>
        </div>

        {/* Buttons row */}
        <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 pb-3" onClick={(e) => e.stopPropagation()}>
          <button onClick={togglePlay} className="text-white hover:text-gold transition-colors p-1">
            {playing
              ? <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z" /></svg>
              : <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.841z" /></svg>
            }
          </button>

          <button onClick={() => skip(-10)} className="text-white hover:text-gold transition-colors p-1">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
            </svg>
          </button>

          <button onClick={() => skip(10)} className="text-white hover:text-gold transition-colors p-1">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
            </svg>
          </button>

          <span className="text-gray-300 text-xs tabular-nums ml-1">{fmt(currentTime)} / {fmt(duration)}</span>

          <div className="flex-1" />

          <div className="hidden sm:flex items-center gap-1">
            <button onClick={toggleMute} className="text-white hover:text-gold transition-colors p-1">
              {muted || volume === 0
                ? <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                : <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536A5 5 0 008 12a5 5 0 00.464 2.536M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
              }
            </button>
            <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 appearance-none bg-white/20 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold"
            />
          </div>

          <button onClick={toggleFullscreen} className="text-white hover:text-gold transition-colors p-1 ml-1">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={fullscreen
                ? "M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                : "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
              } />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
