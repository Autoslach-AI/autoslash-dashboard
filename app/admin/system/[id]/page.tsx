"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase';
const supabase = createClient();
import { 
  ChevronRight, 
  Activity, 
  Shield, 
  Settings, 
  Brain, 
  Zap,
  LayoutDashboard,
  ArrowLeft
} from 'lucide-react';

export default function ClientIsolatedSystemPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [booting, setBooting] = useState(true);
  const [clientData, setClientData] = useState<any>(null);

  useEffect(() => {
    async function fetchClient() {
      const { data, error } = await supabase
        .from('enterprises')
        .select('*')
        .eq('id', id)
        .single();
      
      if (data) {
        setClientData(data);
      } else {
        setClientData({
          name: "Disconnected Node",
          level: "Lattice Unknown"
        });
      }
      setBooting(false);
    }

    fetchClient();
  }, [id]);

  if (booting) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center font-sans tracking-tight">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-2 border-white/5 border-t-[#4ade80] rounded-full animate-spin shadow-[0_0_20px_rgba(74,222,128,0.2)]" />
          <div className="space-y-1 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">Synchronizing Neural Tunnel</p>
            <p className="text-[8px] font-mono text-[#4ade80]/40 uppercase tracking-widest leading-none">TARGET_ID: {id}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-[#e0e0e0] font-sans selection:bg-[#4ade80]/30 p-6 lg:p-8 pb-32 overflow-y-auto custom-scrollbar">
      {/* HEADER NAVIGATION */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-8">
           <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative shadow-2xl">
                 <Brain className="w-7 h-7 text-[#4ade80]" />
                 <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#4ade80] rounded-full border-2 border-black" />
              </div>
              <div className="space-y-1">
                 <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Integrated_Lattice</span>
                    <ChevronRight className="w-2.5 h-2.5 text-white/10" />
                    <span className="text-[9px] font-black text-[#4ade80] uppercase tracking-[0.4em]">{clientData?.level || 'Projet Entreprise'}</span>
                 </div>
                 <h1 className="text-3xl font-serif font-bold text-white tracking-tight">{clientData?.name || 'Lattice Active'}</h1>
                 <div className="flex items-center gap-3 pt-1">
                    <div className="flex items-center gap-2 px-2.5 py-0.5 bg-white/[0.03] border border-white/10 rounded-full">
                       <Zap className="w-2.5 h-2.5 text-[#4ade80]" />
                       <span className="text-[7.5px] font-black font-mono text-white/40 uppercase tracking-widest">Active_Domain: {clientData?.industry || 'ELECTRONICS'}</span>
                    </div>
                    <span className="text-[7.5px] font-mono text-white/10 uppercase tracking-widest lowercase opacity-30">chameleon engine active</span>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <div className="flex bg-black/40 p-1 rounded-lg border border-white/5 h-fit">
                 <button className="px-4 py-2 bg-white/10 text-white rounded-md text-[9px] font-black uppercase tracking-widest">Neural Hub</button>
                 <button className="px-4 py-2 text-white/20 hover:text-white/40 rounded-md text-[9px] font-black uppercase tracking-widest transition-all">Telemetry</button>
                 <button className="px-4 py-2 text-white/20 hover:text-white/40 rounded-md text-[9px] font-black uppercase tracking-widest transition-all">Security</button>
              </div>
              <button 
                onClick={() => router.push('/admin')}
                className="px-6 py-2 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:border-white/20 transition-all"
              >
                Exit
              </button>
           </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {[
             { 
               label: 'NEURAL PULSE', 
               value: '749MS', 
               trend: '+2.4%', 
               sub: 'API COST: $0.042', 
               footer: 'Total response latency monitored',
               color: 'text-[#4ade80]'
             },
             { 
               label: 'MARKET TRACTION', 
               value: '30.0%', 
               trend: 'SYNC', 
               sub: 'CONVERSION RATIO', 
               footer: 'Real-time action trend active',
               pulse: true
             },
             { 
               label: 'DATABASE INTEGRITY', 
               value: 'STABLE', 
               trend: 'SYNC', 
               sub: 'SUPABASE_HEALTH: 100%', 
               footer: 'Cloud Link: Encrypted',
               color: 'text-[#4ade80]'
             },
             { 
               label: 'ORCHESTRATOR LINK', 
               value: 'ACTIVE', 
               trend: 'LIVE', 
               sub: 'PRIORITIZE GPU OPTIMIZATION...', 
               footer: 'CLICK TO ACCESS ORCHESTRATOR',
               trigger: true
             }
           ].map((stat, i) => (
             <div key={i} className="p-5 bg-[#0a0a0a] border border-white/5 rounded-xl space-y-4 group hover:border-white/10 transition-all cursor-pointer relative overflow-hidden">
                <div className="flex justify-between items-start">
                   <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{stat.label}</span>
                   <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest ${stat.trend === 'SYNC' || stat.trend === 'LIVE' || stat.trend.startsWith('+') ? 'bg-green-500/10 text-[#4ade80]' : 'bg-red-500/10 text-red-500'} ${stat.pulse ? 'animate-pulse' : ''}`}>
                      <Activity className="w-2.5 h-2.5" />
                      {stat.trend}
                   </div>
                </div>
                <div className="space-y-0.5">
                   <p className={`text-3xl font-black tracking-tighter ${stat.color || 'text-white'}`}>{stat.value}</p>
                   <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">{stat.sub}</p>
                </div>
                <div className="pt-4 border-t border-white/[0.03] flex items-center justify-between">
                   <p className="text-[8px] font-black text-white/10 uppercase tracking-widest group-hover:text-white/30 transition-colors">{stat.footer}</p>
                   {stat.trigger && <ChevronRight className="w-2.5 h-2.5 text-white/10" />}
                </div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.01] blur-3xl rounded-full" />
             </div>
           ))}
        </div>

        {/* OPERATIONAL PANEL */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
           {/* AGENT TASK FORCE */}
           <div className="lg:col-span-6 p-8 bg-[#0a0a0a] border border-white/5 rounded-2xl space-y-8 group hover:border-white/10 transition-all">
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-[#4ade80]" />
                    <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">Agent Task Force</h3>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                    <span className="text-[9px] font-black text-[#4ade80] uppercase tracking-widest">Units Active</span>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {[
                   { id: 'SUPPORT_AGENT', task: 'Analyzing ticket #204', progress: 65, status: 'PROCESSING' },
                   { id: 'DEV_AGENT', task: 'Neural optimization for Hero', progress: 82, status: 'COMPILING' }
                 ].map(agent => (
                   <div key={agent.id} className="p-6 bg-black border border-white/5 rounded-xl space-y-4 hover:border-white/10 transition-all">
                      <div className="flex justify-between items-center text-[9px] font-black font-mono">
                         <span className="text-white/30 truncate">[{agent.id}]</span>
                         <span className="text-[#4ade80]">{agent.status}</span>
                      </div>
                      <p className="text-[11px] font-black text-white uppercase tracking-tighter leading-snug">{agent.task}</p>
                      <div className="space-y-1.5">
                         <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-white/20">
                            <span>Neural_Load</span>
                            <span>{agent.progress}%</span>
                         </div>
                         <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${agent.progress}%` }} className="h-full bg-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.3)]" />
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* LIVE THOUGHT STREAM */}
           <div className="lg:col-span-4 p-8 bg-[#0a0a0a] border border-white/5 rounded-2xl space-y-8 group hover:border-white/10 transition-all">
              <div className="flex justify-between items-center">
                 <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">Live Thought Stream</h3>
                 <ChevronRight className="w-3.5 h-3.5 text-white/20" />
              </div>
              <div className="space-y-4 font-mono overflow-y-auto custom-scrollbar max-h-[250px] pr-3">
                 {[
                   { time: '23:32', msg: 'ORCHESTRATOR -> prioritize gpu optimization for hero transitions.' },
                   { time: '23:30', msg: 'SUPPORT_UNIT -> resolving latency spike in sector 7' },
                   { time: '23:28', msg: 'NEURAL_LINK -> handshake verified with secure lattice' },
                   { time: '23:25', msg: 'DEV_LOG -> automated patch deployed to node cluster' }
                 ].map((log, i) => (
                   <div key={i} className="flex gap-4 text-[9px] leading-relaxed group/log">
                      <span className="text-white/10 shrink-0 tabular-nums">[{log.time}]</span>
                      <span className="text-white/40 lowercase group-hover/log:text-white/60 transition-colors">
                         <span className="text-[#4ade80]/40 uppercase">{log.msg.split(' -> ')[0]}</span> {'->'} {log.msg.split(' -> ')[1]}
                      </span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* NEURAL MONITOR FOOTER */}
        <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-xl flex items-center justify-between">
           <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                 <Activity className="w-4 h-4 text-[#4ade80] animate-pulse" />
                 <span className="text-[9px] font-black text-white/80 uppercase tracking-[0.3em]">Neural Event Monitor</span>
              </div>
              <div className="flex items-center gap-2 bg-black p-0.5 rounded-lg border border-white/5">
                 <button className="px-3 py-1 bg-white/5 text-white text-[8px] font-black uppercase tracking-widest rounded-md">System Health</button>
                 <button className="px-3 py-1 text-white/20 text-[8px] font-black uppercase tracking-widest">Agents</button>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">7 Days Monitoring Active</span>
              <div className="flex gap-1">
                 <div className="w-7 h-7 rounded border border-white/10 flex items-center justify-center bg-white/5">
                    <LayoutDashboard className="w-3.5 h-3.5 text-white/60" />
                 </div>
                 <div className="w-7 h-7 rounded border border-white/5 flex items-center justify-center">
                    <Settings className="w-3.5 h-3.5 text-white/10" />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
