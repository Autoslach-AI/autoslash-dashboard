"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FileText, Calendar, DollarSign, Check, Upload, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase';
const supabase = createClient();

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [enterprise, setEnterprise] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchData() {
      const res = await fetch(`/api/admin/enterprise/${id}`);
      const { enterprise } = await res.json();
      setEnterprise(enterprise);
      setNotes(enterprise?.custom_notes || '');
      setAvatarUrl(enterprise?.avatar_url || null);

      if (enterprise?.template_id) {
        const tRes = await fetch(`/api/admin/template/${enterprise.template_id}`);
        const tData = await tRes.json();
        setTemplate(tData.template);
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const handleActivate = async () => {
    if (!enterprise) return;
    setActivating(true);
    await fetch(`/api/admin/enterprise/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enterprise_id: id })
    });
    setActivated(true);
    setActivating(false);
    setEnterprise({ ...enterprise, status: 'ACTIVE', activated_at: new Date().toISOString() });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);

    const ext = file.name.split('.').pop();
    const path = `avatars/${id}.${ext}`;

    const { error } = await supabase.storage
      .from('enterprise-assets')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (!error) {
      const { data: urlData } = supabase.storage
        .from('enterprise-assets')
        .getPublicUrl(path);

      const url = urlData.publicUrl;
      setAvatarUrl(url);

      await fetch(`/api/admin/prospect/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enterprise_id: id, avatar_url: url })
      });
    }
    setUploadingAvatar(false);
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await fetch(`/api/admin/prospect/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enterprise_id: id, custom_notes: notes })
    });
    setSavingNotes(false);
    setEditingNotes(false);
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

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return '#10B981';
      case 'PROSPECT': return '#F59E0B';
      case 'WARNING': return '#F59E0B';
      case 'CRITICAL': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const extractRdv = (message: string) => {
    if (!message) return null;
    const match = message.match(/Rendez-vous\s*:\s*(.+)/i);
    return match ? match[1].trim() : null;
  };

  const extractBudget = (message: string) => {
    if (!message) return null;
    const match = message.match(/Budget\s*:\s*([^\n]+)/i);
    return match ? match[1].trim() : null;
  };

  const assets = enterprise?.assets_urls
    ? (typeof enterprise.assets_urls === 'string'
      ? JSON.parse(enterprise.assets_urls)
      : enterprise.assets_urls)
    : [];

  const rdv = enterprise?.package_type === 'ELITE' ? extractRdv(enterprise?.message) : null;
  const budgetFromMessage = enterprise?.package_type === 'ELITE' ? extractBudget(enterprise?.message) : null;
  const initials = enterprise?.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '??';
  const isProspect = enterprise?.status === 'PROSPECT';

  const daysSince = enterprise?.created_at
    ? Math.floor((new Date().getTime() - new Date(enterprise.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-white/5 border-t-[#10B981] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] text-white p-8">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* BLOC 1 — IDENTITÉ VISUELLE */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 flex items-center gap-6">
          {/* AVATAR */}
          <div className="relative flex-shrink-0">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden cursor-pointer group border border-white/10"
              style={{ backgroundColor: `${getPlanColor(enterprise?.package_type)}20` }}
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-[22px] font-black" style={{ color: getPlanColor(enterprise?.package_type) }}>{initials}</span>
              }
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-2xl">
                {uploadingAvatar
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Upload className="w-5 h-5 text-white" />
                }
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          {/* IDENTITÉ */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{enterprise?.project_id}</p>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                style={{ backgroundColor: `${getPlanColor(enterprise?.package_type)}20`, color: getPlanColor(enterprise?.package_type), border: `1px solid ${getPlanColor(enterprise?.package_type)}40` }}>
                {enterprise?.package_type}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                style={{ backgroundColor: `${getStatusColor(enterprise?.status)}10`, color: getStatusColor(enterprise?.status), border: `1px solid ${getStatusColor(enterprise?.status)}30` }}>
                {enterprise?.status}
              </span>
            </div>
            <h1 className="text-[22px] font-black text-white uppercase tracking-tight">{enterprise?.name}</h1>
            <p className="text-[10px] font-mono text-white/30 mt-1">{enterprise?.sector} · {enterprise?.region}</p>
          </div>

          {/* BOUTON ACTIVER */}
          {isProspect && !activated && (
            <button
              onClick={handleActivate}
              disabled={activating}
              className="px-5 py-3 bg-[#10B981] text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-[#0ea572] transition-all disabled:opacity-40 flex-shrink-0"
            >
              {activating ? 'ACTIVATION...' : 'ACTIVER LE CLIENT'}
            </button>
          )}
          {(activated || enterprise?.status === 'ACTIVE') && (
            <div className="flex items-center gap-2 px-4 py-2 bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl flex-shrink-0">
              <Check className="w-4 h-4 text-[#10B981]" />
              <span className="text-[10px] font-black text-[#10B981] uppercase tracking-widest">Actif</span>
            </div>
          )}
        </div>

        {/* BLOC 2 — TIMELINE */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-4">Timeline</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">Date soumission</p>
              <p className="text-[11px] font-mono text-white/70">
                {enterprise?.created_at
                  ? new Date(enterprise.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">Date activation</p>
              <p className="text-[11px] font-mono text-white/70">
                {enterprise?.activated_at
                  ? new Date(enterprise.activated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">Jours depuis soumission</p>
              <p className="text-[11px] font-mono text-white/70">{daysSince} jours</p>
            </div>
          </div>
        </div>

        {/* BLOC 3 — CONTACT */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-4">Contact</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Nom contact', value: enterprise?.contact_name },
              { label: 'Email', value: enterprise?.email },
              { label: 'Téléphone', value: enterprise?.phone },
              { label: 'Secteur', value: enterprise?.sector },
              { label: 'Région', value: enterprise?.region },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">{label}</p>
                <p className="text-[11px] font-mono text-white/70">{value || '—'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* BLOC 4 — COMMANDE */}
        {enterprise?.package_type === 'ELITE' ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-2xl flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-[#F59E0B]/60 mb-1">Budget</p>
                <p className="text-[13px] font-black text-[#F59E0B]">
                  {enterprise?.monthly_cost > 0
                    ? new Intl.NumberFormat('fr-FR').format(enterprise.monthly_cost) + ' FCFA'
                    : budgetFromMessage || '—'}
                </p>
              </div>
            </div>
            {rdv && (
              <div className="p-4 bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-2xl flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#F59E0B]/60 mb-1">Rendez-vous</p>
                  <p className="text-[13px] font-black text-[#F59E0B]">{rdv}</p>
                </div>
              </div>
            )}
          </div>
        ) : template ? (
          <div className="bg-[#111] border border-white/5 rounded-2xl p-5 space-y-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Template choisi</p>
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-black text-white">{template.title}</p>
              <p className="text-[13px] font-black text-[#10B981]">
                {new Intl.NumberFormat('fr-FR').format(template.price_fcfa)} FCFA
              </p>
            </div>
            {template.preview_url && (
              <a href={template.preview_url} target="_blank" rel="noopener noreferrer"
                className="text-[9px] font-mono text-[#10B981]/60 hover:text-[#10B981] transition-all block">
                🔗 {template.preview_url}
              </a>
            )}
          </div>
        ) : null}

        {/* BLOC 5 — MESSAGE */}
        {enterprise?.message && (
          <div className="bg-[#111] border border-white/5 rounded-2xl p-5 space-y-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Message du prospect</p>
            <p className="text-[10px] font-mono text-white/50 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">{enterprise.message}</p>
          </div>
        )}

        {/* BLOC 6 — FICHIERS */}
        {assets.length > 0 && (
          <div className="bg-[#111] border border-white/5 rounded-2xl p-5 space-y-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Fichiers joints ({assets.length})</p>
            <div className="space-y-1">
              {assets.map((url: string, i: number) => {
                const filename = decodeURIComponent(url.split('/').pop() || '');
                const ext = filename.split('.').pop()?.toLowerCase();
                const isDoc = ['docx', 'doc', 'xlsx', 'xls'].includes(ext || '');
                const icon = ext === 'pdf' ? '📄' : ['png','jpg','jpeg','webp'].includes(ext||'') ? '🖼️' : ext === 'mp4' ? '🎬' : '📝';
                return (
                  <div key={i} className="flex items-center gap-2 p-2 bg-black/30 border border-white/5 rounded-lg">
                    <span>{icon}</span>
                    <span className="text-[10px] font-mono text-white/40 truncate flex-1">{filename}</span>
                    <a href={url} target={isDoc ? '_self' : '_blank'} download={isDoc ? filename : undefined} rel="noopener noreferrer"
                      className="text-[9px] font-black text-[#10B981] hover:text-white transition-all px-2 py-1 border border-[#10B981]/20 rounded uppercase tracking-widest">
                      {isDoc ? '↓' : '→'}
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BLOC 7 — NOTES INTERNES */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Notes internes</p>
            <div className="flex items-center gap-2">
              {editingNotes && (
                <button onClick={handleSaveNotes} disabled={savingNotes}
                  className="px-3 py-1 bg-[#10B981] text-black font-black text-[9px] uppercase tracking-widest rounded-lg disabled:opacity-40">
                  {savingNotes ? '...' : 'SAUVEGARDER'}
                </button>
              )}
              <button onClick={() => setEditingNotes(!editingNotes)}
                className="text-white/20 hover:text-[#10B981] transition-all">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {editingNotes ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full bg-black border border-[#10B981]/20 rounded-lg px-3 py-2 text-[11px] font-mono text-white/70 focus:border-[#10B981]/40 outline-none resize-none"
            />
          ) : (
            <p className="text-[10px] font-mono text-white/40 leading-relaxed">
              {notes || 'Aucune note — cliquer sur le crayon pour ajouter'}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
