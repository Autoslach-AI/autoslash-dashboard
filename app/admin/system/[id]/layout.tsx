"use client";

import React, { useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  User, 
  Settings, 
  Cpu, 
  Shield, 
  Zap,
  ChevronRight,
  ArrowLeft,
  X,
  Palette
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { SystemProvider, useSystem } from './SystemContext';
import { supabase } from '@/lib/supabase/client';

interface ClientData {
  projectId: string;
  companyName: string;
  level: string;
  agents: string[];
  brandColor: string;
}

function SystemLayoutInner({ children, clientData, id }: { children: React.ReactNode, clientData: ClientData, id: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { agentsState } = useSystem();
  const [isPrimaryCollapsed, setIsPrimaryCollapsed] = useState(false);
  const [isSecondaryOpen, setIsSecondaryOpen] = useState(false);

  // Auto-collapse logic for agent pages (Primary Ribbon only)
  useEffect(() => {
    if (pathname.includes('/agent/')) {
      setIsPrimaryCollapsed(true);
    }
  }, [pathname]);

  // Determine agents visibility based on level
  let visibleAgents = clientData.agents;
  if (clientData.level === "Projet Startup") visibleAgents = visibleAgents.slice(0, 1);
  else if (clientData.level === "Projet Business") visibleAgents = visibleAgents.slice(0, 2);

  const coreNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: `/admin/system/${id}` },
    { id: 'inventory', label: 'Inventory', icon: Zap, path: `/admin/system/${id}/inventory` },
    { id: 'agents', label: 'Agents', icon: Cpu, type: 'trigger' },
    { id: 'branding', label: 'Branding', icon: Palette, path: `/admin/system/${id}/branding` },
    { id: 'profile', label: 'Profile', icon: User, path: `/admin/system/${id}/profile` },
    { id: 'settings', label: 'Settings', icon: Settings, path: `/admin/system/${id}/settings` },
  ];

  return (
    <div className="min-h-screen bg-[#000000] flex text-[#e0e0e0] font-sans selection:bg-[#4ade80]/30 selection:text-black overflow-hidden">
      
      {/* PRIMARY RIBBON (GLOBAL CONTROL) */}
      <aside 
        className={`fixed left-0 top-0 bottom-0 bg-[#000000] border-r border-white/10 transition-all duration-500 z-[100] flex flex-col items-center py-8 ${
          isPrimaryCollapsed ? 'w-20' : 'w-72'
        }`}
      >
         {/* CROCHET / TOGGLE */}
         <button 
           onClick={() => setIsPrimaryCollapsed(!isPrimaryCollapsed)}
           className="mb-12 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-[#4ade80]/40 transition-all text-white/20 hover:text-[#4ade80]"
         >
            {isPrimaryCollapsed ? <ChevronRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
         </button>

         {/* NAVIGATION ITEMS */}
         <nav className="flex-1 w-full px-4 space-y-4">
            {coreNav.map((item) => {
               const isActive = pathname === item.path || (item.id === 'agents' && isSecondaryOpen);
               return (
                 <div key={item.id} className="relative group">
                    <button
                      onClick={() => {
                        if (item.type === 'trigger') {
                          setIsSecondaryOpen(!isSecondaryOpen);
                        } else if (item.path) {
                          router.push(item.path);
                          setIsSecondaryOpen(false);
                        }
                      }}
                      className={`w-full flex items-center rounded-xl transition-all font-mono font-black uppercase text-[10px] tracking-widest ${
                        isPrimaryCollapsed ? 'justify-center h-12' : 'px-4 py-4 gap-4'
                      } ${isActive ? 'bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20 shadow-[0_0_20px_rgba(74,222,128,0.05)]' : 'text-white/20 hover:text-white/60 hover:bg-white/5'}`}
                    >
                       <item.icon className={`w-4 h-4 ${isActive ? 'text-[#4ade80]' : ''}`} />
                       {!isPrimaryCollapsed && <span>{item.label}</span>}
                    </button>
                    {isPrimaryCollapsed && (
                       <div className="absolute left-full ml-4 px-3 py-2 bg-black border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-[#4ade80] opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[110] whitespace-nowrap shadow-2xl">
                          {item.label}
                       </div>
                    )}
                 </div>
               );
            })}
         </nav>

         {/* EXIT NODE */}
         <button 
           onClick={() => {
             router.push('/admin');
             setIsSecondaryOpen(false);
           }}
           className="mt-auto w-10 h-10 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
         >
            <X className="w-4 h-4" />
         </button>
      </aside>

      {/* SECONDARY RIBBON (AGENT SELECTOR) */}
      <AnimatePresence>
         {isSecondaryOpen && (
            <motion.aside
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className={`fixed top-0 bottom-0 bg-[#050505] border-r border-white/10 z-[90] flex flex-col py-24 transition-all duration-500 ${
                isPrimaryCollapsed ? 'left-20 w-64' : 'left-72 w-80'
              }`}
            >
               <div className="px-8 mb-10">
                  <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] font-mono">Neural_Fleet_Nodes</h3>
               </div>
               <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-2">
                  {visibleAgents.map((agentId) => {
                     const path = `/admin/system/${id}/agent/${agentId}`;
                     const isActive = pathname === path;
                     const agentData = agentsState[agentId];
                     const isNodeActive = agentData?.isActive ?? true;

                     return (
                       <Link
                         key={agentId}
                         href={path}
                         onClick={() => {
                           setIsPrimaryCollapsed(true);
                         }}
                         className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl transition-all border group ${
                           isActive 
                            ? 'bg-white/5 border-white/10 text-white' 
                            : 'border-transparent text-white/20 hover:text-white/60 hover:bg-white/5'
                         }`}
                       >
                          <div className="relative">
                             <Cpu className={`w-4.5 h-4.5 ${isActive ? 'text-[#4ade80]' : 'text-current opacity-40'}`} />
                             {/* NEURAL PULSE */}
                             <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-black shadow-sm ${
                               isNodeActive ? 'bg-[#4ade80] animate-pulse shadow-[0_0_5px_#4ade80]' : 'bg-gray-600'
                             }`} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest font-mono truncate">
                            {agentData?.name || agentId.replace(/_/g, ' ')}
                          </span>
                       </Link>
                     );
                  })}
               </nav>
            </motion.aside>
         )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <main 
        className={`flex-1 relative min-h-screen transition-all duration-500 overflow-y-auto ${
          isPrimaryCollapsed 
            ? (isSecondaryOpen ? 'ml-[21rem]' : 'ml-20') 
            : (isSecondaryOpen ? 'ml-[39rem]' : 'ml-72')
        }`}
      >
        <div className="max-w-7xl mx-auto min-h-screen">
           {children}
        </div>
      </main>
    </div>
  );
}

export default function ClientSystemLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const id = params?.id as string;
  const [clientData, setClientData] = useState<ClientData | null>(null);

  useEffect(() => {
    async function fetchClient() {
      const { data, error } = await supabase
        .from('enterprises')
        .select(`
          *,
          agents(*)
        `)
        .eq('id', id)
        .single();
      
      if (data) {
        setClientData({
          projectId: data.id,
          companyName: data.name,
          level: data.package_type === 'ENTERPRISE' ? 'Projet Entreprise' : 
                 data.package_type === 'BUSINESS' ? 'Projet Business' : 'Projet Startup',
          agents: data.agents?.map((a: any) => a.id) || [],
          brandColor: data.brand_color || "#4ade80"
        });
      } else {
        // Fallback or handle error
        setClientData({
          projectId: id,
          companyName: "Disconnected Node",
          level: "Lattice Unknown",
          agents: [],
          brandColor: "#ef4444"
        });
      }
    }

    fetchClient();
  }, [id]);

  if (!clientData) return <div className="min-h-screen bg-black flex items-center justify-center text-white/20 font-mono text-xs uppercase tracking-widest">Loading_System_Lattice...</div>;

  return (
    <SystemProvider enterpriseId={id}>
      <SystemLayoutInner clientData={clientData} id={id}>
        {children}
      </SystemLayoutInner>
    </SystemProvider>
  );
}
