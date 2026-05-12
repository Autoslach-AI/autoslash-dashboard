"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Plus, Lock, ChevronLeft,
  Upload, Save, Trash2, X, Brain,
  Check, Zap, BarChart2, BookOpen,
  Settings, Shield
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

const supabase = createClient();

type AgentTab = 'identite' | 'skills' | 'performance';

export default function SingleAgentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const agentId = params?.agentId as string;

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
  const [skills, setSkills] = useState<any[]>([]);
  const avatarRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!id || !agentId) return;
    async function fetchData() {
      // Fetch enterprise and plan
      const enterpriseRes = await fetch(`/api/admin/enterprise/${id}`);
      const { enterprise, planDef } = await enterpriseRes.json();
      setEnterprise(enterprise);
      setPlanDef(planDef);

      // Fetch specific agent
      const { data: agentData } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();
      
      if (!agentData) {
        router.push(`/admin/system/${id}/agents`);
        return;
      }
      setAgent(agentData);

      // Available models
      const { data: models } = await supabase
        .from('available_models')
        .select('*')
        .eq('is_active', true)
        .order('complexity');
      setAvailableModels(models || []);

      // Skills for this agent
      const { data: skillsData } = await supabase
        .from('agent_skills')
        .select('*')
        .eq('agent_id', agentId);
      setSkills(skillsData || []);

      setLoading(false);
    }
    fetchData();
  }, [id, agentId, router]);

  const maxSkills = planDef?.max_skills_per_agent ?? 0;

  const updateAgentField = (field: string, value: any) => {
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
    const ext = file.name.split('.').pop();
    const path = `agent-avatars/${agentId}.${ext}`;
    const { error } = await supabase.storage
      .from('enterprise-assets')
      .upload(path, file, { upsert: true, contentType: file.type });
    
    if (!error) {
      const { data } = supabase.storage.from('enterprise-assets').getPublicUrl(path);
      updateAgentField('avatar_url', data.publicUrl);
    }
  };

  const handleAddSkill = async () => {
    if (skills.length >= maxSkills && maxSkills > 0) return;
    const { data: newSkill } = await supabase
      .from('agent_skills')
      .insert({ agent_id: agentId, enterprise_id: id, name: 'NOUVEAU SKILL', description: '', is_active: true })
      .select().single();
    if (newSkill) {
      setSkills(prev => [...prev, newSkill]);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    await supabase.from('agent_skills').delete().eq('id', skillId);
    setSkills(prev => prev.filter(s => s.id !== skillId));
  };

  const handleUpdateSkill = async (skillId: string, field: string, value: any) => {
    setSkills(prev => prev.map(s => s.id === skillId ? { ...s, [field]: value } : s));
    await supabase.from('agent_skills').update({ [field]: value }).eq('id', skillId);
  };

  if (loading || !agent) return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-[#4ade80]/10 border-t-[#4ade80] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-[#4ade80]/30 selection:text-black">
      
      {/* ── HEADER ── */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 px-8 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link 
              href={`/admin/system/${id}/agents`}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black uppercase tracking-tight">{agent.name}</h1>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                  agent.status === 'active'
                    ? 'bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20'
                    : 'bg-white/5 text-white/30 border border-white/10'
                }`}>
                  {agent.status === 'active' ? '● NODE_ACTIVE' : '● STANDBY'}
                </span>
              </div>
              <p className="text-[10px] font-mono text-white/30 mt-1 uppercase tracking-widest">
                ID: {agentId} · {agent.primary_api} · Load: {agent.neural_load || 0}%
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleSaveAgent}
              disabled={saving}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
                saved 
                  ? 'bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20' 
                  : 'bg-[#4ade80] text-black hover:bg-[#3dbd6a] disabled:opacity-50'
              }`}
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : saved ? (
                <><Check className="w-3.5 h-3.5" /> Synchronisé</>
              ) : (
                <><Save className="w-3.5 h-3.5" /> Déployer_Mise_A_Jour</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-12">
        <div className="flex gap-12">
          
          {/* ── LEFT: NAVIGATION ── */}
          <div className="w-64 flex-shrink-0 space-y-2">
            {[
              { id: 'identite', label: 'Cœur_Neural', icon: Brain, desc: 'Identité & Intelligence' },
              { id: 'skills', label: 'Protocoles_Skills', icon: Zap, desc: 'Capacités opérationnelles' },
              { id: 'performance', label: 'Diagnostique_Load', icon: BarChart2, desc: 'Statistiques vitales' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as AgentTab)}
                className={`w-full text-left p-6 rounded-2xl border transition-all group ${
                  currentTab === tab.id
                    ? 'bg-white/5 border-white/10 text-white shadow-2xl'
                    : 'border-transparent text-white/20 hover:text-white/40 hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-4 mb-2">
                   <tab.icon className={`w-4 h-4 ${currentTab === tab.id ? 'text-[#4ade80]' : 'text-current opacity-30 group-hover:opacity-100'}`} />
                   <p className="text-[10px] font-black uppercase tracking-widest">{tab.label}</p>
                </div>
                <p className="text-[9px] font-mono opacity-40 group-hover:opacity-60 transition-all">{tab.desc}</p>
              </button>
            ))}
          </div>

          {/* ── RIGHT: CONTENT AREA ── */}
          <div className="flex-1 min-w-0">
            
            {/* ══ TAB : IDENTITÉ ══ */}
            {currentTab === 'identite' && (
              <div className="space-y-16">
                
                {/* CORE ASSET */}
                <div className="grid grid-cols-3 gap-12">
                   <div className="col-span-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#4ade80] mb-6">Neural_Matrix</p>
                      <div className="relative group">
                        <div 
                          className="aspect-square rounded-3xl border border-white/10 bg-[#0A0A0A] flex items-center justify-center overflow-hidden cursor-pointer group-hover:border-[#4ade80]/40 transition-all"
                          onClick={() => avatarRef.current?.click()}
                        >
                          {agent.avatar_url ? (
                            <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" />
                          ) : (
                            <Brain className="w-12 h-12 text-white/10" />
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center uppercase font-black text-[10px] tracking-widest">
                            Upload_Core
                          </div>
                        </div>
                        <input 
                          type="file" ref={avatarRef} className="hidden" accept="image/*"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }} 
                        />
                      </div>
                   </div>

                   <div className="col-span-2 space-y-8">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Nom_Identité</label>
                        <input 
                          type="text" 
                          value={agent.name} 
                          onChange={(e) => updateAgentField('name', e.target.value)}
                          className="w-full bg-[#0D0D0D] border border-white/5 rounded-2xl py-6 px-8 text-lg font-black uppercase tracking-tight focus:border-[#4ade80]/30 outline-none transition-all placeholder:text-white/5"
                          placeholder="AGENT_NAME_LATTICE"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Etat_Fonctionnel</label>
                        <div className="flex gap-4">
                          {['active', 'standby'].map((s) => (
                            <button
                              key={s}
                              onClick={() => updateAgentField('status', s)}
                              className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                agent.status === s 
                                  ? 'bg-[#4ade80]/10 border-[#4ade80]/30 text-[#4ade80] shadow-[0_0_20px_rgba(74,222,128,0.05)]'
                                  : 'bg-white/5 border-white/5 text-white/20 hover:border-white/10'
                              }`}
                            >
                              {s === 'active' ? 'Neural_Active' : 'Standby_Mode'}
                            </button>
                          ))}
                        </div>
                      </div>
                   </div>
                </div>

                {/* INTELLIGENCE CONFIG */}
                <div className="space-y-10">
                   <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#4ade80]">Signal_Intelligence</p>
                   
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">API_Principale</label>
                        <select 
                          value={agent.primary_api}
                          onChange={(e) => updateAgentField('primary_api', e.target.value)}
                          className="w-full bg-[#0D0D0D] border border-white/5 rounded-2xl py-5 px-6 font-mono text-[11px] text-white focus:border-[#4ade80]/30 outline-none transition-all appearance-none"
                        >
                          {availableModels.map(m => (
                            <option key={m.id} value={m.model_string}>{m.name} ({m.provider})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Neural_Temperature</label>
                        <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl py-5 px-6 flex items-center gap-6">
                           <input 
                              type="range" min="0" max="1" step="0.1" 
                              value={agent.temperature ?? 0.7}
                              onChange={(e) => updateAgentField('temperature', parseFloat(e.target.value))}
                              className="flex-1 accent-[#4ade80] h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
                           />
                           <span className="text-[12px] font-black text-[#4ade80] w-8">{Number(agent.temperature ?? 0.7).toFixed(1)}</span>
                        </div>
                      </div>
                   </div>
                </div>

                {/* PSYCHE_ENGINE / PROMPT */}
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#4ade80]">Psyche_Engine_Prompt</p>
                      <button 
                        onClick={() => { setZoom(true); setZoomContent(agent.system_prompt || ''); }}
                        className="text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-all underline underline-offset-4"
                      >
                         Expand_View
                      </button>
                   </div>
                   <textarea
                     value={agent.system_prompt || ''}
                     onChange={(e) => updateAgentField('system_prompt', e.target.value)}
                     rows={15}
                     className="w-full bg-[#0D0D0D] border border-white/5 rounded-3xl p-8 font-mono text-[11px] text-white/60 leading-relaxed focus:border-[#4ade80]/30 outline-none transition-all"
                     placeholder="Définir le cœur algorithmique de l'agent..."
                   />
                </div>
              </div>
            )}

            {/* ══ TAB : SKILLS ══ */}
            {currentTab === 'skills' && (
              <div className="space-y-12">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4ade80]">Neural_Protocols</p>
                    <p className="text-[9px] font-mono text-white/30 mt-2">{skills.length} / {maxSkills} SLOTS_USED</p>
                  </div>
                  {skills.length < maxSkills && (
                    <button
                      onClick={handleAddSkill}
                      className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-[#4ade80] hover:border-[#4ade80]/40 transition-all"
                    >
                      Install_New_Protocol
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {skills.map((skill) => (
                    <div key={skill.id} className="bg-[#0D0D0D] border border-white/5 rounded-3xl p-8 transition-all hover:border-white/10 group">
                       <div className="flex items-center justify-between mb-6">
                          <input 
                            type="text" 
                            value={skill.name}
                            onChange={(e) => handleUpdateSkill(skill.id, 'name', e.target.value)}
                            className="bg-transparent text-sm font-black uppercase tracking-widest text-[#4ade80] outline-none border-b border-transparent focus:border-[#4ade80]/20 w-1/2"
                          />
                          <div className="flex items-center gap-6">
                             <button
                               onClick={() => handleUpdateSkill(skill.id, 'is_active', !skill.is_active)}
                               className={`w-12 h-6 rounded-full relative transition-all ${skill.is_active ? 'bg-[#4ade80]' : 'bg-white/5'}`}
                             >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-all ${skill.is_active ? 'left-7' : 'left-1'}`} />
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
                          value={skill.description}
                          onChange={(e) => handleUpdateSkill(skill.id, 'description', e.target.value)}
                          className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 font-mono text-[10px] text-white/40 leading-relaxed focus:text-white/70 outline-none transition-all resize-none"
                          rows={3}
                          placeholder="Protocol documentation..."
                       />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ TAB : PERFORMANCE ══ */}
            {currentTab === 'performance' && (
              <div className="space-y-12">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4ade80]">Neural_Metrics</p>
                 
                 <div className="bg-[#0D0D0D] border border-white/5 rounded-3xl p-10 space-y-8">
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Cycle_Load</p>
                          <p className="text-4xl font-black text-white">{agent.neural_load || 0}<span className="text-[#4ade80]">%</span></p>
                       </div>
                       <div className="w-24 h-24 relative">
                          <svg className="w-full h-full -rotate-90">
                             <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                             <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * (agent.neural_load || 0) / 100)} className="text-[#4ade80] transition-all duration-1000" />
                          </svg>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-px bg-white/5 overflow-hidden rounded-2xl border border-white/5">
                       {[
                         { label: 'Latency_Ms', value: '142ms' },
                         { label: 'Token_Burn', value: '4.2k / min' },
                         { label: 'Uptime', value: '99.9%' },
                         { label: 'Connections', value: '1,024' }
                       ].map(stat => (
                         <div key={stat.label} className="bg-[#080808] p-8">
                            <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-2">{stat.label}</p>
                            <p className="text-lg font-black font-mono text-white/80">{stat.value}</p>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="p-8 border border-dashed border-white/10 rounded-3xl flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-[#4ade80]/10 flex items-center justify-center text-[#4ade80]">
                       <Settings className="w-6 h-6 animate-spin-slow" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Auto_Scaling_Enabled</p>
                       <p className="text-[9px] font-mono text-white/20 mt-1">L'agent augmente dynamiquement ses ressources en cas de pic de tokens.</p>
                    </div>
                 </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── ZOOM MODAL ── */}
      {zoom && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-12">
           <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setZoom(false)} />
           <div className="relative w-full max-w-5xl h-full bg-[#0D0D0D] border border-white/10 rounded-3xl flex flex-col p-8 overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#4ade80]">Psyche_Primary_Lattice</p>
                 <button onClick={() => setZoom(false)} className="text-white/20 hover:text-white transition-all"><X /></button>
              </div>
              <textarea 
                value={zoomContent}
                onChange={(e) => {
                  setZoomContent(e.target.value);
                  updateAgentField('system_prompt', e.target.value);
                }}
                className="flex-1 w-full bg-black/40 border border-white/5 rounded-2xl p-12 font-mono text-xs text-white/70 leading-relaxed outline-none focus:border-[#4ade80]/20 transition-all resize-none"
              />
           </div>
        </div>
      )}

    </div>
  );
}
