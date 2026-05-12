"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { formatDuration } from "@/lib/format";

interface Video {
  id: string; title: string; description: string; thumbnail: string;
  cfVideoId: string | null; category: string | null;
  duration: number | null; featured: boolean; published: boolean; views: number;
  createdAt: string; _count?: { watchEvents: number };
}

interface FormState {
  title: string; description: string; thumbnail: string; cfVideoId: string;
  category: string; duration: string; featured: boolean; published: boolean;
}

const EMPTY: FormState = {
  title: "", description: "", thumbnail: "", cfVideoId: "",
  category: "", duration: "", featured: false, published: true,
};

function Field({ label, value, onChange, placeholder, textarea, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; textarea?: boolean; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      {textarea
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className="input-field resize-none" />
        : <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input-field" />
      }
    </div>
  );
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const r = await fetch("/api/admin/videos");
    if (r.ok) setVideos(await r.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null); setForm(EMPTY); setError("");
    setUploadState("idle"); setUploadProgress(0); setShowForm(true);
  }
  function openEdit(v: Video) {
    setEditing(v);
    setForm({
      title: v.title, description: v.description, thumbnail: v.thumbnail,
      cfVideoId: v.cfVideoId || "",
      category: v.category || "", duration: v.duration ? String(v.duration) : "",
      featured: v.featured, published: v.published,
    });
    setUploadState(v.cfVideoId ? "done" : "idle");
    setUploadProgress(v.cfVideoId ? 100 : 0);
    setError(""); setShowForm(true);
  }

  async function handleFileSelect(file: File) {
    setUploadState("uploading");
    setUploadProgress(0);
    setError("");

    try {
      // Get one-time CF upload URL from our server
      const res = await fetch("/api/admin/cf-upload", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create upload slot");
      const { uid, uploadUrl } = await res.json();

      // Upload file directly to Cloudflare using XHR for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", uploadUrl);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        const fd = new FormData();
        fd.append("file", file);
        xhr.send(fd);
      });

      setForm((f) => ({ ...f, cfVideoId: uid }));
      setUploadState("done");
      setUploadProgress(100);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setUploadState("idle");
      setUploadProgress(0);
    }
  }

  async function handleSave() {
    if (!form.title || !form.cfVideoId || !form.thumbnail) {
      setError("Title, video file, and thumbnail are required.");
      return;
    }
    setSaving(true); setError("");
    const payload = {
      ...form,
      duration: form.duration ? Number(form.duration) : null,
      ...(editing ? { id: editing.id } : {}),
    };
    const r = await fetch("/api/admin/videos", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.ok) { await load(); setShowForm(false); }
    else { const d = await r.json(); setError(d.error || "Failed"); }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this video?")) return;
    setDeleting(id);
    await fetch(`/api/admin/videos?id=${id}`, { method: "DELETE" });
    await load(); setDeleting(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Videos</h1>
          <p className="text-muted text-sm mt-0.5">Manage your content library</p>
        </div>
        <button onClick={openNew} className="btn-gold flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Video
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-surface border border-border rounded-xl shimmer" />)}</div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-border rounded-2xl">
          <p className="text-muted">No videos yet. Add your first video above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((v) => (
            <div key={v.id} className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4">
              <div className="relative w-24 h-14 rounded-lg overflow-hidden shrink-0 bg-surface-high">
                <Image src={v.thumbnail} alt={v.title} fill className="object-cover" unoptimized />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-white truncate">{v.title}</h3>
                  {v.featured && <span className="badge bg-gold/10 text-gold border border-gold/20 text-[10px]">Featured</span>}
                  {!v.published && <span className="badge bg-gray-500/10 text-gray-400 border border-gray-600 text-[10px]">Draft</span>}
                  {!v.cfVideoId && <span className="badge bg-red-500/10 text-red-400 border border-red-800/40 text-[10px]">No CF Video</span>}
                </div>
                <div className="flex gap-4 text-xs text-muted mt-1 flex-wrap">
                  <span>{v.views.toLocaleString()} views</span>
                  {v._count && <span>{v._count.watchEvents} watch events</span>}
                  {v.duration && <span>{formatDuration(v.duration)}</span>}
                  {v.category && <span className="text-gold">{v.category}</span>}
                </div>
              </div>
              <div className="shrink-0 flex gap-2">
                <button onClick={() => openEdit(v)} className="text-xs text-gray-400 hover:text-white border border-border rounded-lg px-3 py-1.5 transition-colors">Edit</button>
                <button onClick={() => handleDelete(v.id)} disabled={deleting === v.id} className="text-xs text-red-400 hover:text-red-300 border border-red-800/40 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50">
                  {deleting === v.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-surface border border-border rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editing ? "Edit Video" : "Add New Video"}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <Field label="Title *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Video title" />
                <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Description" textarea />

                {/* Video File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Video File *</label>
                  {uploadState === "done" ? (
                    <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
                      <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-green-400 text-sm font-medium">Video uploaded to Cloudflare</p>
                        <p className="text-gray-500 text-xs font-mono truncate mt-0.5">{form.cfVideoId}</p>
                      </div>
                      <button
                        onClick={() => { setUploadState("idle"); setForm({ ...form, cfVideoId: "" }); if (fileRef.current) fileRef.current.value = ""; }}
                        className="text-gray-500 hover:text-white text-xs shrink-0"
                      >
                        Replace
                      </button>
                    </div>
                  ) : uploadState === "uploading" ? (
                    <div className="bg-surface-high border border-border rounded-lg px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300">Uploading to Cloudflare Stream…</span>
                        <span className="text-gold text-sm font-semibold">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5">
                        <div className="bg-gold h-1.5 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-border hover:border-gold/50 rounded-lg px-4 py-6 text-center cursor-pointer transition-colors"
                      onClick={() => fileRef.current?.click()}
                    >
                      <svg className="w-8 h-8 text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-400">Click to select a video file</p>
                      <p className="text-xs text-gray-600 mt-1">MP4, MOV, MKV — uploaded securely to Cloudflare Stream</p>
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                  />
                </div>

                <Field label="Thumbnail URL *" value={form.thumbnail} onChange={(v) => setForm({ ...form, thumbnail: v })} placeholder="https://..." />
                <Field label="Duration (seconds)" value={form.duration} onChange={(v) => setForm({ ...form, duration: v })} placeholder="e.g. 3600" type="number" />
                <Field label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} placeholder="e.g. Tutorial" />
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="w-4 h-4 accent-gold" />
                    <span className="text-sm text-gray-300">Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="w-4 h-4 accent-gold" />
                    <span className="text-sm text-gray-300">Published</span>
                  </label>
                </div>
              </div>

              {error && <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  disabled={saving || uploadState === "uploading"}
                  className="btn-gold flex-1 py-3 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editing ? "Save Changes" : "Add Video"}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-outline px-6 py-3">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
