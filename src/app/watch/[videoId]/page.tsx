"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import Link from "next/link";
import { Suspense } from "react";

interface VideoInfo {
  id: string; title: string; description: string;
  category: string | null; duration: number | null; views: number;
}

function WatchContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoId = params.videoId as string;

  const [pin, setPin] = useState("");
  const [video, setVideo] = useState<VideoInfo | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const urlPin = searchParams.get("pin");
    const savedPin = localStorage.getItem("sv_pin");
    const resolvedPin = urlPin || savedPin || "";

    if (!resolvedPin) {
      setStatus("error");
      setErrorMsg("No PIN found. Please enter your PIN.");
      return;
    }

    validateAndLoad(resolvedPin);
  }, [videoId]);

  async function validateAndLoad(p: string) {
    const res = await fetch(`/api/credits/check?pin=${p}`);
    const data = await res.json();

    if (!data.valid) {
      setStatus("error");
      setErrorMsg(data.exhausted ? "Your watch time has run out." : "Invalid PIN.");
      return;
    }

    const vRes = await fetch(`/api/videos/${videoId}`);
    if (!vRes.ok) { setStatus("error"); setErrorMsg("Video not found"); return; }
    const v = await vRes.json();
    setVideo(v);
    setPin(p);
    setStatus("ready");
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg className="w-10 h-10 text-gold animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted mb-6">{errorMsg}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.back()} className="btn-outline px-6 py-3">Go Back</button>
            <Link href="/credits" className="btn-gold px-6 py-3">Buy Watch Time</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!video) return null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Video — full width on mobile, no padding, edge-to-edge */}
      <div className="w-full bg-black">
        <div className="w-full max-w-6xl mx-auto">
          <VideoPlayer videoId={video.id} pin={pin} title={video.title} />
        </div>
      </div>

      {/* Info below */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted mb-4 flex-wrap">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href={`/video/${video.id}`} className="hover:text-white transition-colors truncate max-w-[180px]">
            {video.title}
          </Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gold">Watching</span>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              {video.category && (
                <span className="text-gold text-xs font-medium uppercase tracking-wide">{video.category}</span>
              )}
              <h1 className="text-xl sm:text-2xl font-bold mt-1 mb-1 leading-snug">{video.title}</h1>
              <p className="text-sm text-muted">{video.views.toLocaleString()} views</p>
            </div>
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 text-xs sm:text-sm px-3 py-1.5 rounded-lg shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              Active
            </div>
          </div>
          {video.description && (
            <p className="text-gray-300 mt-4 leading-relaxed text-sm sm:text-base">{video.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense>
      <WatchContent />
    </Suspense>
  );
}
