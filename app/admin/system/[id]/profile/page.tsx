"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FileText, Calendar, DollarSign, Check, AlertTriangle } from 'lucide-react';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id as string;
  
  const [enterprise, setEnterprise] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchData() {
      const res = await fetch(`/api/admin/enterprise/${id}`);
      const { enterprise, planDef } = await res.json();
      setEnterprise(enterprise);

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
    setTimeout(() => {
      router.refresh();
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

  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-white/5 border-t-[#10B981] rounded-full animate-spin" />
    </div>
  );

  const isProspect = enterprise?.status === 'PROSPECT';

  return (
    <div className="min-h-screen bg-[#080808] text-white p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">{enterprise?.project_id}</p>
            <h1 className="text-[22px] font-black text-white uppercase">{enterprise?.name}</h1>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
            style={{
              backgroundColor: `${getPlanColor(enterprise?.package_type)}20`,
              color: getPlanColor(enterprise?.package_type),
              border: `1px solid ${getPlanColor(enterprise?.package_type)}40`
            }}>
            {enterprise?.package_type}
          </span>
        </div>

        {/* BOUTON ACTIVER */}
        {isProspect && (
          <div className="p-4 bg-[#111] border border-[#10B981]/20 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black text-white uppercase mb-1">Client non activé</p>
              <p className="text-[9px] font-mono text-white/30">Activer pour donner accès au Dashboard 3</p>
            </div>
            <button
              onClick={handleActivate}
              disabled={activating || activated}
              className="px-6 py-3 bg-[#10B981] text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-[#0ea572] transition-all disabled:opacity-40 flex items-center gap-2"
            >
              {activated ? <><Check className="w-4 h-4" /> ACTIVÉ</> : activating ? 'ACTIVATION...' : 'ACTIVER LE CLIENT'}
            </button>
          </div>
        )}

        {activated && (
          <div className="p-4 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl flex items-center gap-3">
            <Check className="w-5 h-5 text-[#10B981]" />
            <p className="text-[11px] font-black text-[#10B981] uppercase">Client activé — accès Dashboard 3 accordé</p>
          </div>
        )}

        {/* INFOS CONTACT */}
        <div className="bg-[#111] border border-white/5 rounded-xl p-5 space-y-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Informations contact</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Contact', value: enterprise?.contact_name },
              { label: 'Email', value: enterprise?.email },
              { label: 'Téléphone', value: enterprise?.phone },
              { label: 'Secteur', value: enterprise?.sector },
              { label: 'Région', value: enterprise?.region },
              { label: 'Soumis le', value: enterprise?.created_at ? new Date(enterprise.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-1">
                <p className="text-[8px] font-black uppercase tracking-widest text-white/30">{label}</p>
                <p className="text-[11px] font-mono text-white/70">{value || '—'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ELITE — BUDGET + RDV */}
        {enterprise?.package_type === 'ELITE' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-xl flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-[#F59E0B]" />
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
              <div className="p-4 bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-xl flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#F59E0B]" />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#F59E0B]/60 mb-1">Rendez-vous</p>
                  <p className="text-[13px] font-black text-[#F59E0B]">{rdv}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TEMPLATE */}
        {template && enterprise?.package_type !== 'ELITE' && (
          <div className="bg-[#111] border border-white/5 rounded-xl p-5 space-y-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Template choisi</p>
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-black text-white">{template.title}</p>
              <p className="text-[13px] font-black text-[#10B981]">
                {new Intl.NumberFormat('fr-FR').format(template.price_fcfa)} FCFA
              </p>
            </div>
            {template.preview_url && (
              <a href={template.preview_url} target="_blank" rel="noopener noreferrer"
                className="text-[9px] font-mono text-[#10B981]/60 hover:text-[#10B981] transition-all truncate block">
                🔗 {template.preview_url}
              </a>
            )}
          </div>
        )}

        {/* MESSAGE */}
        {enterprise?.message && (
          <div className="bg-[#111] border border-white/5 rounded-xl p-5 space-y-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Message du prospect</p>
            <p className="text-[10px] font-mono text-white/50 leading-relaxed whitespace-pre-wrap">{enterprise.message}</p>
          </div>
        )}

        {/* FICHIERS */}
        {assets.length > 0 && (
          <div className="bg-[#111] border border-white/5 rounded-xl p-5 space-y-3">
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

        {/* NOTES INTERNES */}
        <div className="bg-[#111] border border-white/5 rounded-xl p-5 space-y-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Notes internes</p>
          <p className="text-[10px] font-mono text-white/40 leading-relaxed">
            {enterprise?.custom_notes || 'Aucune note'}
          </p>
        </div>

      </div>
    </div>
  );
}
