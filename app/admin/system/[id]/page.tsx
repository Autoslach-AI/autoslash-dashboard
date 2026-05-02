"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
const supabase = createClient();
import { 
  ChevronRight, 
  Brain, 
  ArrowLeft,
  X
} from 'lucide-react';

export default function ClientIsolatedSystemPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [booting, setBooting] = useState(true);
  const [clientData, setClientData] = useState<any>(null);
  const [lastTask, setLastTask] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: entData } = await supabase
        .from('enterprises')
        .select('*')
        .eq('id', id)
        .single();
      
      if (entData) {
        setClientData(entData);
      }

      const { data: taskData } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('enterprise_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setLastTask(taskData);
      setBooting(false);
    }

    fetchData();
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

      {/* CONTENT AREA (EMPTY) */}
      <main className="flex-1">
        {/* Reservation for future content */}
      </main>
    </div>
  );
}
