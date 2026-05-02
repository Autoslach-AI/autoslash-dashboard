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
  const [lastTask, setLastTask] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [tasksStream, setTasksStream] = useState<any[]>([]);
  const [maxAgents, setMaxAgents] = useState<number>(0);

  const fetchTasksStream = async () => {
    const { data } = await supabase
      .from('agent_tasks')
      .select('*')
      .eq('enterprise_id', id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setTasksStream(data);
  };

  useEffect(() => {
    async function fetchData() {
      const { data: entData } = await supabase
        .from('enterprises')
        .select('*')
        .eq('id', id)
        .single();
      
      if (entData) {
        setClientData(entData);

        // Fetch max agents from plan_definitions
        const { data: planData } = await supabase
          .from('plan_definitions')
          .select('max_agents')
          .eq('plan_name', entData.package_type)
          .maybeSingle();
        
        setMaxAgents(planData?.max_agents || 0);
      }

      // Fetch agents
      const { data: agentsData } = await supabase
        .from('agents')
        .select('*')
        .eq('enterprise_id', id);
      
      setAgents(agentsData || []);

      const { data: taskData } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('enterprise_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setLastTask(taskData);
      setBooting(false);

      // Initial stream fetch
      fetchTasksStream();
    }

    fetchData();

    const interval = setInterval(fetchTasksStream, 5000);
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

  const tokenUsage = clientData?.tokens_limit ? (clientData.tokens_used / clientData.tokens_limit) * 100 : 0;
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
                    ACTIVE_DOMAIN: {clientData?.industry || 'UNSPECIFIED'}
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
            {clientData?.tokens_used?.toLocaleString() || 0} / {clientData?.tokens_limit?.toLocaleString() || '1M'}
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
            {clientData?.status === 'PROSPECT' ? 'INACTIVE' : 'STABLE'}
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
            {formatDateShort(lastTask?.created_at) || 'N/A'}
          </p>
          <p className="text-[12px] font-bold text-white/60 mb-8 uppercase tracking-widest truncate">
            {lastTask?.task_name || 'AUCUNE TÂCHE RÉCURRENTE'}
          </p>
          <p className="text-[10px] font-mono text-[#4B5563] uppercase tracking-tight">
            {!lastTask ? 'AUCUNE ACTIVITÉ — AGENTS EN ATTENTE' : 
             (new Date().getTime() - new Date(lastTask.created_at).getTime()) > 7 * 24 * 60 * 60 * 1000 ? 
             'INACTIVITÉ DÉTECTÉE' : 'ACTIVITÉ RÉCENTE'}
          </p>
        </div>
      </div>

      {/* SECTION 2: AGENT COMMAND CENTER & LIVE THOUGHT STREAM */}
      <div className="grid grid-cols-[1fr_350px] lg:grid-cols-[1fr_450px] bg-[#080808] min-h-[600px]">
        {/* LEFT COLUMN: AGENT COMMAND CENTER */}
        <div className="p-[28px] lg:p-[32px] border-r border-[#1a1a1a]">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
              <span className="text-white">⚡</span>
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9CA3AF]">AGENT COMMAND CENTER</h2>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-black border border-white/5 rounded-full">
              <div className={`w-1.5 h-1.5 rounded-full ${agents.length > 0 ? 'bg-[#10B981] animate-pulse' : 'bg-[#6B7280]'}`} />
              <span className={`text-[9px] font-bold uppercase tracking-widest ${agents.length > 0 ? 'text-[#10B981]' : 'text-[#6B7280]'}`}>
                {agents.length > 0 ? 'UNITS ACTIVE' : 'STANDBY'}
              </span>
            </div>
          </div>

          {clientData?.package_type === 'STARTUP' ? (
            <div className="grid grid-cols-2 gap-[1px] bg-[#1a1a1a] border border-[#1a1a1a] rounded-xl overflow-hidden relative">
              {[1, 2].map(i => (
                <div key={i} className="bg-[#0D0D0D] h-[280px] border border-dashed border-[#2A2A2A] flex flex-col items-center justify-center p-8 text-center group/lock">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover/lock:scale-110 transition-transform duration-500">
                    <Lock className="w-5 h-5 text-white/20" />
                  </div>
                  <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-2">SLOT DISPONIBLE</h4>
                  <p className="text-[9px] font-mono text-[#4B5563] uppercase tracking-tight max-w-[180px]">
                    🔒 AUCUN AGENT — PLAN STARTUP
                  </p>
                </div>
              ))}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-10">
                <button className="px-8 py-3 bg-[#10B981] text-black font-black text-[11px] uppercase tracking-[0.2em] rounded-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  UPGRADER LE PLAN
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-[1px] bg-[#1a1a1a] border border-[#1a1a1a] rounded-xl overflow-hidden">
              {Array.from({ length: Math.max(agents.length, maxAgents || 2) }).map((_, i) => {
                const agent = agents[i];
                if (agent) {
                  const neuralLoad = Math.floor(Math.random() * 100); // Simulated live load or map from agent if available
                  const loadColor = neuralLoad <= 50 ? '#10B981' : neuralLoad <= 80 ? '#F59E0B' : '#EF4444';
                  
                  return (
                    <div key={agent.id} className="bg-[#0A0A0A] p-[28px] hover:bg-[#0c0c0c] transition-all group/agent">
                      <div className="flex justify-between items-start mb-6">
                        <span className="text-[9px] font-mono text-[#6B7280] uppercase tracking-widest">[{agent.agent_type || 'AGENT_UNIT'}]</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black border border-white/5">
                          <div className={`w-1 h-1 rounded-full ${agent.status === 'ACTIVE' ? 'bg-[#10B981]' : agent.status === 'ERROR' ? 'bg-[#EF4444]' : 'bg-[#6B7280]'}`} />
                          <span className={`text-[8px] font-bold uppercase tracking-widest ${agent.status === 'ACTIVE' ? 'text-[#10B981]' : agent.status === 'ERROR' ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
                            ● {agent.status || 'IDLE'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mb-8">
                        <h4 className="text-[18px] font-black text-white uppercase tracking-tighter mb-1">{agent.name}</h4>
                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">{agent.model_config?.model || 'GEMINI-2.0-FLASH'}</p>
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
                          {agent.last_task_desc || 'EN ATTENTE DE MISSION'}
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={`empty-${i}`} className="bg-[#0D0D0D] h-[280px] border border-dashed border-[#2A2A2A] flex flex-col items-center justify-center p-8 text-center group/lock">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/10 group-hover/lock:text-white/30 transition-all">
                      <LockIcon className="w-4 h-4" />
                    </div>
                    <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">SLOT DISPONIBLE</h4>
                    <p className="text-[9px] font-mono text-[#4B5563] uppercase tracking-tight">
                      Upgrade vers {clientData?.package_type === 'BUSINESS' ? 'ENTERPRISE' : 'ELITE'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE THOUGHT STREAM */}
        <div className="p-[28px] lg:p-[32px] flex flex-col h-full bg-[#080808]">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-2 group/stream cursor-pointer">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9CA3AF] group-hover/stream:text-white transition-colors">LIVE THOUGHT STREAM</h2>
              <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover/stream:translate-x-1 transition-all" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
            {clientData?.package_type === 'STARTUP' ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                <Lock className="w-8 h-8 mb-4 text-[#4B5563]" />
                <span className="text-[10px] font-mono text-[#4B5563] uppercase tracking-widest leading-loose">
                  🔒 LIVE STREAM NON DISPONIBLE — AUCUN AGENT DÉPLOYÉ
                </span>
              </div>
            ) : tasksStream.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                <span className="text-[10px] font-mono text-[#4B5563] uppercase tracking-widest">
                  FLUX VIDE — EN ATTENTE D'ACTIVITÉ AGENT
                </span>
              </div>
            ) : (
              tasksStream.map((task, i) => (
                <div key={task.id} className="p-4 bg-[#0a0a0a] border border-white/5 rounded-lg group/stream-item hover:border-white/10 transition-all">
                  <div className="flex gap-3 mb-2">
                    <span className="text-[9px] font-mono text-[#10B981] tabular-nums whitespace-nowrap">
                      [{new Date(task.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}]
                    </span>
                    <p className="text-[11px] text-white/80 font-medium tracking-tight">
                      <span className="font-black text-[#10B981] mr-1 uppercase">{task.agent_name || 'SYSTEM'}:</span>
                      {task.task_name}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span className="text-[8px] font-mono text-[#4B5563] uppercase tracking-widest bg-black px-1.5 py-0.5 rounded border border-white/5">TYPE: {task.task_type || 'GENERIC'}</span>
                    <span className="text-[8px] font-mono text-[#4B5563] uppercase tracking-widest">COMPLEXITY: {task.complexity || 'LOW'}</span>
                    <span className="text-[8px] font-mono text-[#4B5563] uppercase tracking-widest">MODEL: {task.model || 'CLAUDE'}</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${task.status === 'COMPLETED' ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>{task.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
