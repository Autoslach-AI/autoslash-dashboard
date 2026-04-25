"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  User, 
  Globe, 
  Mail, 
  MapPin, 
  CreditCard, 
  ShieldCheck,
  Palette,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';

interface ClientData {
  projectId: string;
  companyName: string;
  level: string;
  description: string;
  brandColor: string;
  agents: string[];
}

export default function ClientProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const [clientData, setClientData] = useState<ClientData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`client_${id}`);
    if (stored) {
      setClientData(JSON.parse(stored));
    } else {
      // Fallback
      setClientData({
        projectId: id,
        companyName: "Nexus Dynamics Corportation",
        level: "Projet Entreprise",
        description: "Leading enterprise solutions in neural lattice technology and data synchronization.",
        brandColor: "#4ade80",
        agents: []
      });
    }
  }, [id]);

  if (!clientData) return null;

  return (
    <div className="p-12 lg:p-20 space-y-12">
      {/* PROFILE HEADER */}
      <div className="relative group">
         <div className="h-64 rounded-[3rem] bg-gradient-to-br from-[#111111] via-black to-black border border-white/5 overflow-hidden relative">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
            <div className="absolute top-8 right-8 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
               <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
               <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Sync_Active</span>
            </div>
         </div>
         
         <div className="px-12 -mt-20 relative z-10 flex flex-col sm:flex-row items-end gap-8">
            <div className="w-40 h-40 rounded-[2.5rem] bg-black border-4 border-[#050505] shadow-2xl flex items-center justify-center relative overflow-hidden group/logo">
               <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover/logo:opacity-100 transition-opacity" />
               <ImageIcon className="w-12 h-12 text-white/10 group-hover/logo:text-white/40 transition-all group-hover/logo:scale-110" />
               {/* Color indicator */}
               <div 
                 className="absolute bottom-4 right-4 w-4 h-4 rounded-full border-2 border-[#050505] shadow-[0_0_15px_rgba(0,0,0,0.5)]" 
                 style={{ backgroundColor: clientData.brandColor }}
               />
            </div>
            <div className="pb-4 space-y-2 flex-1">
               <div className="flex items-center gap-4">
                  <h1 className="text-4xl font-black text-white uppercase tracking-tighter">{clientData.companyName}</h1>
                  <CheckCircle2 className="w-6 h-6 text-[#4ade80]" />
               </div>
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-white/40 font-mono text-[10px] uppercase tracking-widest">
                     <ShieldCheck className="w-3.5 h-3.5" />
                     {clientData.level}
                  </div>
                  <div className="flex items-center gap-2 text-white/20 font-mono text-[10px] uppercase tracking-widest">
                     <Globe className="w-3.5 h-3.5" />
                     nexus-global.io
                  </div>
               </div>
            </div>
            <div className="pb-4">
               <button className="px-8 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.03] transition-all active:scale-95">Edit Identity</button>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
         {/* LEFT INFO */}
         <div className="lg:col-span-2 space-y-12">
            <div className="p-10 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] space-y-8">
               <div className="flex items-center gap-4">
                  <User className="w-5 h-5 text-[#4ade80]" />
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/60">Company Intelligence</h3>
               </div>
               
               <div className="space-y-10">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Project_Biographic_Core</label>
                     <p className="text-lg text-white/60 leading-relaxed font-mono">
                        {clientData.description || "No biographic data injected into the neural core yet."}
                     </p>
                  </div>

                  <div className="grid grid-cols-2 gap-10">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Primary_Uplink</label>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                           <Mail className="w-4 h-4 text-white/20" />
                           <span className="text-xs font-mono text-white/60">ops@nexus-global.io</span>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Geographic_Sector</label>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                           <MapPin className="w-4 h-4 text-white/20" />
                           <span className="text-xs font-mono text-white/60">Sector_09_Paris</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* RIGHT SUMMARY */}
         <div className="space-y-8">
            <div className="p-8 bg-[#111111] border border-white/5 rounded-3xl space-y-8">
               <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Subscription_Node</h3>
               <div className="space-y-6">
                  <div className="p-6 bg-black border border-white/5 rounded-2xl space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{clientData.level}</span>
                        <div className="w-2 h-2 rounded-full bg-[#4ade80]" />
                     </div>
                     <p className="text-3xl font-black text-white tracking-tighter">€12,500<span className="text-sm text-white/20 lowercase">/mo</span></p>
                  </div>
                  <div className="flex items-center gap-4 text-white/40">
                     <CreditCard className="w-4 h-4" />
                     <span className="text-[9px] font-black uppercase tracking-widest">Billing Cycle: Monthly</span>
                  </div>
               </div>
               <button className="w-full py-4 border border-[#4ade80]/20 text-[#4ade80] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#4ade80]/5 transition-all">Deep Invoicing Portal</button>
            </div>

            <div className="p-8 bg-black border border-white/5 rounded-3xl space-y-6">
               <div className="flex items-center gap-4">
                  <Palette className="w-4 h-4 text-white/20" />
                  <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Visual_Frequency</h3>
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl border border-white/10" style={{ backgroundColor: clientData.brandColor }} />
                  <div className="space-y-1">
                     <p className="text-xs font-mono text-white/60 uppercase">{clientData.brandColor}</p>
                     <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Neural_Signature</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
