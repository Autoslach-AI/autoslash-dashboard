"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { 
  Plus, Lock, ChevronDown, ChevronUp, 
  Upload, Save, Trash2, X, Zap, Brain,
  AlertTriangle, Check
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
const supabase = createClient();

export default function AgentsPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id as string;

  const [enterprise, setEnterprise] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [planDef, setPlanDef] = useState<any>(null);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const [zoomContent, setZoomContent] = useState('');
  const [deploying, setDeploying] = useState(false);
  const avatarRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!id) return;
    async function fetchData() {
      // Enterprise + agents + plan
      const res = await fetch(`/api/admin/enterprise/${id}`);
      const { enterprise, agents: agentsData, planDef } = await res.json();
      setEnterprise(enterprise);
      setAgents(agentsData || []);
      setPlanDef(planDef);

      // Available models
      const { data: models } = await supabase
        .from('available_models')
        .select('*')
        .eq('is_active', true)
        .order('complexity');
      setAvailableModels(models || []);

      setLoading(false);
    }
    fetchData();
  }, [id]);

  const maxAgents = enterprise?.max_agents_override ?? planDef?.max_agents_allowed ?? 0;

  const updateAgent = (agentId: string, field: string, value: any) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, [field]: value } : a));
  };

  const handleSaveAgent = async (agent: any) => {
    setSaving(agent.id);
    const { error } = await supabase
      .from('agents')
      .update({
        name: agent.name,
        status: agent.status,
        primary_api: agent.primary_api,
        temperature: agent.temperature,
        token_budget: agent.token_budget,
        system_prompt: agent.system_prompt,
        role_protocol: agent.role_protocol,
        trigger_keywords: agent.trigger_keywords,
        fallback_chain: agent.fallback_chain,
        avatar_url: agent.avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', agent.id);

    setSaving(null);
    if (!error) {
      setSaved(agent.id);
      setTimeout(() => setSaved(null), 2000);
    }
  };

  const handleAvatarUpload = async (agentId: string, file: File) => {
    const ext = file.name.split('.').pop();
    const path = `agent-avatars/${agentId}.${ext}`;
    const { error } = await supabase.storage
      .from('enterprise-assets')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (!error) {
      const { data } = supabase.storage.from('enterprise-assets').getPublicUrl(path);
      updateAgent(agentId, 'avatar_url', data.publicUrl);
    }
  };

  const handleDeployAgent = async () => {
    setDeploying(true);
    const { data: newAgent, error } = await supabase
      .from('agents')
      .insert({
        enterprise_id: id,
        name: 'NOUVEL AGENT',
        status: 'standby',
        primary_api: availableModels[0]?.model_string || 'claude-sonnet-4-20250514',
        temperature: 0.7,
        token_budget: 50000,
        system_prompt: '',
        neural_load: 0,
      })
      .select()
      .single();

    if (!error && newAgent) {
      setAgents(prev => [...prev, newAgent]);
      setExpandedAgent(newAgent.id);
    }
    setDeploying(false);
  };

  const handleArchiveAgent = async (agentId: string) => {
    if (!confirm('Archiver cet agent ? Il ne sera plus actif.')) return;
    await supabase.from('agents').update({ status: 'archived' }).eq('id', agentId);
    setAgents(prev => prev.filter(a => a.id !== agentId));
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

  const activeAgents = agents.filter(a => a.status !== 'archived');
  const emptySlots = Math.max(0, maxAgents - activeAgents.length);

  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-white/5 border-t-[#10B981] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] text-white p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-black text-white uppercase tracking-tight mb-1">Agent Task Force</h1>
            <p className="text-[10px] font-mono text-white/30">
              {activeAgents.length} / {maxAgents === 99 ? '∞' : maxAgents} agents déployés
              {enterprise?.max_agents_override && (
                <span className="ml-2 text-[#F59E0B]">· Override actif</span>
              )}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
            style={{ backgroundColor: `${getPlanColor(enterprise?.package_type)}20`, color: getPlanColor(enterprise?.package_type), border: `1px solid ${getPlanColor(enterprise?.package_type)}40` }}>
            {enterprise?.package_type}
          </span>
        </div>

        {/* ── PLAN STARTUP — AUCUN AGENT ── */}
        {maxAgents === 0 && (
          <div className="bg-[#111] border border-dashed border-white/10 rounded-2xl p-16 flex flex-col items-center justify-center text-center space-y-4">
            <Lock className="w-10 h-10 text-white/10" />
            <p className="text-[13px] font-black text-white/20 uppercase tracking-widest">Aucun agent — Plan Startup</p>
            <p className="text-[10px] font-mono text-white/20">Passez au plan Business pour déployer des agents IA</p>
          </div>
        )}

        {/* ── AGENTS DÉPLOYÉS ── */}
        {activeAgents.map((agent) => (
          <div key={agent.id} className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">

            {/* CARTE AGENT — HEADER CLIQUABLE */}
            <div
              className="flex items-center gap-5 p-6 cursor-pointer hover:bg-white/[0.02] transition-all"
              onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
            >
              {/* AVATAR */}
              <div className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 bg-[#1a1a1a]">
                {agent.avatar_url
                  ? <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover" />
                  : <Brain className="w-5 h-5 text-white/20" />
                }
              </div>

              {/* INFOS */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[14px] font-black text-white uppercase truncate">{agent.name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex-shrink-0 ${
                    agent.status === 'active' 
                      ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' 
                      : 'bg-white/5 text-white/30 border border-white/10'
                  }`}>
                    {agent.status === 'active' ? '● ACTIVE' : '● STANDBY'}
                  </span>
                </div>
                <p className="text-[9px] font-mono text-white/30">
                  {agent.primary_api || 'API non configurée'} · {agent.neural_load || 0}% neural load
                </p>
              </div>

              {/* CHEVRON */}
              <div className="flex-shrink-0 text-white/20">
                {expandedAgent === agent.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            {/* ACCORDÉON — CONTENU */}
            {expandedAgent === agent.id && (
              <div className="border-t border-white/5 space-y-8 p-8">

                {/* ── SECTION 1 — IDENTITÉ ── */}
                <div className="space-y-6">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#10B981]">01 — Identité</p>

                  <div className="flex items-start gap-8">
                    {/* AVATAR UPLOAD */}
                    <div className="flex flex-col items-center gap-3 flex-shrink-0">
                      <div
                        className="w-20 h-20 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer group relative bg-[#0D0D0D]"
                        onClick={() => avatarRefs.current[agent.id]?.click()}
                      >
                        {agent.avatar_url
                          ? <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover" />
                          : <Brain className="w-7 h-7 text-white/10" />
                        }
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-2xl">
                          <Upload className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <button
                        onClick={() => avatarRefs.current[agent.id]?.click()}
                        className="text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-[#10B981] transition-all px-3 py-1.5 border border-white/5 rounded-lg"
                      >
                        Upload
                      </button>
                      <input
                        ref={el => { avatarRefs.current[agent.id] = el; }}
                        type="file" accept="image/*" className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAvatarUpload(agent.id, file);
                        }}
                      />
                    </div>

                    {/* NOM + STATUT */}
                    <div className="flex-1 space-y-5">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Nom de l'agent</label>
                        <input
                          type="text"
                          value={agent.name || ''}
                          onChange={(e) => updateAgent(agent.id, 'name', e.target.value)}
                          className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 text-[13px] font-black text-white uppercase tracking-wide focus:border-[#10B981]/40 outline-none transition-all"
                          placeholder="EX: SUPPORT AGENT"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Statut</label>
                        <div className="flex gap-3">
                          {['active', 'standby'].map((s) => (
                            <button
                              key={s}
                              onClick={() => updateAgent(agent.id, 'status', s)}
                              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                agent.status === s
                                  ? s === 'active'
                                    ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30'
                                    : 'bg-white/5 text-white/60 border border-white/10'
                                  : 'bg-transparent text-white/20 border border-white/5 hover:border-white/10'
                              }`}
                            >
                              {s === 'active' ? '● ACTIVE' : '● STANDBY'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── SECTION 2 — INTELLIGENCE ── */}
                <div className="space-y-6">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#10B981]">02 — Intelligence</p>

                  {/* API PRIMAIRE */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30">API Primaire</label>
                    <select
                      value={agent.primary_api || ''}
                      onChange={(e) => updateAgent(agent.id, 'primary_api', e.target.value)}
                      className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 text-[12px] font-mono text-white focus:border-[#10B981]/40 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Sélectionner une API</option>
                      {availableModels.map((m) => (
                        <option key={m.id} value={m.model_string}>
                          {m.name} — {m.provider} ({m.complexity})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* FALLBACK CHAIN */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30">API Fallback</label>
                    <select
                      value={agent.fallback_chain?.[0] || ''}
                      onChange={(e) => updateAgent(agent.id, 'fallback_chain', [e.target.value])}
                      className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 text-[12px] font-mono text-white focus:border-[#10B981]/40 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Aucun fallback</option>
                      {availableModels.filter(m => m.model_string !== agent.primary_api).map((m) => (
                        <option key={m.id} value={m.model_string}>
                          {m.name} — {m.provider}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* TEMPÉRATURE */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Température</label>
                      <span className="text-[12px] font-black text-[#10B981]">{agent.temperature ?? 0.7}</span>
                    </div>
                    <input
                      type="range" min="0" max="1" step="0.1"
                      value={agent.temperature ?? 0.7}
                      onChange={(e) => updateAgent(agent.id, 'temperature', parseFloat(e.target.value))}
                      className="w-full accent-[#10B981] h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] font-mono text-white/20">
                      <span>0.0 — Précis</span>
                      <span>0.5 — Équilibré</span>
                      <span>1.0 — Créatif</span>
                    </div>
                  </div>

                  {/* BUDGET TOKENS */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30">
                      Budget tokens (limite individuelle)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={agent.token_budget ?? 50000}
                        onChange={(e) => updateAgent(agent.id, 'token_budget', parseInt(e.target.value))}
                        className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 text-[13px] font-mono text-white focus:border-[#10B981]/40 outline-none transition-all"
                        placeholder="50000"
                        min={0}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-mono text-white/20 uppercase">tokens</span>
                    </div>
                    <p className="text-[8px] font-mono text-white/20">
                      Budget total entreprise : {enterprise?.token_budget?.toLocaleString() || '—'} tokens
                    </p>
                  </div>
                </div>

                {/* ── SECTION 3 — SYSTEM PROMPT ── */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#10B981]">03 — System Prompt</p>
                    <button
                      onClick={() => { setZoom('prompt_' + agent.id); setZoomContent(agent.system_prompt || ''); }}
                      className="text-[9px] text-white/20 hover:text-white/60 transition-all"
                    >⤢ Agrandir</button>
                  </div>
                  <textarea
                    value={agent.system_prompt || ''}
                    onChange={(e) => updateAgent(agent.id, 'system_prompt', e.target.value)}
                    rows={6}
                    placeholder={`Tu es un agent spécialisé pour ${enterprise?.name}. Ton rôle est de...`}
                    className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 text-[11px] font-mono text-white/70 focus:border-[#10B981]/40 outline-none resize-none transition-all leading-relaxed"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-white/20">
                    <span>{(agent.system_prompt || '').length} caractères</span>
                    <span>Recommandé : 500 — 2000 caractères</span>
                  </div>
                </div>

                {/* ── SECTION 4 — ROLE PROTOCOL ── */}
                <div className="space-y-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#10B981]">04 — Rôle & Protocole</p>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Protocole de rôle</label>
                    <input
                      type="text"
                      value={agent.role_protocol || ''}
                      onChange={(e) => updateAgent(agent.id, 'role_protocol', e.target.value)}
                      placeholder="EX: SUPPORT · COMMERCIAL · RAG · CONTENT"
                      className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 text-[12px] font-mono text-white focus:border-[#10B981]/40 outline-none transition-all"
                    />
                    <p className="text-[8px] font-mono text-white/20">Définit le rôle unique de cet agent — évite les conflits entre agents</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Mots-clés déclencheurs</label>
                    <input
                      type="text"
                      value={Array.isArray(agent.trigger_keywords) ? agent.trigger_keywords.join(', ') : ''}
                      onChange={(e) => updateAgent(agent.id, 'trigger_keywords', e.target.value.split(',').map((k: string) => k.trim()).filter(Boolean))}
                      placeholder="commande, livraison, facture..."
                      className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 text-[12px] font-mono text-white focus:border-[#10B981]/40 outline-none transition-all"
                    />
                    <p className="text-[8px] font-mono text-white/20">Séparer par virgule · Mots qui activent cet agent spécifiquement</p>
                  </div>
                </div>

                {/* ── SECTION 5 — DONNÉES PARTAGÉES ── */}
                <div className="space-y-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#10B981]">05 — Données partagées</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Accès base entreprise', value: 'Lecture seule' },
                      { label: 'Partage entre agents', value: 'Isolé — pas de conflit' },
                      { label: 'Priorité', value: `Agent ${agents.indexOf(agent) + 1} / ${activeAgents.length}` },
                      { label: 'Isolation mémoire', value: 'Active' },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-4 bg-[#0D0D0D] border border-white/5 rounded-xl">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-2">{label}</p>
                        <p className="text-[10px] font-mono text-white/50">{value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[8px] font-mono text-white/20">Configuration avancée disponible dans Settings</p>
                </div>

                {/* ── SECTION 6 — PERFORMANCE ── */}
                <div className="space-y-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#10B981]">06 — Performance</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Neural Load', value: `${agent.neural_load || 0}%` },
                      { label: 'Tâche en cours', value: agent.current_task || 'En attente' },
                      { label: 'Dernière MAJ', value: agent.updated_at ? new Date(agent.updated_at).toLocaleDateString('fr-FR') : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-4 bg-[#0D0D0D] border border-white/5 rounded-xl">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-2">{label}</p>
                        <p className="text-[10px] font-mono text-white/50 truncate">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── ACTIONS ── */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <button
                    onClick={() => handleArchiveAgent(agent.id)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500/40 hover:text-red-500 hover:border-red-500/40 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Archiver
                  </button>

                  <button
                    onClick={() => handleSaveAgent(agent)}
                    disabled={saving === agent.id}
                    className="flex items-center gap-2 px-8 py-2.5 bg-[#10B981] text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-[#0ea572] transition-all disabled:opacity-40"
                  >
                    {saving === agent.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : saved === agent.id ? (
                      <><Check className="w-3.5 h-3.5" /> SAUVEGARDÉ</>
                    ) : (
                      <><Save className="w-3.5 h-3.5" /> SAUVEGARDER</>
                    )}
                  </button>
                </div>

              </div>
            )}
          </div>
        ))}

        {/* ── SLOTS VIDES ── */}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-${i}`}
            onClick={handleDeployAgent}
            className="bg-[#0D0D0D] border border-dashed border-[#10B981]/20 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#10B981]/5 hover:border-[#10B981]/40 transition-all group space-y-3"
          >
            <div className="w-12 h-12 rounded-xl bg-[#10B981]/10 flex items-center justify-center group-hover:bg-[#10B981]/20 transition-all">
              {deploying ? (
                <div className="w-5 h-5 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" />
              ) : (
                <Plus className="w-5 h-5 text-[#10B981]" />
              )}
            </div>
            <p className="text-[11px] font-black text-[#10B981]/60 uppercase tracking-[0.2em] group-hover:text-[#10B981] transition-all">
              + Déployer un agent
            </p>
            <p className="text-[9px] font-mono text-white/20">Slot {activeAgents.length + i + 1} / {maxAgents === 99 ? '∞' : maxAgents}</p>
          </div>
        ))}

      </div>

      {/* ── OVERLAY ZOOM SYSTEM PROMPT ── */}
      {zoom && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
          onClick={() => setZoom(null)}>
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[75vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30">System Prompt</p>
              <button onClick={() => setZoom(null)} className="text-white/20 hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={zoomContent}
              onChange={(e) => {
                setZoomContent(e.target.value);
                const agentId = zoom.replace('prompt_', '');
                updateAgent(agentId, 'system_prompt', e.target.value);
              }}
              rows={18}
              className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 text-[11px] font-mono text-white/70 focus:border-[#10B981]/40 outline-none resize-none leading-relaxed"
            />
          </div>
        </div>
      )}

    </div>
  );
}
