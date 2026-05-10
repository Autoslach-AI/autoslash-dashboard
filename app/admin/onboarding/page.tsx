"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Check, FileText } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [prospect, setProspect] = useState<any>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [edits, setEdits] = useState<any>({});

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError('');
    setProspect(null);

    const res = await fetch(`/api/admin/prospect/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (data.prospect) {
      setProspect(data.prospect);
      setEdits({
        name: data.prospect.name,
        sector: data.prospect.sector,
        region: data.prospect.region,
        custom_notes: data.prospect.custom_notes || ''
      });
      setStep(2);
    } else {
      setError('Aucun prospect trouvé. Vérifiez l\'ID, le nom ou l\'email.');
    }
    setSearching(false);
  };

  const handleSync = async () => {
    setSaving(true);

    await fetch(`/api/admin/prospect/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enterprise_id: prospect.enterprise_id,
        ...edits
      })
    });

    setStep(3);
    setTimeout(() => {
      router.push(`/admin/system/${prospect.enterprise_id}`);
    }, 1500);
  };

  const getPlanColor = (plan: string) => {
    switch (plan?.toUpperCase()) {
      case 'STARTUP': return '#6B7280';
      case 'BUSINESS': return '#3B82F6';
      case 'ENTERPRISE': return '#10B981';
      case 'ELITE': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const assets = prospect?.assets_urls
    ? (typeof prospect.assets_urls === 'string'
      ? JSON.parse(prospect.assets_urls)
      : prospect.assets_urls)
    : [];

  return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">

        {/* HEADER */}
        <div className="mb-12 text-center">
          <p className="text-[10px] font-mono text-[#10B981] uppercase tracking-[0.4em] mb-3">Autoslash AI · Oracle</p>
          <h1 className="text-[28px] font-black uppercase tracking-tight text-white mb-2">Synchronisation Système</h1>
          <p className="text-[11px] text-white/30 font-mono">Connecter un prospect signé à Dashboard 2</p>
        </div>

        {/* PROGRESS */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {['RECHERCHE', 'VÉRIFICATION', 'SYNC'].map((label, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                step > i + 1 ? 'bg-[#10B981] text-black' :
                step === i + 1 ? 'bg-[#10B981]/20 border border-[#10B981] text-[#10B981]' :
                'bg-white/5 border border-white/10 text-white/20'
              }`}>
                {step > i + 1 ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${step === i + 1 ? 'text-white' : 'text-white/20'}`}>
                {label}
              </span>
              {i < 2 && <div className="w-8 h-px bg-white/10" />}
            </div>
          ))}
        </div>

        {/* ÉTAPE 1 — RECHERCHE */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="ID prospect (AS-B-2026-0001), nom ou email..."
                className="w-full bg-[#111] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-[12px] font-mono text-white focus:border-[#10B981]/40 outline-none transition-all"
              />
            </div>
            {error && <p className="text-[10px] text-red-400 font-mono text-center">{error}</p>}
            <button
              onClick={handleSearch}
              disabled={searching || !query.trim()}
              className="w-full py-4 bg-[#10B981] text-black font-black text-[11px] uppercase tracking-[0.2em] rounded-xl hover:bg-[#0ea572] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {searching ? 'RECHERCHE EN COURS...' : 'SCANNER LE PROSPECT'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ÉTAPE 2 — VÉRIFICATION */}
        {step === 2 && prospect && (
          <div className="space-y-6">

            {/* PLAN BADGE */}
            <div className="flex items-center justify-between p-4 bg-[#111] border border-white/5 rounded-xl">
              <div>
                <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">{prospect.project_id}</p>
                <p className="text-[16px] font-black text-white uppercase">{prospect.name}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                style={{
                  backgroundColor: `${getPlanColor(prospect.package_type)}20`,
                  color: getPlanColor(prospect.package_type),
                  border: `1px solid ${getPlanColor(prospect.package_type)}40`
                }}>
                {prospect.package_type}
              </span>
            </div>

            {/* INFOS EDITABLES */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Nom', key: 'name' },
                { label: 'Secteur', key: 'sector' },
                { label: 'Région', key: 'region' },
              ].map(({ label, key }) => (
                <div key={key} className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#10B981]">{label}</label>
                  <input
                    type="text"
                    value={edits[key] || ''}
                    onChange={(e) => setEdits({ ...edits, [key]: e.target.value })}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-[11px] font-mono text-white focus:border-[#10B981]/40 outline-none"
                  />
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Email</label>
                <p className="text-[11px] font-mono text-white/40 px-3 py-2">{prospect.email}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Téléphone</label>
                <p className="text-[11px] font-mono text-white/40 px-3 py-2">{prospect.phone}</p>
              </div>
            </div>

            {/* MESSAGE */}
            {prospect.message && (
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Message du prospect</label>
                <div className="bg-[#111] border border-white/5 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <p className="text-[10px] font-mono text-white/50 leading-relaxed whitespace-pre-wrap">{prospect.message}</p>
                </div>
              </div>
            )}

            {/* FICHIERS */}
            {assets.length > 0 && (
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/30">
                  Fichiers joints ({assets.length})
                </label>
                <div className="space-y-1">
                  {assets.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-[#111] border border-white/5 rounded-lg hover:border-[#10B981]/30 transition-all group"
                    >
                      <FileText className="w-3 h-3 text-[#10B981]" />
                      <span className="text-[10px] font-mono text-white/40 group-hover:text-white/70 truncate">
                        {url.split('/').pop()}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* NOTES INTERNES */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-[#10B981]">Notes internes</label>
              <textarea
                value={edits.custom_notes || ''}
                onChange={(e) => setEdits({ ...edits, custom_notes: e.target.value })}
                placeholder="Notes pour ce prospect signé..."
                rows={3}
                className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-[11px] font-mono text-white/70 focus:border-[#10B981]/40 outline-none resize-none"
              />
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
              >
                RETOUR
              </button>
              <button
                onClick={handleSync}
                disabled={saving}
                className="flex-1 py-3 bg-[#10B981] text-black font-black text-[11px] uppercase tracking-[0.2em] rounded-xl hover:bg-[#0ea572] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {saving ? 'SYNCHRONISATION...' : 'OUVRIR LE SYSTÈME CLIENT'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 — SYNC */}
        {step === 3 && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-[#10B981]" />
            </div>
            <div>
              <h2 className="text-[20px] font-black text-white uppercase mb-2">Système Synchronisé</h2>
              <p className="text-[11px] font-mono text-white/30">Redirection vers Dashboard 2...</p>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#10B981] rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
