"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Plus, Lock, ChevronLeft, 
  Upload, Save, Trash2, X, Brain,
  Check, Zap, BarChart2, BookOpen, Cpu
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
const supabase = createClient();

type AgentTab = 'identite' | 'skills' | 'performance';

export default function AgentIndividualPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id as string;
  const agentId = Array.isArray(params?.agentId) ? params.agentId[0] : params?.agentId as string;

  const [enterprise, setEnterprise] = useState<any>(null);
  const [agent, setAgent] = useState<any>(null);
  const [planDef, setPlanDef] = useState<any>(null);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<AgentTab>('identite');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [zoomContent, setZoomContent] = useState('');
  const [agentSkills, setAgentSkills] = useState<any[]>([]);
  const avatarRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!id || !agentId) return;
    async function fetchData() {
      const res = await fetch(`/api/admin/enterprise/${id}`);
      const { enterprise: ent, agents: agentsData, planDef: pd } = await res.json();
      setEnterprise(ent);
      setPlanDef(pd);

      const currentAgent = agentsData?.find((a: any) => a.id === agentId);
      if (currentAgent) {
        setAgent(currentAgent);
      }

      // Available models
      const { data: models } = await supabase
        .from('available_models')
        .select('*')
        .eq('is_active', true)
        .order('complexity');
      setAvailableModels(models || []);

      // Skills for this agent
      const { data: skills } = await supabase
        .from('agent_skills')
        .select('*')
        .eq('agent_id', agentId);
      setAgentSkills(skills || []);

      setLoading(false);
    }
    fetchData();
  }, [id, agentId]);

  const maxSkills = planDef?.max_skills_per_agent ?? 0;

  const updateAgentState = (field: string, value: any) => {
    setAgent((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSaveAgent = async () => {
    if (!agent) return;
    setSaving(true);
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
    
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!agent) return;
    const ext = file.name.split('.').pop();
    const path = `agent-avatars/${agent.id}.${ext}`;
    const { error } = await supabase.storage
      .from('enterprise-assets')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (!error) {
      const { data } = supabase.storage.from('enterprise-assets').getPublicUrl(path);
      updateAgentState('avatar_url', data.publicUrl);
    }
  };

  const handleArchiveAgent = async () => {
    if (!agent) return;
    if (!confirm('Archiver cet agent ? Il ne sera plus actif mais ses données sont conservées.')) return;
    await supabase.from('agents').update({ status: 'archived' }).eq('id', agent.id);
    router.push(`/admin/system/${id}/agents`);
  };

  const handleAddSkill = async () => {
    if (!agent || agentSkills.length >= maxSkills) return;
    const { data: newSkill } = await supabase
      .from('agent_skills')
      .insert({ agent_id: agent.id, enterprise_id: id, name: 'NOUVEAU SKILL', description: '', is_active: true })
      .select().single();
    if (newSkill) {
      setAgentSkills(prev => [...prev, newSkill]);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    await supabase.from('agent_skills').delete().eq('id', skillId);
    setAgentSkills(prev => prev.filter(s => s.id !== skillId));
  };

  const handleUpdateSkill = async (skillId: string, field: string, value: any) => {
    setAgentSkills(prev => prev.map(s => s.id === skillId ? { ...s, [field]: value } : s));
    await supabase.from('agent_skills').update({ [field]: value }).eq('id', skillId);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-white/5 border-t-[#10B981] rounded-full animate-spin" />
    </div>
  );

  if (!agent) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center text-white/20 uppercase font-black tracking-widest text-xs">
      Agent_Not_Found
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans selection:bg-[#10B981]/30">
      
      {/* ── PAGE HEADER ── */}
      <div className="sticky top-0 z-20 bg-[#080808]/95 backdrop-blur border-b border-white/5 px-8 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push(`/admin/system/${id}/agents`)}
              className="p-2 hover:bg-white/5 rounded-xl transition-all text-white/40 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[18px] font-black text-white uppercase tracking-tight">{agent.name}</h1>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                  agent.status === 'active'
                    ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                    : 'bg-white/5 text-white/30 border border-white/10'
                }`}>
                  {agent.status === 'active' ? '● ACTIVE' : '● STANDBY'}
                </span>
              </div>
              <p className="text-[10px] font-mono text-white/30 mt-0.5 uppercase tracking-widest">
                Node_Id: {agent.id.substring(0, 8)}... · {agent.primary_api}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button
                onClick={handleSaveAgent}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-2.5 bg-[#10B981] text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-[#0ea572] transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
              >
                {saving
                  ? <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  : saved
                    ? <><Check className="w-3.5 h-3.5" /> Sauvegardé</>
                    : <><Save className="w-3.5 h-3.5" /> Sauvegarder</>
                }
              </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-10">
        <div className="max-w-4xl mx-auto">
          
          <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            {/* TABS NAVIGATION */}
            <div className="flex items-center gap-1 px-8 py-4 border-b border-white/5 bg-[#0D0D0D]/50">
              {[
                { id: 'identite', label: 'Identité & Config', icon: Brain },
                { id: 'skills', label: 'Skills', icon: Zap },
                { id: 'performance', label: 'Performance', icon: BarChart2 },
              ].map(({ id: tabId, label, icon: Icon }) => (
                <button
                  key={tabId}
                  onClick={() => setCurrentTab(tabId as AgentTab)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    currentTab === tabId
                      ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                      : 'text-white/20 hover:text-white/50 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="min-h-[600px]">
              {/* ══ TAB : IDENTITÉ & CONFIG ══ */}
              {currentTab === 'identite' && (
                <div className="p-10 space-y-12">
                  {/* SECTION 1 — IDENTITÉ */}
                  <div className="space-y-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#10B981]/60">01 — Identité_Visuelle</p>
                    <div className="flex items-start gap-12">
                      <div className="flex flex-col items-center gap-4 flex-shrink-0">
                        <div
                          className="w-32 h-32 rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer group relative bg-[#0D0D0D] shadow-inner"
                          onClick={() => avatarRef.current?.click()}
                        >
                          {agent.avatar_url
                            ? <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            : <Cpu className="w-10 h-10 text-white/5" />
                          }
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-3xl">
                            <Upload className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <input
                          ref={avatarRef}
                          type="file" accept="image/*" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }}
                        />
                      </div>

                      <div className="flex-1 space-y-8">
                        <div className="space-y-3">
                          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Désignation Agent</label>
                          <input
                            type="text"
                            value={agent.name || ''}
                            onChange={(e) => updateAgentState('name', e.target.value)}
                            className="w-full bg-[#0D0D0D] border border-white/10 rounded-2xl px-6 py-5 text-[16px] font-black text-white uppercase tracking-wide focus:border-[#10B981]/40 outline-none transition-all shadow-inner"
                            placeholder="EX: NEURAL_OPERATOR_01"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">État Opérationnel</label>
                          <div className="flex gap-4">
                            {['active', 'standby'].map((s) => (
                              <button key={s}
                                onClick={() => updateAgentState('status', s)}
                                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                  agent.status === s
                                    ? s === 'active'
                                      ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                                      : 'bg-white/5 text-white/60 border-white/10'
                                    : 'bg-transparent text-white/10 border-white/5 hover:border-white/10 hover:text-white/30'
                                }`}>
                                {s === 'active' ? '● ONLINE' : '● STANDBY'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2 — INTELLIGENCE */}
                  <div className="space-y-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#10B981]/60">02 — Moteur_Intelligent</p>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Architecture Primaire</label>
                        <select
                          value={agent.primary_api || ''}
                          onChange={(e) => updateAgentState('primary_api', e.target.value)}
                          className="w-full bg-[#0D0D0D] border border-white/10 rounded-2xl px-6 py-5 text-[12px] font-mono text-white focus:border-[#10B981]/40 outline-none transition-all appearance-none cursor-pointer shadow-inner"
                        >
                          <option value="">Sélectionner une API</option>
                          {availableModels.map((m) => (
                            <option key={m.id} value={m.model_string}>
                              {m.name} — {m.provider}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Ligne de Repli (Fallback)</label>
                        <select
                          value={agent.fallback_chain?.[0] || ''}
                          onChange={(e) => updateAgentState('fallback_chain', e.target.value ? [e.target.value] : [])}
                          className="w-full bg-[#0D0D0D] border border-white/10 rounded-2xl px-6 py-5 text-[12px] font-mono text-white focus:border-[#10B981]/40 outline-none transition-all appearance-none cursor-pointer shadow-inner"
                        >
                          <option value="">Aucun fallback</option>
                          {availableModels.filter(m => m.model_string !== agent.primary_api).map((m) => (
                            <option key={m.id} value={m.model_string}>
                              {m.name} — {m.provider}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-6 bg-[#0D0D0D] p-8 rounded-3xl border border-white/5 shadow-inner">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Température Cognitive</label>
                          <p className="text-[8px] font-mono text-white/20 uppercase">Ajuste la créativité vs précision</p>
                        </div>
                        <span className="text-[20px] font-black text-[#10B981] font-mono">{Number(agent.temperature ?? 0.7).toFixed(1)}</span>
                      </div>
                      <input
                        type="range" min="0" max="1" step="0.1"
                        value={agent.temperature ?? 0.7}
                        onChange={(e) => updateAgentState('temperature', parseFloat(e.target.value))}
                        className="w-full accent-[#10B981] h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer transition-all"
                      />
                      <div className="flex justify-between text-[8px] font-mono text-white/20 uppercase tracking-widest">
                        <span>LITÉRAL</span>
                        <span>ÉQUILIBRÉ</span>
                        <span>CRÉATIF</span>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3 — SYSTEM PROMPT */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#10B981]/60">03 — Directive_Système</p>
                      <button
                        onClick={() => { setZoomContent(agent.system_prompt || ''); setZoom(true); }}
                        className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-[#10B981] transition-all flex items-center gap-1.5"
                      >
                        <BarChart2 className="w-3 h-3" /> Focus_Mode
                      </button>
                    </div>
                    <textarea
                      value={agent.system_prompt || ''}
                      onChange={(e) => updateAgentState('system_prompt', e.target.value)}
                      rows={12}
                      placeholder={`Tu es un agent spécialisé...\n\nTon protocole est...`}
                      className="w-full bg-[#0D0D0D] border border-white/10 rounded-3xl px-8 py-8 text-[13px] font-mono text-white/70 focus:border-[#10B981]/40 outline-none resize-none transition-all leading-relaxed shadow-inner scrollbar-hide"
                    />
                    <div className="flex justify-between text-[8px] font-mono text-white/20 uppercase tracking-widest">
                      <span>{(agent.system_prompt || '').length} Caractères détectés</span>
                      <span>Optimisation: Green_Zone</span>
                    </div>
                  </div>

                  {/* ACTIONS DÉLÉTÈRES */}
                  <div className="pt-10 border-t border-white/5 flex justify-start">
                    <button
                      onClick={handleArchiveAgent}
                      className="flex items-center gap-3 px-6 py-4 border border-red-500/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500/30 hover:text-red-500 hover:border-red-500/40 transition-all bg-red-500/[0.02]"
                    >
                      <Trash2 className="w-4 h-4" />
                      Désactiver & Archiver l'agent
                    </button>
                  </div>
                </div>
              )}

              {/* ══ TAB : SKILLS ══ */}
              {currentTab === 'skills' && (
                <div className="p-10 space-y-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#10B981]/60 mb-2">Compétences_Lattice</p>
                      <p className="text-[11px] font-black text-white/40 uppercase tracking-widest">{agentSkills.length} / {maxSkills} Modules actifs</p>
                    </div>
                    {agentSkills.length < maxSkills && (
                      <button
                        onClick={handleAddSkill}
                        className="flex items-center gap-3 px-6 py-3 bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-[#10B981]/20 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        Injecter module
                      </button>
                    )}
                  </div>

                  {agentSkills.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center text-center border border-dashed border-white/5 rounded-3xl space-y-4 bg-white/[0.01]">
                      <Zap className="w-12 h-12 text-white/5" />
                      <p className="text-[12px] font-black text-white/20 uppercase tracking-[0.3em]">Neural_Skill_Void</p>
                      <p className="text-[9px] font-mono text-white/10 uppercase tracking-widest">L'agent opère en protocole de base uniquement</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {agentSkills.map((skill) => (
                        <div key={skill.id} className="bg-[#0D0D0D] border border-white/5 rounded-2xl p-8 space-y-6 group hover:border-[#10B981]/20 transition-all shadow-inner">
                          <div className="flex items-center justify-between gap-6">
                            <input
                              type="text"
                              value={skill.name || ''}
                              onChange={(e) => handleUpdateSkill(skill.id, 'name', e.target.value)}
                              className="flex-1 bg-transparent border-b border-white/10 pb-2 text-[14px] font-black text-white uppercase tracking-wide focus:border-[#10B981]/40 outline-none transition-all"
                              placeholder="NOM DU SKILL"
                            />
                            <div className="flex items-center gap-6 flex-shrink-0">
                              <button
                                onClick={() => handleUpdateSkill(skill.id, 'is_active', !skill.is_active)}
                                className={`relative w-12 h-6 rounded-full transition-all ${skill.is_active ? 'bg-[#10B981]' : 'bg-white/5'}`}
                              >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${skill.is_active ? 'left-7' : 'left-1'}`} />
                              </button>
                              <button
                                onClick={() => handleDeleteSkill(skill.id)}
                                className="text-white/10 hover:text-red-500 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <textarea
                            value={skill.description || ''}
                            onChange={(e) => handleUpdateSkill(skill.id, 'description', e.target.value)}
                            rows={3}
                            placeholder="Description logicielle du module..."
                            className="w-full bg-transparent border border-white/5 rounded-2xl px-6 py-4 text-[12px] font-mono text-white/40 focus:border-[#10B981]/20 outline-none resize-none transition-all leading-relaxed"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ══ TAB : PERFORMANCE ══ */}
              {currentTab === 'performance' && (
                <div className="p-10 space-y-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#10B981]/60">Analyse_Flux_Temp_Réel</p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* NEURAL LOAD */}
                    <div className="bg-[#0D0D0D] border border-white/5 rounded-3xl p-10 space-y-8 shadow-inner">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Charge_Moelle_Épinière</p>
                        <span className={`text-[32px] font-black font-mono tracking-tighter ${
                          (agent.neural_load || 0) >= 80 ? 'text-red-500' :
                          (agent.neural_load || 0) >= 50 ? 'text-[#F59E0B]' : 'text-[#10B981]'
                        }`}>{agent.neural_load || 0}%</span>
                      </div>
                      <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_currentColor]"
                          style={{
                            width: `${agent.neural_load || 0}%`,
                            backgroundColor: (agent.neural_load || 0) >= 80 ? '#EF4444' : (agent.neural_load || 0) >= 50 ? '#F59E0B' : '#10B981',
                            color: (agent.neural_load || 0) >= 80 ? '#EF4444' : (agent.neural_load || 0) >= 50 ? '#F59E0B' : '#10B981'
                          }}
                        />
                      </div>
                      <p className="text-[8px] font-mono text-white/10 uppercase tracking-widest text-center italic">Calculé sur la moyenne des 100 dernières itérations</p>
                    </div>

                    {/* STATS RAPIDES */}
                    <div className="grid grid-cols-1 gap-4">
                      {[
                        { label: 'Tâche_Actuelle', value: agent.current_task || 'En attente de transmission' },
                        { label: 'Uptime_Lattice', value: '99.98% operational' },
                        { label: 'Dernière_Synchro', value: agent.updated_at ? new Date(agent.updated_at).toLocaleTimeString() : '—' },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-[#0D0D0D] border border-white/5 rounded-2xl p-6 flex flex-col justify-center shadow-inner">
                          <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-2">{label}</p>
                          <p className="text-[12px] font-mono text-white/70 truncate">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                     {[
                        { label: 'Budget Tokens', value: `${(agent.token_budget || 0).toLocaleString()}` },
                        { label: 'Température', value: `${Number(agent.temperature ?? 0.7).toFixed(1)}` },
                        { label: 'Neural Protocols', value: `${agent.role_protocol || 'STANDARD'}` },
                        { label: 'Skills Injectés', value: `${agentSkills.length}` },
                     ].map(({ label, value }) => (
                        <div key={label} className="bg-[#080808] border border-white/5 rounded-2xl p-6 shadow-sm">
                          <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-2 truncate">{label}</p>
                          <p className="text-[16px] font-black text-white font-mono">{value}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── OVERLAY ZOOM SYSTEM PROMPT ── */}
      {zoom && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-12 backdrop-blur-xl"
          onClick={() => setZoom(false)}>
          <div className="bg-[#111] border border-white/10 rounded-3xl p-10 w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_10px_#10B981] animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Neural_Focus // System_Prompt_Deep_Edit</p>
              </div>
              <button onClick={() => setZoom(false)} className="p-2 hover:bg-white/5 rounded-xl transition-all text-white/20 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <textarea
              value={zoomContent}
              onChange={(e) => {
                setZoomContent(e.target.value);
                updateAgentState('system_prompt', e.target.value);
              }}
              className="flex-1 w-full bg-[#0D0D0D] border border-white/10 rounded-2xl px-10 py-10 text-[14px] font-mono text-white/80 focus:border-[#10B981]/40 outline-none resize-none leading-relaxed shadow-inner"
            />
            <div className="flex justify-between text-[9px] font-mono text-white/20 uppercase tracking-widest pt-4 border-t border-white/5">
              <span>Caractères: {zoomContent.length}</span>
              <span>Lattice_Sync: Standby</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
