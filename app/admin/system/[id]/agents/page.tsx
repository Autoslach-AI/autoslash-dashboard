"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, Lock, ChevronDown, ChevronUp, ChevronRight,
  Upload, Save, Trash2, X, Brain,
  Check, Zap, BarChart2, BookOpen,
  Shield
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
const supabase = createClient();

type AgentTab = 'identite' | 'skills' | 'performance';

export default function AgentsPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id as string;
  const router = useRouter();

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
      const { enterprise, agents: agentsData, planDef } = await res.json();
      setEnterprise(enterprise);
      setAgents(agentsData || []);
      setPlanDef(planDef);

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
      router.push(`/admin/system/${id}/agents/${newAgent.id}`);
    }
    setDeploying(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-[#4ade80]/10 border-t-[#4ade80] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-[#4ade80]/30 selection:text-black">

      {/* ── CONSOLE HEADER ── */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5 px-12 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-[#4ade80]/10 border border-[#4ade80]/20 flex items-center justify-center text-[#4ade80]">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">Fleet_Console</h1>
              <p className="text-[10px] font-mono text-white/30 mt-1 uppercase tracking-widest">
                {activeAgents.length} / {maxAgents === 99 ? '∞' : maxAgents} neural_nodes_deployed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <span className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 bg-white/5">
                LEVEL: {enterprise?.package_type}
             </span>
             {maxAgents > 0 && activeAgents.length < maxAgents && (
               <button
                 onClick={handleDeployAgent}
                 disabled={deploying}
                 className="flex items-center gap-2 px-8 py-3 bg-[#4ade80] text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-[#3dbd6a] transition-all disabled:opacity-40"
               >
                 {deploying ? (
                   <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                 ) : (
                   <><Plus className="w-3.5 h-3.5" /> Initialize_New_Node</>
                 )}
               </button>
             )}
          </div>
        </div>
      </div>

      <div className="p-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* EMPTY STATE / PLAN LOCK */}
          {maxAgents === 0 && (
            <div className="col-span-full border border-dashed border-white/10 rounded-3xl p-32 flex flex-col items-center justify-center text-center opacity-40">
              <Lock className="w-12 h-12 mb-6" />
              <p className="text-xl font-black uppercase tracking-[0.3em] mb-4">Lattice_Locked</p>
              <p className="text-xs font-mono max-w-sm uppercase tracking-widest leading-loose">Upgrade system protocol to enable autonomous neural deployments</p>
            </div>
          )}

          {/* AGENT CARDS */}
          {activeAgents.map((agent) => (
            <Link 
              key={agent.id}
              href={`/admin/system/${id}/agents/${agent.id}`}
              className="group relative bg-[#0D0D0D] border border-white/5 rounded-3xl p-8 hover:border-[#4ade80]/40 transition-all hover:shadow-[0_0_50px_rgba(74,222,128,0.05)] overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#4ade80]/20 to-transparent opacity-0 group-hover:opacity-100 transition-all" />
              
              <div className="flex items-center gap-6 mb-8">
                <div className="w-16 h-16 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden bg-black flex-shrink-0">
                  {agent.avatar_url ? (
                    <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" />
                  ) : (
                    <Brain className="w-8 h-8 text-white/10" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-[#4ade80] transition-all truncate">{agent.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'active' ? 'bg-[#4ade80] animate-pulse' : 'bg-white/20'}`} />
                    <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">{agent.status === 'active' ? 'Active' : 'Standby'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-end border-b border-white/5 pb-2">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Neural_Load</span>
                    <span className="text-xs font-black font-mono text-white/60">{agent.neural_load || 0}%</span>
                 </div>
                 <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#4ade80]/40 group-hover:bg-[#4ade80] transition-all duration-700"
                      style={{ width: `${agent.neural_load || 0}%` }}
                    />
                 </div>
              </div>

              <div className="mt-8 flex items-center justify-between text-[8px] font-black uppercase tracking-widest">
                 <div className="px-3 py-1 bg-white/5 rounded-lg text-white/40">
                    {agent.primary_api?.split('-')[0]}
                 </div>
                 <div className="text-white/20 group-hover:text-white transition-all flex items-center gap-2">
                    Configure_Node <ChevronRight className="w-3 h-3" />
                 </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

