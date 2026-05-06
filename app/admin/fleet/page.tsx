"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Brain,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Power,
  TrendingUp,
  DollarSign,
  Cpu,
  ShieldAlert,
  ArrowUpRight,
  User,
  Globe,
  Briefcase
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/user-context';
import DoubleRibbonIntelligent, { NavItem } from '@/components/DoubleRibbonIntelligent';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

type PlanType = 'ALL' | string;
type StatusType = 'ALL' | 'STABLE' | 'WARNING' | 'CRITICAL';

interface ClientNode {
  id: string;
  project_id: string;
  name: string;
  package_type: string;
  status: string;
  total_tokens_consumed: number;
  token_budget: number;
  region: string;
  sector: string;
  monthly_cost: number;
  activated_at: string;
  created_at: string;
  agent_count: number;
  intelligence?: {
    issue_type: string;
    raw_context: string;
    severity_level: string;
    created_at: string;
  };
}

export default function FleetPage() {
  const router = useRouter();
  const { user, profile } = useUser();
  const [clients, setClients] = useState<ClientNode[]>([]);
  const [plans, setPlans] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<PlanType>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusType>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [hoveredClient, setHoveredClient] = useState<ClientNode | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [stats, setStats] = useState({
    activeSystems: 0,
    totalRevenue: 0,
    totalTokens: 0,
    activeAlerts: 0
  });

  const pageSize = 20;

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // 1. Fetch plans
      const { data: plansData } = await supabase
        .from('plan_definitions')
        .select('plan_name')
        .order('plan_name');
      
      if (plansData) setPlans(plansData.map((p: any) => p.plan_name));

      // 2. Fetch clients
      const { data: clientsData, error: clientError } = await supabase
        .from('v_clients_dev')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientError) throw clientError;

      // 3. Fetch agent counts
      const { data: agentsData } = await supabase
        .from('agents')
        .select('enterprise_id');
      
      const agentCounts: Record<string, number> = {};
      agentsData?.forEach((a: any) => {
        agentCounts[a.enterprise_id] = (agentCounts[a.enterprise_id] || 0) + 1;
      });

      // 4. Fetch intelligence logs with priority
      const { data: logsData } = await supabase
        .from('admin_intelligence_logs')
        .select('client_id, issue_type, raw_context, severity_level, created_at')
        .eq('is_test', false)
        .neq('issue_type', 'NEW_PROSPECT')
        .order('created_at', { ascending: false });

      const logsMap: Record<string, any> = {};
      const priority: Record<string, number> = {
        'SECURITY': 6,
        'AGENT_ERROR': 5,
        'TOKEN_WARNING': 4,
        'CHURN_RISK': 3,
        'MESSAGE': 2,
        'UPSELL': 1
      };

      logsData?.forEach((log: any) => {
        const existing = logsMap[log.client_id];
        if (!existing || (priority[log.issue_type] || 0) > (priority[existing.issue_type] || 0)) {
          logsMap[log.client_id] = log;
        }
      });

      const processed = (clientsData || []).map((c: any) => ({
        ...c,
        agent_count: agentCounts[c.id] || 0,
        intelligence: logsMap[c.id] || null
      }));

      setClients(processed);

      // Calculate Stats
      setStats({
        activeSystems: processed.length,
        totalRevenue: processed.reduce((acc: number, c: any) => acc + (c.monthly_cost || 0), 0),
        totalTokens: processed.reduce((acc: number, c: any) => acc + (c.total_tokens_consumed || 0), 0),
        activeAlerts: logsData?.length || 0
      });

    } catch (err) {
      console.error("Fleet Data Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        c.name.toLowerCase().includes(q) ||
        c.project_id?.toLowerCase().includes(q) ||
        c.package_type.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q);
      
      const matchesPlan = planFilter === 'ALL' || c.package_type === planFilter;
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [clients, searchQuery, planFilter, statusFilter]);

  const paginatedClients = filteredClients.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredClients.length / pageSize);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const primaryItems: NavItem[] = [
    { id: 'NEURAL_HUB', label: 'Dashboard', icon: LayoutDashboard, onClick: () => router.push('/admin') },
    { id: 'MEMORY_VAULT', label: 'Lifecycle', icon: RefreshCcw },
    { id: 'BUSINESS_CONFIG', label: 'Analytics', icon: Activity },
    { id: 'UNIVERSAL_INVENTORY', label: 'Projects', icon: Package },
    { id: 'DATA_LIB', label: 'Data Library', icon: Database },
    { id: 'REPORTS', label: 'Reports', icon: FileText },
    { id: 'WORD_ASSISTANT', label: 'Word Assistant', icon: Zap, type: 'trigger' }
  ];

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
      <div className="flex-1 flex flex-col min-h-screen bg-[#050505] overflow-y-auto custom-scrollbar relative">
        <div className="p-8 space-y-8">
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-4">
                <button onClick={() => router.push('/admin')} className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/50 hover:text-white">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h1 className="text-xl font-black text-white tracking-[0.2em] uppercase">FLEET COMMAND CENTER</h1>
              </div>
              <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] pl-12">{stats.activeSystems} SYSTÈMES ACTIFS</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-white/40 uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                <Download className="w-3.5 h-3.5" /> EXPORT LOGS
              </button>
              <button onClick={() => router.push('/admin')} className="px-4 py-2 bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg text-[10px] font-bold text-[#10B981] uppercase tracking-widest hover:bg-[#10B981]/20 transition-all">
                ← ORACLE
              </button>
            </div>
          </div>

          {/* STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* CARD 1: SYSTÈMES ACTIFS */}
            <div className="bg-[#0A0A0A] border border-[#1A1A1A] border-l-4 border-l-[#10B981] p-5 rounded-xl relative overflow-hidden group">
              <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity">
                <Cpu className="w-6 h-6 text-[#10B981]" />
              </div>
              <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-4">SYSTÈMES ACTIFS</p>
              <p className="text-3xl font-black text-[#10B981] uppercase">{stats.activeSystems}</p>
            </div>

            {/* CARD 2: REVENUS TOTAL */}
            <div className="bg-[#0A0A0A] border border-[#1A1A1A] border-l-4 border-l-[#3B82F6] p-5 rounded-xl relative overflow-hidden group">
              <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity">
                <DollarSign className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-4">REVENUS TOTAL</p>
              <p className="text-3xl font-black text-[#3B82F6] uppercase">{(stats.totalRevenue || 0).toLocaleString()} FCFA</p>
            </div>

            {/* CARD 3: TOKENS CONSOMMÉS */}
            <div className="bg-[#0A0A0A] border border-[#1A1A1A] border-l-4 border-l-[#8B5CF6] p-5 rounded-xl relative overflow-hidden group">
              <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity">
                <TrendingUp className="w-6 h-6 text-[#8B5CF6]" />
              </div>
              <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-4">TOKENS CONSOMMÉS</p>
              <p className="text-3xl font-black text-[#8B5CF6] uppercase">
                {stats.totalTokens >= 1000000 
                  ? `${(stats.totalTokens / 1000000).toFixed(2)}M` 
                  : `${(stats.totalTokens / 1000).toFixed(0)}K`}
              </p>
            </div>

            {/* CARD 4: ALERTES ACTIVES */}
            <div className={`bg-[#0A0A0A] border border-[#1A1A1A] border-l-4 p-5 rounded-xl relative overflow-hidden group ${
              stats.activeAlerts === 0 ? 'border-l-[#10B981]' : 'border-l-[#EF4444]'
            }`}>
              <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity">
                <ShieldAlert className={`w-6 h-6 ${stats.activeAlerts === 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`} />
              </div>
              <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-4">ALERTES ACTIVES</p>
              <p className={`text-3xl font-black uppercase ${
                stats.activeAlerts === 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
              }`}>
                {stats.activeAlerts === 0 ? 'OPTIMAL' : stats.activeAlerts}
              </p>
            </div>
          </div>

          {/* FILTERS */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#10B981] transition-colors" />
                <input 
                  type="text"
                  placeholder="Rechercher par nom, ID, plan, région, secteur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl px-12 py-3 text-xs font-mono text-white placeholder:text-white/10 outline-none focus:border-[#10B981]/40 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPlanFilter('ALL')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${planFilter === 'ALL' ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-[#1A1A1A]'}`}
                >
                  ALL NODES
                </button>
                {plans.map(plan => (
                  <button 
                    key={plan}
                    onClick={() => setPlanFilter(plan)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${planFilter === plan ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-[#1A1A1A]'}`}
                  >
                    {plan}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { id: 'ALL', label: 'ALL', dot: 'bg-white' },
                { id: 'STABLE', label: 'STABLE', dot: 'bg-[#10B981]' },
                { id: 'WARNING', label: 'WARNING', dot: 'bg-amber-500' },
                { id: 'CRITICAL', label: 'CRITICAL', dot: 'bg-red-500' }
              ].map(status => (
                <button 
                  key={status.id}
                  onClick={() => setStatusFilter(status.id as StatusType)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center gap-2 ${statusFilter === status.id ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-white/20 border-[#1A1A1A]'}`}
                >
                  <div className={`w-1 h-1 rounded-full ${status.dot}`} />
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="border-b border-[#1A1A1A] bg-white/[0.02]">
                    <th className="px-6 py-4 text-[9px] font-mono text-gray-500 uppercase tracking-widest">Client Cluster</th>
                    <th className="px-6 py-4 text-[9px] font-mono text-gray-500 uppercase tracking-widest">Plan</th>
                    <th className="px-6 py-4 text-[9px] font-mono text-gray-500 uppercase tracking-widest">Fleet Status</th>
                    <th className="px-6 py-4 text-[9px] font-mono text-gray-500 uppercase tracking-widest">Token Usage</th>
                    <th className="px-6 py-4 text-[9px] font-mono text-gray-500 uppercase tracking-widest text-center">Agents</th>
                    <th className="px-6 py-4 text-[9px] font-mono text-gray-500 uppercase tracking-widest">Intelligence Mode</th>
                    <th className="px-6 py-4 text-[9px] font-mono text-gray-500 uppercase tracking-widest">Région</th>
                    <th className="px-6 py-4 text-[9px] font-mono text-gray-500 uppercase tracking-widest">Secteur</th>
                    <th className="px-6 py-4 text-[9px] font-mono text-gray-500 uppercase tracking-widest">Monthly Cost</th>
                    <th className="px-6 py-4 text-[9px] font-mono text-gray-500 uppercase tracking-widest">Date Activation</th>
                    <th className="px-6 py-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {loading ? (
                    <tr><td colSpan={11} className="px-6 py-20 text-center text-white/20 font-mono text-[10px] tracking-widest">CHARGEMENT DES NŒUDS...</td></tr>
                  ) : paginatedClients.map(client => {
                    const usage = client.token_budget > 0 ? (client.total_tokens_consumed / client.token_budget) * 100 : 0;
                    return (
                      <tr 
                        key={client.id}
                        onMouseMove={handleMouseMove}
                        onMouseEnter={() => setHoveredClient(client)}
                        onMouseLeave={() => setHoveredClient(null)}
                        onClick={() => router.push(`/admin/system/${client.id}`)}
                        className="group h-[56px] hover:bg-white/[0.02] transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/40">
                              {client.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-white group-hover:text-[#10B981] transition-colors leading-none">{client.name}</p>
                              <p className="text-[8px] font-mono text-white/20 uppercase tracking-tighter mt-1">{client.project_id || `AS-B-2026-${client.id.substring(0,4)}`} • {client.package_type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-2">
                          <span className={`text-[9px] font-black tracking-tight border px-2 py-0.5 rounded ${
                            client.package_type === 'ELITE' ? 'text-purple-400 border-purple-400/20 bg-purple-400/5' :
                            client.package_type === 'ENTERPRISE' ? 'text-blue-400 border-blue-400/20 bg-blue-400/5' :
                            'text-emerald-400 border-emerald-400/20 bg-emerald-400/5'
                          }`}>
                            {client.package_type}
                          </span>
                        </td>
                        <td className="px-6 py-2">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-black ${
                            client.status === 'CRITICAL' ? 'text-red-500 border-red-500/20 bg-red-500/5' :
                            client.status === 'WARNING' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' :
                            'text-[#10B981] border-[#10B981]/20 bg-[#10B981]/5'
                          }`}>
                            <div className="w-1 h-1 rounded-full bg-current" />
                            {client.status}
                          </div>
                        </td>
                        <td className="px-6 py-2">
                          <div className="w-32 space-y-1">
                            <div className="flex justify-between text-[8px] font-mono text-white/20">
                              <span>{usage.toFixed(1)}%</span>
                              <span>{Math.round(client.total_tokens_consumed/1000)}K</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full ${usage > 90 ? 'bg-red-500' : usage > 70 ? 'bg-amber-500' : 'bg-[#10B981]'}`} style={{ width: `${Math.min(usage, 100)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-2 text-center text-[10px] font-bold text-white/60">{client.agent_count}</td>
                        <td className="px-6 py-2">
                          {client.intelligence ? (
                            <div className="flex items-center gap-2 cursor-pointer group/intel" onClick={(e) => {
                              e.stopPropagation();
                              router.push(client.intelligence?.severity_level === 'CRITICAL' ? `/admin/system/${client.id}/agents` : `/admin/system/${client.id}`);
                            }}>
                              <AlertTriangle className={`w-3.5 h-3.5 ${
                                client.intelligence.severity_level === 'CRITICAL' ? 'text-red-500' : 
                                client.intelligence.severity_level === 'WARNING' ? 'text-amber-500' : 'text-blue-400'
                              }`} />
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-white/60 uppercase leading-none">{client.intelligence.issue_type}</span>
                                <span className="text-[10px] text-white/20 truncate max-w-[120px]">{client.intelligence.raw_context}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]/40" />
                              <span className="text-[10px] text-white/10 uppercase font-mono tracking-widest">SECURE</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-2 text-[10px] text-white/40">{client.region}</td>
                        <td className="px-6 py-2 text-[10px] text-white/40">{client.sector}</td>
                        <td className="px-6 py-2">
                          <p className="text-[11px] font-mono font-bold text-white">{(client.monthly_cost || 0).toLocaleString()} FCFA</p>
                        </td>
                        <td className="px-6 py-2 text-[10px] font-mono text-white/20">
                          {new Date(client.activated_at || client.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === client.id ? null : client.id); }}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-white/30 hover:text-white transition-all"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="px-8 py-4 border-t border-[#1A1A1A] flex items-center justify-between bg-white/[0.01]">
              <p className="text-[10px] font-mono text-white/10 italic">AFFICHAGE {paginatedClients.length} SUR {filteredClients.length} SYSTÈMES</p>
              <div className="flex items-center gap-1.5">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1.5 rounded-lg border border-[#1A1A1A] text-white/20 hover:text-white disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i+1)} className={`w-8 h-8 rounded-lg text-[10px] font-mono font-bold ${currentPage === i+1 ? 'bg-white text-black' : 'text-white/20 hover:bg-white/5'}`}>
                    {i+1}
                  </button>
                ))}
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-1.5 rounded-lg border border-[#1A1A1A] text-white/20 hover:text-white disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* HOVER CONTEXT CARD */}
        <AnimatePresence>
          {hoveredClient && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                left: mousePos.x + 16,
                top: mousePos.y + 16,
                zIndex: 9999,
                pointerEvents: 'none'
              }}
              className="w-[280px] bg-[#111111] border border-[#2A2A2A] rounded-xl p-4 shadow-2xl backdrop-blur-xl space-y-4"
            >
              <div className="space-y-1">
                <p className="text-sm font-black text-white leading-none">{hoveredClient.name}</p>
                <p className="text-[10px] font-mono text-[#10B981] uppercase tracking-tighter">{hoveredClient.project_id || `AS-B-2026-${hoveredClient.id.substring(0,4)}`}</p>
              </div>

              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-black text-white/60 uppercase">{hoveredClient.package_type}</span>
                <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase ${
                  hoveredClient.status === 'CRITICAL' ? 'text-red-500 border-red-500/20 bg-red-500/10' : 'text-[#10B981] border-[#10B981]/20 bg-[#10B981]/10'
                }`}>{hoveredClient.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-white/20">
                    <Briefcase className="w-3 h-3" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">SECTEUR</span>
                  </div>
                  <p className="text-[10px] text-white/60 uppercase">{hoveredClient.sector}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-white/20">
                    <Globe className="w-3 h-3" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">RÉGION</span>
                  </div>
                  <p className="text-[10px] text-white/60 uppercase">{hoveredClient.region}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-mono text-white/40 uppercase">
                  <span>TOKEN USAGE</span>
                  <span>{((hoveredClient.total_tokens_consumed / (hoveredClient.token_budget || 1)) * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#10B981]" style={{ width: `${Math.min((hoveredClient.total_tokens_consumed / (hoveredClient.token_budget || 1)) * 100, 100)}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-white/5">
                    <Brain className="w-3 h-3 text-purple-400" />
                  </div>
                  <span className="text-[10px] font-bold text-white/60">{hoveredClient.agent_count} AGENTS</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#10B981]">
                  <span className="text-[9px] font-black uppercase tracking-widest">OUVRIR</span>
                  <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CONTEXT MENU */}
        <AnimatePresence>
          {activeMenuId && (
            <div className="fixed inset-0 z-[100]" onClick={() => setActiveMenuId(null)}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{ top: mousePos.y, left: mousePos.x - 200 }}
                className="absolute w-52 bg-[#111111] border border-white/10 rounded-xl shadow-2xl py-2 overflow-hidden"
              >
                <button onClick={() => router.push(`/admin/system/${activeMenuId}`)} className="w-full px-4 py-2.5 text-left text-[10px] font-bold text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-all uppercase tracking-widest">
                  <Zap className="w-3.5 h-3.5" /> OUVRIR SYSTÈME
                </button>
                <button onClick={() => router.push(`/admin/system/${activeMenuId}/agents`)} className="w-full px-4 py-2.5 text-left text-[10px] font-bold text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-all uppercase tracking-widest">
                  <Brain className="w-3.5 h-3.5" /> VOIR AGENTS
                </button>
                <div className="h-px bg-white/5 my-1" />
                <button className="w-full px-4 py-2.5 text-left text-[10px] font-bold text-red-500/60 hover:text-red-500 hover:bg-red-500/5 flex items-center gap-3 transition-all uppercase tracking-widest">
                  <Power className="w-3.5 h-3.5" /> DÉSACTIVER
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DoubleRibbonIntelligent>
  );
}
