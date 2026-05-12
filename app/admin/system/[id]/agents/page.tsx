"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { 
  Plus, Lock, ChevronDown, ChevronUp, 
  Upload, Save, Trash2, X, Brain,
  Check, Zap, BarChart2, BookOpen
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
const supabase = createClient();

type AgentTab = 'identite' | 'performance';

export default function AgentsPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id as string;

  const [enterprise, setEnterprise] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [planDef, setPlanDef] = useState<any>(null);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [agentTabs, setAgentTabs] = useState<Record<string, AgentTab>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const [zoomContent, setZoomContent] = useState('');
  const [deploying, setDeploying] = useState(false);
  const avatarRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!id) return;
    async function fetchData() {
      const res = await fetch(`/api/admin/enterprise/${id}`);
      const { enterprise: ent, agents: agentsData, planDef: pd } = await res.json();
      setEnterprise(ent);
      setAgents(agentsData || []);
      setPlanDef(pd);

      // Init tabs
      const tabs: Record<string, AgentTab> = {};
      (agentsData || []).forEach((a: any) => { tabs[a.id] = 'identite'; });
      setAgentTabs(tabs);

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
  const activeAgents = agents.filter(a => a.status !== 'archived');

  const updateAgent = (agentId: string, field: string, value: any) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, [field]: value } : a));
  };

  const setAgentTab = (agentId: string, tab: AgentTab) => {
    setAgentTabs(prev => ({ ...prev, [agentId]: tab }));
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
        model_config: agent.model_config,
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
    if (activeAgents.length >= maxAgents && maxAgents !== 99) return;
    setDeploying(true);
    const defaultModel = availableModels[0]?.model_string || 'claude-sonnet-4-20250514';
    const { data: newAgent, error } = await supabase
      .from('agents')
      .insert({
        enterprise_id: id,
        name: 'NOUVEL AGENT',
        status: 'standby',
        primary_api: defaultModel,
        temperature: 0.7,
        token_budget: 50000,
        system_prompt: '',
        neural_load: 0,
        model_config: { kb_access: false }
      })
      .select()
      .single();

    if (!error && newAgent) {
      setAgents(prev => [...prev, newAgent]);
      setAgentTabs(prev => ({ ...prev, [newAgent.id]: 'identite' }));
      setExpandedAgent(newAgent.id);
    }
    setDeploying(false);
  };

  const handleArchiveAgent = async (agentId: string) => {
    if (!confirm('Archiver cet agent ? Il ne sera plus actif mais ses données sont conservées.')) return;
    await supabase.from('agents').update({ status: 'archived' }).eq('id', agentId);
    setAgents(prev => prev.filter(a => a.id !== agentId));
    if (expandedAgent === agentId) setExpandedAgent(null);
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

  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-white/5 border-t-[#10B981] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] text-white">

      {/* ── PAGE HEADER ── */}
      <div className="sticky top-0 z-10 bg-[#080808]/95 backdrop-blur border-b border-white/5 px-8 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-black text-white uppercase tracking-tight">Agent Task Force</h1>
            <p className="text-[10px] font-mono text-white/30 mt-0.5">
              {activeAgents.length} / {maxAgents === 99 ? '∞' : maxAgents} agents déployés
              {enterprise?.max_agents_override && <span className="ml-2 text-[#F59E0B]">· Override actif</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
              style={{ backgroundColor: `${getPlanColor(enterprise?.package_type)}20`, color: getPlanColor(enterprise?.package_type), border: `1px solid ${getPlanColor(enterprise?.package_type)}40` }}>
              {enterprise?.package_type}
            </span>
            {maxAgents > 0 && activeAgents.length < maxAgents && (
              <button
                onClick={handleDeployAgent}
                disabled={deploying}
                className="flex items-center gap-2 px-4 py-2 bg-[#10B981] text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-[#0ea572] transition-all disabled:opacity-40"
              >
                {deploying
                  ? <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  : <Plus className="w-3.5 h-3.5" />
                }
                Déployer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── OVERLAY ZOOM SYSTEM PROMPT ── */}
      {zoom && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-8 backdrop-blur-sm"
          onClick={() => setZoom(null)}>
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#10B981]">Neural_System_Prompt</p>
                <p className="text-[14px] font-black text-white uppercase mt-1">Full Sequence View</p>
              </div>
              <button onClick={() => setZoom(null)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all">
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
              className="flex-1 w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-6 py-5 text-[12px] font-mono text-white/70 focus:border-[#10B981]/40 outline-none resize-none leading-relaxed custom-scrollbar"
            />
            <div className="flex justify-between text-[8px] font-mono text-white/20 mt-4 flex-shrink-0 uppercase tracking-widest">
              <span>{zoomContent.length} characters recorded</span>
              <span>Lattice optimization: 500 — 2000 units</span>
            </div>
          </div>
        </div>
      )}
      <div className="px-8 py-8">
        <div className="max-w-3xl mx-auto space-y-10">

          {/* ── PLAN STARTUP ── */}
          {maxAgents === 0 && (
            <div className="bg-[#111] border border-dashed border-white/10 rounded-2xl p-20 flex flex-col items-center justify-center text-center space-y-5">
              <Lock className="w-12 h-12 text-white/10" />
              <div>
                <p className="text-[14px] font-black text-white/20 uppercase tracking-widest mb-2">Aucun agent — Plan Startup</p>
                <p className="text-[10px] font-mono text-white/20">Passez au plan Business pour déployer des agents IA</p>
              </div>
            </div>
          )}

          {/* ── AGENTS ── */}
          {activeAgents.map((agent) => {
            const currentTab = agentTabs[agent.id] || 'identite';
            const isExpanded = expandedAgent === agent.id;

            return (
              <div key={agent.id} className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">

                {/* CARTE HEADER */}
                <div
                  className="flex items-center gap-5 px-6 py-5 cursor-pointer hover:bg-white/[0.02] transition-all"
                  onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                >
                  <div className="w-11 h-11 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 bg-[#0D0D0D]">
                    {agent.avatar_url
                      ? <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover shadow-[0_0_15px_rgba(0,0,0,0.5)]" />
                      : <Brain className="w-5 h-5 text-white/20" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[13px] font-black text-white uppercase truncate tracking-wide">{agent.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex-shrink-0 ${
                        agent.status === 'active'
                          ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                          : 'bg-white/5 text-white/30 border border-white/10'
                      }`}>
                        {agent.status === 'active' ? '● ACTIVE' : '● STANDBY'}
                      </span>
                    </div>
                    <p className="text-[9px] font-mono text-white/30 uppercase tracking-tighter">
                      {agent.primary_api || 'Base_Protocol'} · {agent.neural_load || 0}% load
                    </p>
                  </div>
                  <div className="text-white/20 flex-shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* ACCORDÉON */}
                {isExpanded && (
                  <div className="border-t border-white/5">

                    {/* TABS NAVIGATION */}
                    <div className="flex items-center gap-1 px-6 py-3 border-b border-white/5 bg-[#0D0D0D]/50">
                      {[
                        { id: 'identite', label: 'Identité & Config', icon: Brain },
                        { id: 'performance', label: 'Performance', icon: BarChart2 },
                      ].map(({ id: tabId, label, icon: Icon }) => (
                        <button
                          key={tabId}
                          onClick={() => setAgentTab(agent.id, tabId as AgentTab)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                            currentTab === tabId
                              ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                              : 'text-white/20 hover:text-white/50 hover:bg-white/5'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* ══ TAB : IDENTITÉ & CONFIG ══ */}
                    {currentTab === 'identite' && (
                      <div className="p-8 space-y-10">

                        {/* SECTION 1 — IDENTITÉ */}
                        <div className="space-y-7">
                          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#10B981]">01 — Identité</p>

                          <div className="flex items-start gap-10">
                            {/* AVATAR */}
                            <div className="flex flex-col items-center gap-3 flex-shrink-0">
                              <div
                                className="w-24 h-24 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer group relative bg-[#0D0D0D]"
                                onClick={() => avatarRefs.current[agent.id]?.click()}
                              >
                                {agent.avatar_url
                                  ? <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover" />
                                  : <Brain className="w-8 h-8 text-white/10" />
                                }
                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-2xl">
                                  <Upload className="w-5 h-5 text-white" />
                                </div>
                              </div>
                              <button
                                onClick={() => avatarRefs.current[agent.id]?.click()}
                                className="text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-[#10B981] transition-all px-3 py-1.5 border border-white/5 rounded-lg w-full text-center"
                              >
                                Upload
                              </button>
                              <input
                                ref={el => { avatarRefs.current[agent.id] = el; }}
                                type="file" accept="image/*" className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(agent.id, f); }}
                              />
                            </div>

                            {/* NOM + STATUT */}
                            <div className="flex-1 space-y-6">
                              <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Nom de l'agent</label>
                                <input
                                  type="text"
                                  value={agent.name || ''}
                                  onChange={(e) => updateAgent(agent.id, 'name', e.target.value)}
                                  className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-5 py-4 text-[14px] font-black text-white uppercase tracking-wide focus:border-[#10B981]/40 outline-none transition-all"
                                  placeholder="EX: SUPPORT AGENT"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Statut</label>
                                <div className="flex gap-3">
                                  {['active', 'standby'].map((s) => (
                                    <button key={s}
                                      onClick={() => updateAgent(agent.id, 'status', s)}
                                      className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        agent.status === s
                                          ? s === 'active'
                                            ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30'
                                            : 'bg-white/5 text-white/60 border border-white/10'
                                          : 'bg-transparent text-white/20 border border-white/5 hover:border-white/10'
                                      }`}>
                                      {s === 'active' ? '● ACTIVE' : '● STANDBY'}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* SECTION 2 — INTELLIGENCE */}
                        <div className="space-y-7">
                          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#10B981]">02 — Intelligence</p>

                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/30">API Primaire</label>
                            <select
                              value={agent.primary_api || ''}
                              onChange={(e) => updateAgent(agent.id, 'primary_api', e.target.value)}
                              className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-5 py-4 text-[12px] font-mono text-white focus:border-[#10B981]/40 outline-none transition-all appearance-none cursor-pointer"
                            >
                              <option value="">Sélectionner une API</option>
                              {availableModels.map((m) => (
                                <option key={m.id} value={m.model_string}>
                                  {m.name} — {m.provider} ({m.complexity})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/30">API Fallback</label>
                            <select
                              value={agent.fallback_chain?.[0] || ''}
                              onChange={(e) => updateAgent(agent.id, 'fallback_chain', e.target.value ? [e.target.value] : [])}
                              className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-5 py-4 text-[12px] font-mono text-white focus:border-[#10B981]/40 outline-none transition-all appearance-none cursor-pointer"
                            >
                              <option value="">Aucun fallback</option>
                              {availableModels.filter(m => m.model_string !== agent.primary_api).map((m) => (
                                <option key={m.id} value={m.model_string}>
                                  {m.name} — {m.provider}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Température</label>
                              <span className="text-[14px] font-black text-[#10B981]">{Number(agent.temperature ?? 0.7).toFixed(1)}</span>
                            </div>
                            <input
                              type="range" min="0" max="1" step="0.1"
                              value={agent.temperature ?? 0.7}
                              onChange={(e) => updateAgent(agent.id, 'temperature', parseFloat(e.target.value))}
                              className="w-full accent-[#10B981] h-2 bg-white/5 rounded-full appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-[8px] font-mono text-white/20">
                              <span>0.0 — Précis & déterministe</span>
                              <span>0.5 — Équilibré</span>
                              <span>1.0 — Créatif & varié</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Budget tokens individuel</label>
                            <div className="relative">
                              <input
                                type="number"
                                value={agent.token_budget ?? 50000}
                                onChange={(e) => updateAgent(agent.id, 'token_budget', parseInt(e.target.value) || 0)}
                                className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-5 py-4 text-[14px] font-mono text-white focus:border-[#10B981]/40 outline-none transition-all pr-20"
                                placeholder="50000"
                                min={0}
                              />
                              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-white/20 uppercase tracking-widest">tokens</span>
                            </div>
                            <div className="flex justify-between text-[8px] font-mono text-white/20">
                              <span>Limite individuelle — indépendante des autres agents</span>
                              <span>Budget total : {enterprise?.token_budget?.toLocaleString() || '—'} tokens</span>
                            </div>
                          </div>
                        </div>

                        {/* SECTION 3 — SYSTEM PROMPT */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#10B981]">03 — System Prompt</p>
                            <button
                              onClick={() => { setZoom('prompt_' + agent.id); setZoomContent(agent.system_prompt || ''); }}
                              className="text-[9px] text-white/20 hover:text-white/60 transition-all flex items-center gap-1"
                            >
                              ⤢ Agrandir
                            </button>
                          </div>
                          <textarea
                            value={agent.system_prompt || ''}
                            onChange={(e) => updateAgent(agent.id, 'system_prompt', e.target.value)}
                            rows={10}
                            placeholder={`Tu es un agent spécialisé pour ${enterprise?.name}.\n\nTon rôle principal est de...\n\nTu dois toujours...\n\nTu ne dois jamais...`}
                            className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-5 py-4 text-[12px] font-mono text-white/70 focus:border-[#10B981]/40 outline-none resize-none transition-all leading-relaxed"
                          />
                          <div className="flex justify-between text-[8px] font-mono text-white/20">
                            <span>{(agent.system_prompt || '').length} caractères</span>
                            <span>Recommandé : 500 — 2000 caractères</span>
                          </div>
                        </div>

                        {/* SECTION 4 — RÔLE & PROTOCOLE */}
                        <div className="space-y-7">
                          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#10B981]">04 — Rôle & Protocole</p>

                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Protocole de rôle unique</label>
                            <input
                              type="text"
                              value={agent.role_protocol || ''}
                              onChange={(e) => updateAgent(agent.id, 'role_protocol', e.target.value)}
                              placeholder="EX: SUPPORT · COMMERCIAL · RAG · CONTENT"
                              className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-5 py-4 text-[12px] font-mono text-white focus:border-[#10B981]/40 outline-none transition-all"
                            />
                            <p className="text-[8px] font-mono text-white/20">Rôle unique — évite les conflits entre agents de la même équipe</p>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Mots-clés déclencheurs</label>
                            <input
                              type="text"
                              value={Array.isArray(agent.trigger_keywords) ? agent.trigger_keywords.join(', ') : ''}
                              onChange={(e) => updateAgent(agent.id, 'trigger_keywords', e.target.value.split(',').map((k: string) => k.trim()).filter(Boolean))}
                              placeholder="commande, livraison, facture, support..."
                              className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-5 py-4 text-[12px] font-mono text-white focus:border-[#10B981]/40 outline-none transition-all"
                            />
                            <p className="text-[8px] font-mono text-white/20">Séparer par virgule · Mots qui activent spécifiquement cet agent</p>
                          </div>
                        </div>

                        {/* SECTION 5 — ACCÈS DONNÉES */}
                        <div className="space-y-6">
                          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#10B981]">05 — Accès aux données</p>

                          <div className="space-y-3">
                            {[
                              {
                                key: 'kb_access',
                                label: 'Base de connaissance entreprise',
                                description: 'Accès à enterprise_kb — données permanentes de l\'entreprise',
                                icon: BookOpen,
                              },
                              {
                                key: 'inventory_access',
                                label: 'Accès inventaire produits',
                                description: 'Lecture des produits et services du client',
                                icon: Zap,
                              },
                            ].map(({ key, label, description, icon: Icon }) => {
                              const isEnabled = agent.model_config?.[key] ?? false;
                              return (
                                <div key={key} className="flex items-center justify-between p-5 bg-[#0D0D0D] border border-white/5 rounded-xl">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isEnabled ? 'bg-[#10B981]/10' : 'bg-white/5'}`}>
                                      <Icon className={`w-4 h-4 ${isEnabled ? 'text-[#10B981]' : 'text-white/20'}`} />
                                    </div>
                                    <div>
                                      <p className="text-[11px] font-black text-white/70 uppercase tracking-wide">{label}</p>
                                      <p className="text-[8px] font-mono text-white/30 mt-0.5">{description}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => updateAgent(agent.id, 'model_config', { ...agent.model_config, [key]: !isEnabled })}
                                    className={`relative w-12 h-6 rounded-full transition-all flex-shrink-0 ${isEnabled ? 'bg-[#10B981]' : 'bg-white/10'}`}
                                  >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${isEnabled ? 'left-7' : 'left-1'}`} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-[8px] font-mono text-white/20">Chaque agent accède aux données en lecture seule — aucun agent ne peut modifier les données de l'entreprise</p>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                          <button
                            onClick={() => handleArchiveAgent(agent.id)}
                            className="flex items-center gap-2 px-5 py-3 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500/40 hover:text-red-500 hover:border-red-500/40 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Archiver l'agent
                          </button>
                          <button
                            onClick={() => handleSaveAgent(agent)}
                            disabled={saving === agent.id}
                            className="flex items-center gap-2 px-10 py-3 bg-[#10B981] text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-[#0ea572] transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                          >
                            {saving === agent.id
                              ? <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                              : saved === agent.id
                                ? <><Check className="w-3.5 h-3.5" /> SAUVEGARDÉ</>
                                : <><Save className="w-3.5 h-3.5" /> SAUVEGARDER</>
                            }
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ══ TAB : PERFORMANCE ══ */}
                    {currentTab === 'performance' && (
                      <div className="p-8 space-y-6">
                        <p className="text-[11px] font-black text-white uppercase mb-1">Performance en temps réel</p>

                        {/* NEURAL LOAD */}
                        <div className="bg-[#0D0D0D] border border-white/5 rounded-xl p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Neural Load</p>
                            <span className={`text-[20px] font-black ${
                              (agent.neural_load || 0) >= 80 ? 'text-red-400' :
                              (agent.neural_load || 0) >= 50 ? 'text-[#F59E0B]' : 'text-[#10B981]'
                            }`}>{agent.neural_load || 0}%</span>
                          </div>
                          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-1000"
                              style={{
                                width: `${agent.neural_load || 0}%`,
                                backgroundColor: (agent.neural_load || 0) >= 80 ? '#EF4444' : (agent.neural_load || 0) >= 50 ? '#F59E0B' : '#10B981'
                              }}
                            />
                          </div>
                        </div>

                        {/* STATS */}
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { label: 'Tâche en cours', value: agent.current_task || 'En attente de mission' },
                            { label: 'Statut', value: agent.status?.toUpperCase() || '—' },
                            { label: 'API active', value: agent.primary_api || '—' },
                            { label: 'Dernière mise à jour', value: agent.updated_at ? new Date(agent.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' },
                            { label: 'Budget tokens', value: `${(agent.token_budget || 0).toLocaleString()} tokens` },
                            { label: 'Température', value: Number(agent.temperature ?? 0.7).toFixed(1) },
                          ].map(({ label, value }) => (
                            <div key={label} className="bg-[#0D0D0D] border border-white/5 rounded-xl p-5">
                              <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-2">{label}</p>
                              <p className="text-[11px] font-mono text-white/60 truncate uppercase">{value}</p>
                            </div>
                          ))}
                        </div>

                        <p className="text-[8px] font-mono text-white/20 text-center uppercase tracking-widest opacity-20">Les données de performance se mettent à jour en temps réel</p>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}

        </div>
      </div>

    </div>
  );
}
