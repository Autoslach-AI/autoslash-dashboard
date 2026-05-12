"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { 
  Plus, Lock, ChevronDown, ChevronUp, ChevronRight,
  Upload, Save, Trash2, X, Brain,
  Check, Zap, BarChart2, BookOpen
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
const supabase = createClient();

type AgentTab = 'identite' | 'skills' | 'performance';

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
  const [agentSkills, setAgentSkills] = useState<Record<string, any[]>>({});
  const avatarRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!id) return;
    async function fetchData() {
      const res = await fetch(`/api/admin/enterprise/${id}`);
      const { enterprise, agents: agentsData, planDef } = await res.json();
      setEnterprise(enterprise);
      setAgents(agentsData || []);
      setPlanDef(planDef);

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

      // Skills par agent
      if (agentsData?.length) {
        const { data: skills } = await supabase
          .from('agent_skills')
          .select('*')
          .in('agent_id', agentsData.map((a: any) => a.id));
        
        const skillMap: Record<string, any[]> = {};
        (skills || []).forEach((s: any) => {
          if (!skillMap[s.agent_id]) skillMap[s.agent_id] = [];
          skillMap[s.agent_id].push(s);
        });
        setAgentSkills(skillMap);
      }

      setLoading(false);
    }
    fetchData();
  }, [id]);

  const maxAgents = enterprise?.max_agents_override ?? planDef?.max_agents_allowed ?? 0;
  const maxSkills = planDef?.max_skills_per_agent ?? 0;
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

  const handleAddSkill = async (agentId: string) => {
    const currentSkills = agentSkills[agentId] || [];
    if (currentSkills.length >= maxSkills) return;
    const { data: newSkill } = await supabase
      .from('agent_skills')
      .insert({ agent_id: agentId, enterprise_id: id, name: 'NOUVEAU SKILL', description: '', is_active: true })
      .select().single();
    if (newSkill) {
      setAgentSkills(prev => ({ ...prev, [agentId]: [...(prev[agentId] || []), newSkill] }));
    }
  };

  const handleDeleteSkill = async (agentId: string, skillId: string) => {
    await supabase.from('agent_skills').delete().eq('id', skillId);
    setAgentSkills(prev => ({ ...prev, [agentId]: (prev[agentId] || []).filter(s => s.id !== skillId) }));
  };

  const handleUpdateSkill = async (agentId: string, skillId: string, field: string, value: any) => {
    setAgentSkills(prev => ({
      ...prev,
      [agentId]: (prev[agentId] || []).map(s => s.id === skillId ? { ...s, [field]: value } : s)
    }));
    await supabase.from('agent_skills').update({ [field]: value }).eq('id', skillId);
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

      <div className="px-8 py-8">
        <div className="max-w-3xl mx-auto space-y-5">

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
            const skills = agentSkills[agent.id] || [];

            return (
              <div 
                key={agent.id} 
                className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:bg-white/[0.02] transition-all group"
                onClick={() => router.push(`/admin/system/${id}/agent/${agent.id}`)}
              >
                {/* CARTE HEADER */}
                <div className="flex items-center gap-5 px-6 py-5">
                  <div className="w-11 h-11 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 bg-[#0D0D0D]">
                    {agent.avatar_url
                      ? <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover" />
                      : <Brain className="w-5 h-5 text-white/20" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[13px] font-black text-white uppercase truncate">{agent.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex-shrink-0 ${
                        agent.status === 'active'
                          ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                          : 'bg-white/5 text-white/30 border border-white/10'
                      }`}>
                        {agent.status === 'active' ? '● ACTIVE' : '● STANDBY'}
                      </span>
                    </div>
                    <p className="text-[9px] font-mono text-white/30">
                      {agent.primary_api || 'API non configurée'} · {agent.neural_load || 0}% load · {skills.length} skills
                    </p>
                  </div>
                  <div className="text-white/20 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2">
                    <span className="text-[8px] font-black uppercase tracking-widest">Configurer</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </div>

      {/* ── OVERLAY ZOOM SYSTEM PROMPT ── */}
      {zoom && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
          onClick={() => setZoom(null)}>
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30">System Prompt — Vue complète</p>
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
              className="flex-1 w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-5 py-4 text-[12px] font-mono text-white/70 focus:border-[#10B981]/40 outline-none resize-none leading-relaxed"
            />
            <div className="flex justify-between text-[8px] font-mono text-white/20 mt-3 flex-shrink-0">
              <span>{zoomContent.length} caractères</span>
              <span>Recommandé : 500 — 2000 caractères</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
