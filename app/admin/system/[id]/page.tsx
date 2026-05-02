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
          name: "Neural Dynamics",
          industry: "Electronics",
          level: "Enterprise"
        });
      }
      setBooting(false);
    }

    fetchClient();
  }, [id]);

  if (booting) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/5 border-t-[#10B981] rounded-full animate-spin" />
      </div>
    );
  }

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

      {/* CONTENT AREA (EMPTY) */}
      <main className="flex-1">
        {/* Reservation for future content */}
      </main>
    </div>
  );
}
