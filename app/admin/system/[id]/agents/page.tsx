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
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchData() {
      const res = await fetch(`/api/admin/enterprise/${id}`);
      const { enterprise: ent, agents: agentsData, planDef: pd } = await res.json();
      setEnterprise(ent);
      setAgents(agentsData || []);
      setPlanDef(pd);

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

  const handleDeployAgent = async () => {
    if (activeAgents.length >= maxAgents && maxAgents !== 99) return;
    setDeploying(true);
    const { data: newAgent, error } = await supabase
      .from('agents')
      .insert({
        enterprise_id: id,
        name: 'NOUVEL AGENT',
        status: 'standby',
        temperature: 0.7,
        token_budget: 50000,
        system_prompt: '',
        neural_load: 0,
        model_config: { kb_access: false }
      })
      .select()
      .single();

    if (!error && newAgent) {
      router.push(`/admin/system/${id}/agent/${newAgent.id}`);
    }
    setDeploying(false);
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
            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-white/40">
              {enterprise?.package_type || 'PLAN'}
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

          {/* ── FLEET OVERVIEW ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#111] border border-white/5 rounded-2xl p-8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-[#10B981]" />
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Neural Capacity</h3>
                </div>
                <div>
                  <p className="text-3xl font-black text-white">{activeAgents.length} / {maxAgents === 99 ? '∞' : maxAgents}</p>
                  <p className="text-[9px] font-mono text-white/20 uppercase mt-1">Nodes Deployed</p>
                </div>
            </div>
            <div className="bg-[#111] border border-white/5 rounded-2xl p-8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-blue-500" />
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Fleet Pulse</h3>
                </div>
                <div>
                  <p className="text-3xl font-black text-white">{activeAgents.filter(a => a.status === 'active').length}</p>
                  <p className="text-[9px] font-mono text-white/20 uppercase mt-1">Active Neural Links</p>
                </div>
            </div>
          </div>

          {/* ── SELECTION GUIDE ── */}
          <div className="bg-[#111]/40 border border-white/5 rounded-3xl p-12 text-center space-y-8">
            <div className="relative inline-block">
               <Brain className="w-16 h-16 text-white/5 mx-auto" />
               <div className="absolute top-0 right-0 w-3 h-3 bg-[#10B981] rounded-full animate-ping" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Command_Center</h2>
              <p className="text-xs text-white/30 font-mono max-w-sm mx-auto leading-relaxed uppercase">
                Utilisez le <span className="text-[#10B981]">Double Ruban Intelligent</span> à gauche pour accéder à la configuration neuronale de chaque agent.
              </p>
            </div>
            <div className="pt-4 flex justify-center gap-4">
               {activeAgents.length < maxAgents && (
                 <button
                   onClick={handleDeployAgent}
                   disabled={deploying}
                   className="px-8 py-3 bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-[#10B981]/20 transition-all flex items-center gap-3"
                 >
                   <Plus className="w-4 h-4" /> Deploy_New_Agent
                 </button>
               )}
            </div>
          </div>

          {/* ── AGENTS SUMMARY ── */}
          <div className="space-y-4 pt-10 border-t border-white/5">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Active_Registry</h3>
              <span className="text-[9px] font-mono text-white/10 italic">Lattice_Sync: Operational</span>
            </div>
            {activeAgents.map((agent) => (
              <div 
                key={agent.id}
                onClick={() => router.push(`/admin/system/${id}/agent/${agent.id}`)}
                className="group flex items-center gap-5 px-6 py-4 bg-[#111] border border-white/5 rounded-2xl cursor-pointer hover:border-[#10B981]/30 transition-all"
              >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-[#10B981] transition-colors">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[12px] font-black text-white uppercase tracking-wide">{agent.name}</p>
                    <p className="text-[9px] font-mono text-white/20 uppercase mt-0.5">{agent.primary_api || 'Base_Protocol'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'active' ? 'bg-[#10B981]' : 'bg-white/10'}`} />
                    <ChevronDown className="w-4 h-4 text-white/10 -rotate-90 group-hover:translate-x-1 group-hover:text-[#10B981] transition-all" />
                  </div>
              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  );
}
