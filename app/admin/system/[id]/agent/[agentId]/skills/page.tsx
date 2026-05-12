'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { getAgentsByEnterprise } from '@/lib/db/actions';

export default function AgentSkillsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const agentId = params?.agentId as string;
  
  const [agentName, setAgentName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgent = async () => {
      const { data: agents } = await getAgentsByEnterprise(id);
      const currentAgent = (agents as any[])?.find((a: any) => a.id === agentId);
      if (currentAgent) {
        setAgentName(currentAgent.name);
      }
      setLoading(false);
    };
    fetchAgent();
  }, [id, agentId]);

  if (loading) return null;

  return (
    <div className="relative p-6 lg:p-12 max-w-[1200px] mx-auto space-y-[100px] pb-64 font-mono">
      {/* PAGE HEADER */}
      <div className="flex justify-between items-end">
        <div className="space-y-4">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#4ade80] rounded-full shadow-[0_0_10px_#4ade80] animate-pulse" />
              <span className="text-[10px] font-bold text-white/40 tracking-[0.4em] uppercase">Status // Online_Configuration</span>
           </div>
           <h1 className="text-5xl font-normal text-white tracking-tighter small-caps">{agentName || 'UNDEFINED_NODE'}</h1>
        </div>
        <div className="text-right">
           <p className="text-[10px] text-white/20 uppercase tracking-widest mb-1">Sector_Cluster</p>
           <p className="text-xs font-bold text-white/60 tracking-wider">0X-{id?.substring(0, 8).toUpperCase()}</p>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex border-b border-white/10 gap-10">
        <button 
          onClick={() => router.push(`/admin/system/${id}/agent/${agentId}`)}
          className="pb-4 text-[10px] font-bold uppercase text-white/20 hover:text-white/40 tracking-[0.3em] transition-all relative"
        >
          Core_Config
        </button>
        <button 
          onClick={() => router.push(`/admin/system/${id}/agent/${agentId}?tab=KNOWLEDGE`)}
          className="pb-4 text-[10px] font-bold uppercase text-white/20 hover:text-white/40 tracking-[0.3em] transition-all relative"
        >
          Knowledge_Base
        </button>
        <button 
          className="pb-4 text-[10px] font-bold uppercase text-white tracking-[0.3em] transition-all relative"
        >
          Skills
          <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4ade80] shadow-[0_0_10px_#4ade80]" />
        </button>
      </div>

      <div className="flex items-center justify-center py-20">
        <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] animate-pulse text-center">
          en attente d'inscruction
        </p>
      </div>
    </div>
  );
}
