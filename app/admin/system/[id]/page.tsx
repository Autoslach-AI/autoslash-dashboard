"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
const supabase = createClient();
import { 
  ChevronRight, 
  Activity,
  Brain, 
  ArrowLeft,
  X,
  Zap,
  Lock,
  LockIcon
} from 'lucide-react';

export default function ClientIsolatedSystemPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [booting, setBooting] = useState(true);
  const [clientData, setClientData] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [tasksStream, setTasksStream] = useState<any[]>([]);
  const [maxAgents, setMaxAgents] = useState<number>(0);

  const [activeTab, setActiveTab] = useState<'agents' | 'stream'>('agents');
  const [processingCount, setProcessingCount] = useState<number>(0);

  const fetchTasksStream = async () => {
    const { data } = await supabase
      .from('client_agent_tasks')
      .select('agent_id, task_type, task_description, complexity, api_used, status, started_at, output_summary')
      .eq('enterprise_id', id)
      .order('started_at', { ascending: false })
      .limit(10);
    if (data) setTasksStream(data);
  };

  const fetchProcessingCount = async () => {
    const { count } = await supabase
      .from('client_agent_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('enterprise_id', id)
      .eq('status', 'PROCESSING');
    setProcessingCount(count || 0);
  };

  useEffect(() => {
    async function fetchData() {
      const { data: entData } = await supabase
        .from('enterprises')
        .select('*, token_budget, total_tokens_consumed, last_event_text, last_event_at')
        .eq('id', id)
        .single();
      
      if (entData) {
        setClientData(entData);

        // Fetch max agents from plan_definitions
        const { data: planData } = await supabase
          .from('plan_definitions')
          .select('max_agents_allowed, next_plan_name')
          .eq('plan_name', entData.package_type)
          .maybeSingle();
        
        setMaxAgents(planData?.max_agents_allowed || 0);
        // Storing next plan in clientData for the locked card message
        setClientData((prev: any) => ({ ...prev, next_plan_name: planData?.next_plan_name }));
      }

      // Fetch agents
      const { data: agentsData } = await supabase
        .from('agents')
        .select('id, name, status, primary_api, neural_load, current_task')
        .eq('enterprise_id', id);
      
      setAgents(agentsData || []);

      setBooting(false);

      // Initial fetches
      fetchTasksStream();
      fetchProcessingCount();
    }

    fetchData();

    const interval = setInterval(() => {
      fetchTasksStream();
      fetchProcessingCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const getPlanColor = (plan: string) => {
    switch (plan?.toUpperCase()) {
      case 'STARTUP': return '#6B7280';
      case 'BUSINESS': return '#3B82F6';
      case 'ENTERPRISE': return '#10B981';
      case 'ELITE': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getHealthColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'STABLE': return '#10B981';
      case 'WARNING': return '#F59E0B';
      case 'CRITICAL': return '#EF4444';
      default: return '#10B981';
    }
  };

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).toUpperCase();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-FR').format(val || 0) + ' FCFA';
  };

  if (booting) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/5 border-t-[#10B981] rounded-full animate-spin" />
      </div>
    );
  }

  const tokenUsage = clientData?.token_budget ? (clientData.total_tokens_consumed / clientData.token_budget) * 100 : 0;
  const tokenColor = tokenUsage >= 90 ? '#EF4444' : tokenUsage >= 75 ? '#F59E0B' : '#10B981';

  return (
    <div className="min-h-screen bg-[#080808] text-[#e0e0e0] font-sans">
      {/* COMPACT HEADER */}
      <header className="h-[80px] bg-[#080808] border-b border-[#1a1a1a] flex items-center px-6 justify-between transition-all duration-300">
        
        {/* LEFT SECTION */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.back()}
            className="w-9 h-9 bg-[#1a1a1a] border border-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all text-white/50 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-[#10B981]" />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-[#666] font-bold uppercase tracking-[0.2em] text-[8px]">
                <span>Integrated_Lattice</span>
                <ChevronRight className="w-2.5 h-2.5 text-white/10" />
                <span className="text-[#10B981]">Projet Entreprise</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black text-white uppercase tracking-tight">{clientData?.name || 'Neural Dynamics'}</h1>
                <div className="px-2 py-0.5 bg-[#10B981]/10 border border-[#10B981]/20 rounded-full">
                  <span className="text-[8px] font-black text-[#10B981] uppercase tracking-widest leading-none">
                    ACTIVE_DOMAIN: {clientData?.sector || 'NON DÉFINI'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-6">
          <nav className="flex items-center bg-[#111] p-1 rounded-lg border border-white/5">
            <button className="px-5 py-1.5 bg-[#1a1a1a] text-white rounded-md text-[9px] font-black uppercase tracking-widest shadow-lg">Neural Hub</button>
            <button className="px-5 py-1.5 text-white/20 hover:text-white/50 text-[9px] font-black uppercase tracking-widest transition-all">Telemetry</button>
            <button className="px-5 py-1.5 text-white/20 hover:text-white/50 text-[9px] font-black uppercase tracking-widest transition-all">Security</button>
          </nav>
          
          <button 
            onClick={() => router.push('/admin')}
            className="h-10 px-6 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-[#10B981] hover:border-[#10B981]/40 transition-all flex items-center gap-2"
          >
            Exit
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* STATS SECTION */}
      <div className="grid grid-cols-4 bg-[#1a1a1a] gap-[1px] border-b border-[#1a1a1a]">
        {/* CARD 1: PLAN & FACTURATION */}
        <div className="bg-[#0A0A0A] p-[28px] relative group overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6B7280]">PLAN & FACTURATION</h3>
            <div className="flex items-center gap-1.5 animate-pulse">
              <span className="text-[9px] font-bold text-[#10B981] tracking-widest">⟳ LIVE</span>
            </div>
          </div>
          <p className="text-[32px] font-extrabold leading-none mb-2" style={{ color: getPlanColor(clientData?.package_type) }}>
            {clientData?.package_type || 'BUSINESS'}
          </p>
          <p className="text-[12px] font-bold text-white/60 mb-8 uppercase tracking-widest">
            {formatCurrency(clientData?.monthly_cost)}
          </p>
          <p className="text-[10px] font-mono text-[#4B5563] uppercase tracking-tight">
            {clientData?.status === 'PROSPECT' ? 'CLIENT NON ACTIVÉ' : `ACTIF DEPUIS ${formatDateShort(clientData?.activated_at) || 'INCONNU'}`}
          </p>
        </div>

        {/* CARD 2: TOKEN USAGE */}
        <div className="bg-[#0A0A0A] p-[28px] relative group overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6B7280]">TOKEN USAGE</h3>
            <div className="flex items-center gap-1.5 animate-pulse duration-[3000ms]">
              <span className="text-[9px] font-bold text-[#10B981] tracking-widest">⟳ LIVE</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-[32px] font-extrabold leading-none" style={{ color: tokenColor }}>
              {Math.round(tokenUsage)}%
            </span>
          </div>
          <div className="h-[3px] w-full bg-white/5 rounded-full mb-4 overflow-hidden">
            <div 
              className="h-full transition-all duration-1000" 
              style={{ width: `${tokenUsage}%`, backgroundColor: tokenColor }} 
            />
          </div>
          <p className="text-[12px] font-bold text-white/60 mb-8 uppercase tracking-widest">
            {clientData?.total_tokens_consumed?.toLocaleString() || 0} / {clientData?.token_budget?.toLocaleString() || '1M'}
          </p>
          <p className="text-[10px] font-mono text-[#4B5563] uppercase tracking-tight">
            {clientData?.package_type === 'STARTUP' ? 'NON APPLICABLE — PLAN STARTUP' : 
             tokenUsage >= 90 ? 'DÉPASSEMENT IMMINENT' : 
             tokenUsage >= 75 ? 'SURVEILLANCE REQUISE' : 'CONSOMMATION NORMALE'}
          </p>
        </div>

        {/* CARD 3: SYSTEM HEALTH */}
        <div className="bg-[#0A0A0A] p-[28px] relative group overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6B7280]">SYSTEM HEALTH</h3>
            <div className="flex items-center gap-1.5 animate-pulse">
              <span className="text-[9px] font-bold text-[#10B981] tracking-widest">⟳ LIVE</span>
            </div>
          </div>
          <p className="text-[32px] font-extrabold leading-none mb-2" style={{ color: getHealthColor(clientData?.status) }}>
            {clientData?.status || 'UNKNOWN'}
          </p>
          <p className="text-[12px] font-bold text-white/60 mb-8 uppercase tracking-widest">
            RÉGION: {clientData?.region || 'FRANCE_SOUTH'}
          </p>
          <p className="text-[10px] font-mono text-[#4B5563] uppercase tracking-tight">
            {clientData?.status === 'STABLE' || clientData?.status === 'ACTIVE' ? 'TOUS SYSTÈMES NOMINAUX' : 
             clientData?.status === 'WARNING' ? 'ANOMALIE DÉTECTÉE — VÉRIFIER AGENTS' : 
             clientData?.status === 'CRITICAL' ? 'INTERVENTION REQUISE' : 'SYSTÈME EN ATTENTE'}
          </p>
        </div>

        {/* CARD 4: DERNIÈRE ACTIVITÉ */}
        <div className="bg-[#0A0A0A] p-[28px] relative group overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6B7280]">DERNIÈRE ACTIVITÉ</h3>
            <div className="flex items-center gap-1.5 animate-pulse duration-[3000ms]">
              <span className="text-[9px] font-bold text-[#10B981] tracking-widest">⟳ LIVE</span>
            </div>
          </div>
          <p className="text-[32px] font-extrabold leading-none mb-2 text-white">
            {formatDateShort(clientData?.last_event_at) || 'N/A'}
          </p>
          <p className="text-[12px] font-bold text-white/60 mb-8 uppercase tracking-widest truncate">
            {clientData?.last_event_text || 'AUCUNE ACTIVITÉ RÉCENTE'}
          </p>
          <p className="text-[10px] font-mono text-[#4B5563] uppercase tracking-tight">
            {!clientData?.last_event_at ? 'AUCUNE ACTIVITÉ — AGENTS EN ATTENTE' : 
             (new Date().getTime() - new Date(clientData.last_event_at).getTime()) > 7 * 24 * 60 * 60 * 1000 ? 
             'INACTIVITÉ DÉTECTÉE' : 'ACTIVITÉ RÉCENTE'}
          </p>
        </div>
      </div>

      {/* SECTION 2: AGENT COMMAND CENTER & STREAM */}
      <div className="bg-[#080808] border-b border-[#1a1a1a] p-[28px] lg:p-[32px]">
        {/* SECTION HEADER WITH TABS */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <span className="text-white">⚡</span>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9CA3AF]">AGENT COMMAND CENTER</h2>
          </div>
          
          <div className="flex items-center gap-1 bg-[#0a0a0a] p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setActiveTab('agents')}
              className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'agents' ? 'bg-[#1a1a1a] text-white border-b-2 border-[#10B981]' : 'text-[#6B7280] hover:text-white/60'}`}
            >
              AGENTS
            </button>
            <button 
              onClick={() => setActiveTab('stream')}
              className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all relative ${activeTab === 'stream' ? 'bg-[#1a1a1a] text-white border-b-2 border-[#10B981]' : 'text-[#6B7280] hover:text-white/60'}`}
            >
              STREAM
              {processingCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#10B981] rounded-full flex items-center justify-center border-2 border-[#0a0a0a]">
                  <span className="text-[8px] font-black text-white">{processingCount}</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* TAB CONTENT: AGENTS */}
        {activeTab === 'agents' && (
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            <div className="grid grid-cols-2 gap-px bg-[#1a1a1a] border border-[#1a1a1a] rounded-xl overflow-hidden">
              {Array.from({ length: Math.max(agents.length, maxAgents, 4) }).map((_, i) => {
                const slotIndex = i + 1;
                const agent = agents[i];
                
                // Agent exists
                if (agent) {
                  const neuralLoad = agent.neural_load || 0;
                  const loadColor = neuralLoad <= 50 ? '#10B981' : neuralLoad <= 80 ? '#F59E0B' : '#EF4444';
                  
                  return (
                    <div key={agent.id} className="bg-[#0A0A0A] p-[28px] hover:bg-[#0c0c0c] transition-all group/agent border border-white/5">
                      <div className="flex justify-between items-start mb-6">
                        <span className="text-[9px] font-mono text-[#6B7280] uppercase tracking-widest">[{agent.name.replace(/\s+/g, '_').toUpperCase()}]</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black border border-white/5">
                          <div className={`w-1.5 h-1.5 rounded-full ${agent.status?.toLowerCase() === 'active' ? 'bg-[#10B981]' : 'bg-[#6B7280]'}`} />
                          <span className={`text-[8px] font-bold uppercase tracking-widest ${agent.status?.toLowerCase() === 'active' ? 'text-[#10B981]' : 'text-[#6B7280]'}`}>
                            ● {agent.status?.toLowerCase() === 'active' ? 'ACTIVE' : 'STANDBY'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mb-8">
                        <h4 className="text-[18px] font-black text-white uppercase tracking-tighter mb-1">{agent.name}</h4>
                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">{agent.primary_api || 'LLM_UNIT'}</p>
                      </div>

                      <div className="space-y-2 mb-8">
                        <div className="flex justify-between text-[8px] font-bold text-[#6B7280] uppercase tracking-widest font-mono">
                          <span>NEURAL_LOAD</span>
                          <span style={{ color: loadColor }}>{neuralLoad}%</span>
                        </div>
                        <div className="h-[3px] w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full transition-all duration-1000" 
                            style={{ width: `${neuralLoad}%`, backgroundColor: loadColor }} 
                          />
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/5">
                        <p className="text-[9px] font-mono text-[#4B5563] uppercase tracking-tight line-clamp-1">
                          {agent.current_task || 'EN ATTENTE DE MISSION'}
                        </p>
                      </div>
                    </div>
                  );
                }

                // Slot authorized but empty
                if (slotIndex <= maxAgents) {
                  return (
                    <div key={`empty-${slotIndex}`} className="bg-[#0D0D0D] h-[280px] border border-dashed border-[#10B981]/30 flex flex-col items-center justify-center p-8 text-center group/config cursor-pointer hover:bg-[#10B981]/5 transition-all">
                      <div className="w-12 h-12 rounded-full bg-[#10B981]/10 flex items-center justify-center mb-4 group-hover/config:scale-110 transition-transform text-[#10B981]">
                        <span className="text-xl">+</span>
                      </div>
                      <h4 className="text-[10px] font-bold text-[#10B981] uppercase tracking-[0.2em] mb-2 font-mono">SLOT DISPONIBLE</h4>
                      <p className="text-[9px] font-mono text-[#4B5563] uppercase tracking-tight mb-4">AUCUN AGENT CONFIGURÉ</p>
                      <button className="text-[10px] font-black text-[#10B981] uppercase tracking-[0.2em] px-4 py-2 border border-[#10B981]/20 rounded-lg hover:bg-[#10B981] hover:text-black transition-all">
                        + CONFIGURER CET AGENT
                      </button>
                    </div>
                  );
                }

                // Slot locked
                return (
                  <div key={`locked-${slotIndex}`} className="bg-[#0D0D0D] h-[280px] border border-dashed border-[#2A2A2A] flex flex-col items-center justify-center p-8 text-center group/lock opacity-50">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-4 text-[#6B7280]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">SLOT VERROUILLÉ</h4>
                    <p className="text-[9px] font-mono text-[#4B5563] uppercase tracking-tight">
                      Upgrade vers {clientData?.next_plan_name || 'LE PLAN SUPÉRIEUR'} pour débloquer
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB CONTENT: STREAM */}
        {activeTab === 'stream' && (
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-2 space-y-4">
            {clientData?.package_type === 'STARTUP' ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-center p-8 border border-white/5 rounded-xl bg-[#0a0a0a]">
                <Lock className="w-10 h-10 mb-4 text-[#4B5563]" />
                <span className="text-[11px] font-mono text-[#4B5563] uppercase tracking-widest leading-loose">
                  🔒 LIVE STREAM NON DISPONIBLE — AUCUN AGENT DÉPLOYÉ
                </span>
              </div>
            ) : tasksStream.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-center p-8 border border-white/5 rounded-xl bg-[#0a0a0a]">
                <span className="text-[11px] font-mono text-[#4B5563] uppercase tracking-widest">
                  FLUX VIDE — EN ATTENTE D'ACTIVITÉ AGENT
                </span>
              </div>
            ) : (
              tasksStream.map((task, i) => {
                const agentName = agents.find(a => a.id === task.agent_id)?.name || 'SYSTEM';
                return (
                  <div key={task.id || i} className="p-6 bg-[#0a0a0a] border border-white/5 rounded-xl group/stream-item hover:border-white/10 transition-all">
                    <div className="flex gap-4 mb-3">
                      <span className="text-[10px] font-mono text-[#10B981] tabular-nums whitespace-nowrap bg-[#10B981]/5 px-2 py-0.5 rounded border border-[#10B981]/10">
                        [{new Date(task.started_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}]
                      </span>
                      <p className="text-[13px] text-white/90 font-medium tracking-tight h-fit">
                        <span className="font-black text-[#10B981] mr-2 uppercase">{agentName}</span>
                        <span className="text-white/40 mr-2">→</span>
                        {task.task_description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black rounded border border-white/5">
                        <span className="text-[8px] font-mono text-[#4B5563] uppercase tracking-widest">TYPE:</span>
                        <span className="text-[8px] font-black text-white/60 uppercase">{task.task_type || 'GENERIC'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black rounded border border-white/5">
                        <span className="text-[8px] font-mono text-[#4B5563] uppercase tracking-widest">COMPLEXITY:</span>
                        <span className="text-[8px] font-black text-white/60 uppercase">{task.complexity || 'LOW'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black rounded border border-white/5">
                        <span className="text-[8px] font-mono text-[#4B5563] uppercase tracking-widest">API:</span>
                        <span className="text-[8px] font-black text-white/60 uppercase">{task.api_used || 'AUTO'}</span>
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        task.status === 'COMPLETED' ? 'bg-[#10B981]/10 text-[#10B981]' : 
                        task.status === 'PROCESSING' ? 'bg-[#3B82F6]/10 text-[#3B82F6] animate-pulse' : 
                        'bg-[#F59E0B]/10 text-[#F59E0B]'
                      }`}>
                        {task.status}
                      </div>
                    </div>
                    {task.output_summary && (
                      <div className="pt-3 border-t border-white/[0.03]">
                        <p className="text-[11px] text-white/30 leading-relaxed italic line-clamp-2">
                          "{task.output_summary}"
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
