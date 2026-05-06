"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Search, 
  Download, 
  ArrowLeft,
  LayoutDashboard,
  RefreshCcw,
  Activity,
  Package,
  Database,
  FileText,
  Brain
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/user-context';
import DoubleRibbonIntelligent, { NavItem } from '@/components/DoubleRibbonIntelligent';

export default function FleetPage() {
  const router = useRouter();
  const { user, profile } = useUser();
  const [searchQuery, setSearchQuery] = useState('');

  // Primary navigation items (Global Ribbon)
  const primaryItems: NavItem[] = [
    { id: 'NEURAL_HUB', label: 'Dashboard', icon: LayoutDashboard, onClick: () => router.push('/admin') },
    { id: 'MEMORY_VAULT', label: 'Lifecycle', icon: RefreshCcw },
    { id: 'BUSINESS_CONFIG', label: 'Analytics', icon: Activity },
    { id: 'UNIVERSAL_INVENTORY', label: 'Projects', icon: Package },
    { id: 'DATA_LIB', label: 'Data Library', icon: Database },
    { id: 'REPORTS', label: 'Reports', icon: FileText },
    { id: 'WORD_ASSISTANT', label: 'Word Assistant', icon: Zap, type: 'trigger' }
  ];

  // Secondary navigation items (Specific Ribbon)
  const secondaryItems: NavItem[] = [
    { id: 'SUPPORT_AGENT', label: 'Support Agent', icon: Brain },
    { id: 'DEV_AGENT', label: 'Dev Agent', icon: Brain }
  ];

  return (
    <DoubleRibbonIntelligent
      primaryItems={primaryItems}
      secondaryItems={secondaryItems}
      brandName="THE ORACLE"
      brandIcon={Zap}
      userProfile={{
        name: profile?.full_name || 'Admin',
        email: user?.email || 'admin@node.io',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'admin'}`
      }}
    >
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 min-h-screen bg-[#050505]">
        {/* HEADER SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => router.push('/admin')}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-white/60 hover:text-white group"
                  id="back-to-oracle-btn"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <div className="space-y-0.5">
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-widest uppercase italic leading-none">
                    FLEET COMMAND CENTER
                  </h1>
                </div>
              </div>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] pl-14">
                Fleet Management & Multi-Tenant Neural Routing
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button 
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white/40 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center gap-2.5"
                id="export-logs-btn"
              >
                <Download className="w-3.5 h-3.5" />
                EXPORT LOGS
              </button>
              <button 
                onClick={() => router.push('/admin')}
                className="px-6 py-3 bg-[#4ade80]/10 border border-[#4ade80]/20 rounded-xl text-[10px] font-bold text-[#4ade80] uppercase tracking-widest hover:bg-[#4ade80]/20 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(74,222,128,0.05)]"
                id="header-back-btn"
              >
                ← ORACLE
              </button>
            </div>
          </div>

          {/* UNIVERSAL SEARCH BAR */}
          <div className="relative group max-w-4xl">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#4ade80] transition-colors pointer-events-none">
              <Search className="w-5 h-5" />
            </div>
            <input 
              type="text"
              placeholder="Rechercher par nom, ID, plan, région, secteur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0a]/50 backdrop-blur-md border border-white/10 rounded-2xl px-16 py-6 text-[13px] font-mono text-white placeholder:text-white/10 focus:border-[#4ade80]/40 transition-all outline-none shadow-2xl focus:shadow-[#4ade80]/5"
              id="fleet-universal-search"
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2">
              <kbd className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-white/20 uppercase tracking-tighter">⌘ K</kbd>
            </div>
          </div>
        </motion.div>

        {/* CONTENT STAGE PLACEHOLDER */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="min-h-[500px] rounded-3xl border border-dashed border-white/5 bg-white/[0.01] flex items-center justify-center relative overflow-hidden"
          id="fleet-content-stage"
        >
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.03] pointer-events-none" />
          
          <div className="text-center space-y-6 relative z-10 p-8">
            <div className="w-16 h-16 rounded-3xl border border-white/10 bg-[#0a0a0a] flex items-center justify-center mx-auto relative group">
              <div className="absolute inset-0 bg-[#4ade80]/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <Zap className="w-8 h-8 text-[#4ade80] relative z-10" />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em]">Initialisation des systèmes Phoenix...</p>
              <p className="text-[9px] font-mono text-white/10 uppercase tracking-widest">En attente des flux de données orbitaux</p>
            </div>
          </div>
        </motion.div>
      </div>
    </DoubleRibbonIntelligent>
  );
}
