"use client";

import { useEffect, useState } from "react";

interface Pack {
  id: string; name: string; minutes: number; price: number;
  popular: boolean; active: boolean;
  _count?: { purchases: number };
}

const EMPTY = { name: "", minutes: "", price: "", popular: false, active: true };

export default function AdminPacksPage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Pack | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const symbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "₵";

  async function load() {
    const r = await fetch("/api/admin/packs");
    if (r.ok) setPacks(await r.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setForm(EMPTY); setError(""); setShowForm(true); }
  function openEdit(p: Pack) {
    setEditing(p);
    setForm({ name: p.name, minutes: String(p.minutes), price: String(p.price), popular: p.popular, active: p.active });
    setError(""); setShowForm(true);
  }

  async function handleSave() {
    if (!form.name || !form.minutes || !form.price) { setError("Name, minutes, and price are required."); return; }
    setSaving(true); setError("");
    const payload = { ...form, minutes: Number(form.minutes), price: Number(form.price), ...(editing ? { id: editing.id } : {}) };
    const r = await fetch("/api/admin/packs", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (r.ok) { await load(); setShowForm(false); } else { const d = await r.json(); setError(d.error || "Failed"); }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this pack?")) return;
    await fetch(`/api/admin/packs?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold">Watch Time Packs</h1><p className="text-muted text-sm mt-0.5">Manage what users can purchase</p></div>
        <button onClick={openNew} className="btn-gold flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Pack
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-surface border border-border rounded-xl shimmer" />)}</div>
      ) : packs.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-border rounded-2xl">
          <p className="text-muted mb-4">No packs yet.</p>
          <button onClick={openNew} className="btn-gold px-6 py-2">Create Your First Pack</button>
        </div>
      ) : (
        <div className="space-y-3">
          {packs.map((p) => (
            <div key={p.id} className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-white">{p.name}</h3>
                  {p.popular && <span className="badge bg-gold/10 text-gold border border-gold/20 text-[10px]">Popular</span>}
                  {!p.active && <span className="badge bg-gray-500/10 text-gray-400 border border-gray-600 text-[10px]">Inactive</span>}
                </div>
                <div className="flex gap-4 text-sm text-muted mt-1">
                  <span className="text-gold font-semibold">{p.minutes} minutes</span>
                  {p._count && <><span>·</span><span>{p._count.purchases} sold</span></>}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xl font-bold text-gold">{symbol}{p.price.toLocaleString()}</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => openEdit(p)} className="text-xs text-gray-400 hover:text-white border border-border rounded-lg px-3 py-1.5 transition-colors">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="text-xs text-red-400 hover:text-red-300 border border-red-800/40 rounded-lg px-3 py-1.5 transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editing ? "Edit Pack" : "New Watch Time Pack"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Pack Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. 30 Minute Pack" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Minutes *</label>
                  <input type="number" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} placeholder="e.g. 30" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Price ({symbol}) *</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 20" className="input-field" />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.popular} onChange={(e) => setForm({ ...form, popular: e.target.checked })} className="w-4 h-4 accent-gold" />
                  <span className="text-sm text-gray-300">Mark as Popular</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 accent-gold" />
                  <span className="text-sm text-gray-300">Active</span>
                </label>
              </div>
            </div>
            {error && <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="btn-gold flex-1 py-3">{saving ? "Saving..." : editing ? "Save Changes" : "Create Pack"}</button>
              <button onClick={() => setShowForm(false)} className="btn-outline px-6 py-3">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
