"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
  Settings,
  ExternalLink,
  Shield,
  Users,
  Trash2,
  Power
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/user-context';
import DoubleRibbonIntelligent, { NavItem } from '@/components/DoubleRibbonIntelligent';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

type PlanType = 'ALL' | 'STARTUP' | 'BUSINESS' | 'ENTERPRISE' | 'ELITE';
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
  agent_count?: number;
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
  const [showConfirmModal, setShowConfirmModal] = useState<{ id: string, name: string } | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const pageSize = 20;

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // 1. Fetch available plans
      const { data: plansData } = await supabase
        .from('plan_definitions')
        .select('plan_name')
        .order('plan_name', { ascending: true });
      
      if (plansData) {
        setPlans(plansData.map((p: any) => p.plan_name));
      }

      // 2. Fetch clients from v_clients_dev
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

      // 4. Fetch intelligence logs
      const { data: logsData } = await supabase
        .from('admin_intelligence_logs')
        .select('client_id, issue_type, raw_context, severity_level, created_at')
        .order('created_at', { ascending: false });

      const latestLogsMap: Record<string, any> = {};
      const priorityWeights: Record<string, number> = {
        'SECURITY': 10,
        'AGENT_ERROR': 9,
        'TOKEN_WARNING': 8,
        'CHURN_RISK': 7,
        'MESSAGE': 6,
        'UPSELL': 5
      };

      logsData?.forEach((log: any) => {
        const existing = latestLogsMap[log.client_id];
        if (!existing || (priorityWeights[log.issue_type] || 0) > (priorityWeights[existing.issue_type] || 0)) {
          latestLogsMap[log.client_id] = log;
        }
      });

      const processed = (clientsData || []).map((c: any) => ({
        ...c,
        agent_count: agentCounts[c.id] || 0,
        intelligence: latestLogsMap[c.id] || null
      }));

      setClients(processed);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredClients = useMemo(() => {
    return clients.filter((c: any) => {
      const matchesSearch = 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.project_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.package_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.sector.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPlan = planFilter === 'ALL' || c.package_type === planFilter;
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [clients, searchQuery, planFilter, statusFilter]);

  const paginatedClients = filteredClients.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredClients.length / pageSize);

  const activeSystemsCount = clients.filter(c => c.status !== 'INACTIVE').length;

  // Primary navigation items
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

  const exportLogs = () => {
    const headers = ["CLIENT", "PROJECT_ID", "PLAN", "STATUS", "REGION", "SECTOR", "MONTHLY_COST", "DATE_ACTIVATION"];
    const csvContent = [
      headers.join(","),
      ...filteredClients.map((c: any) => [
        `"${c.name}"`,
        `"${c.project_id}"`,
        `"${c.package_type}"`,
        `"${c.status}"`,
        `"${c.region}"`,
        `"${c.sector}"`,
        `"${c.monthly_cost}"`,
        `"${c.activated_at || c.created_at}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "fleet_export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'WARNING': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'STABLE': return 'bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/20';
      default: return 'bg-white/5 text-white/40 border-white/10';
    }
  };

  const getPlanStyle = (plan: string) => {
    switch (plan) {
      case 'ELITE': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'ENTERPRISE': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'BUSINESS': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'STARTUP': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-white/5 text-white/40 border-white/10';
    }
  };

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
      <div className="flex-1 flex flex-col min-h-screen bg-[#050505] overflow-y-auto custom-scrollbar">
        {/* HEADER SECTION */}
        <div className="px-8 pt-8 pb-4 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => router.push('/admin')}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-white/60 hover:text-white group"
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
                {activeSystemsCount} systèmes actifs — Fleet Management & Multi-Tenant Neural Routing
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={exportLogs}
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white/40 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center gap-2.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                EXPORT LOGS
              </button>
              <button 
                onClick={() => router.push('/admin')}
                className="px-6 py-3 bg-[#4ade80]/10 border border-[#4ade80]/20 rounded-xl text-[10px] font-bold text-[#4ade80] uppercase tracking-widest hover:bg-[#4ade80]/20 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(74,222,128,0.05)]"
              >
                ← ORACLE
              </button>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="relative group max-w-4xl">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#4ade80] transition-colors pointer-events-none">
              <Search className="w-5 h-5" />
            </div>
            <input 
              type="text"
              placeholder="Rechercher par nom, ID, plan, région, secteur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0a]/50 backdrop-blur-md border border-white/10 rounded-2xl px-16 py-5 text-[13px] font-mono text-white placeholder:text-white/10 focus:border-[#4ade80]/40 transition-all outline-none shadow-2xl focus:shadow-[#4ade80]/5"
            />
          </div>

          {/* FILTERS SECTION */}
          <div className="space-y-4">
            {/* ROW 1: PLANS */}
            <div className="flex flex-wrap gap-2">
              {(['ALL', ...plans] as PlanType[]).map((plan) => (
                <button
                  key={plan}
                  onClick={() => setPlanFilter(plan)}
                  className={`px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    planFilter === plan 
                    ? 'bg-white text-black border-white' 
                    : 'bg-black/40 text-gray-400 border-white/5 hover:border-white/10'
                  }`}
                >
                  {plan === 'ALL' ? 'ALL NODES' : plan}
                </button>
              ))}
            </div>

            {/* ROW 2: STATUS */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'ALL', label: 'ALL', color: 'bg-white/20' },
                { id: 'STABLE', label: 'STABLE', color: 'bg-[#4ade80]' },
                { id: 'WARNING', label: 'WARNING', color: 'bg-amber-500' },
                { id: 'CRITICAL', label: 'CRITICAL', color: 'bg-red-500' }
              ].map((status) => (
                <button
                  key={status.id}
                  onClick={() => setStatusFilter(status.id as StatusType)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2.5 border ${
                    statusFilter === status.id 
                    ? 'bg-white/10 text-white border-white/20' 
                    : 'bg-black/40 text-white/20 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${status.color}`} />
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TABLE SECTION */}
        <div className="flex-1 px-8 pb-12">
          <div className="bg-[#0a0a0a]/50 rounded-3xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Client Cluster</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Plan</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Fleet Status</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Token Usage</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-center">Agents</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Intelligence Mode</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Région</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Secteur</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Monthly Cost</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Date Activation</th>
                    <th className="px-6 py-5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={11} className="px-6 py-8 h-12 bg-white/[0.01]" />
                      </tr>
                    ))
                  ) : paginatedClients.length > 0 ? (
                    paginatedClients.map((client) => {
                      const usagePercent = client.token_budget > 0 
                        ? (client.total_tokens_consumed / client.token_budget) * 100 
                        : 0;
                      
                      return (
                        <tr 
                          key={client.id}
                          onClick={() => router.push(`/admin/system/${client.id}`)}
                          className="group hover:bg-white/[0.03] transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 font-mono text-xs group-hover:border-[#4ade80]/30 transition-all">
                                {client.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[13px] font-bold text-white group-hover:text-[#4ade80] transition-colors line-clamp-1">{client.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">{client.project_id || client.id.substring(0, 8)}</span>
                                  <span className="w-1 h-1 rounded-full bg-white/10" />
                                  <span className="text-[9px] font-mono text-white/20 uppercase">{client.package_type}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black tracking-tighter border ${getPlanStyle(client.package_type)}`}>
                              {client.package_type}
                            </span>
                          </td>
                          <td className="px-6 py-6">
                            <div className={`px-2.5 py-1 rounded-md text-[9px] font-black tracking-tighter border inline-flex items-center gap-1.5 ${getStatusStyle(client.status)}`}>
                              <div className="w-1 h-1 rounded-full bg-current" />
                              {client.status}
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="w-40 space-y-2">
                              <div className="flex justify-between items-center text-[9px] font-mono text-white/40 uppercase">
                                <span>{usagePercent.toFixed(1)}%</span>
                                <span>{Math.round(client.total_tokens_consumed / 1000)}k / {Math.round(client.token_budget / 1000)}k</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(usagePercent, 100)}%` }}
                                  className={`h-full ${usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-[#4ade80]'}`}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6 text-center">
                            <span className="text-sm font-mono font-bold text-white/80">{client.agent_count}</span>
                          </td>
                          <td className="px-6 py-6">
                            {client.intelligence ? (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const path = client.intelligence?.issue_type === 'SECURITY' || client.intelligence?.issue_type === 'AGENT_ERROR' 
                                    ? `/admin/system/${client.id}/agents` 
                                    : `/admin/system/${client.id}`;
                                  router.push(path);
                                }}
                                className={`flex items-center gap-2 group/intel transition-all p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04]`}
                              >
                                {client.intelligence.severity_level === 'CRITICAL' ? (
                                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                ) : client.intelligence.severity_level === 'WARNING' ? (
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                ) : (
                                  <Bell className="w-3.5 h-3.5 text-blue-400" />
                                )}
                                <div className="flex flex-col text-left">
                                  <span className={`text-[9px] font-black uppercase tracking-tighter ${
                                    client.intelligence.severity_level === 'CRITICAL' ? 'text-red-500' : 
                                    client.intelligence.severity_level === 'WARNING' ? 'text-amber-500' : 
                                    'text-blue-400'
                                  }`}>
                                    {client.intelligence.issue_type}
                                  </span>
                                  <span className="text-[10px] text-white/40 font-medium truncate max-w-[150px]">
                                    {client.intelligence.raw_context}
                                  </span>
                                </div>
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 text-white/20">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#4ade80]/40" />
                                <span className="text-[10px] font-medium uppercase tracking-widest italic">Stable</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-6">
                            <span className="text-[11px] font-medium text-white/60">{client.region}</span>
                          </td>
                          <td className="px-6 py-6">
                            <span className="text-[11px] font-medium text-white/60">{client.sector}</span>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex flex-col">
                              <span className="text-[13px] font-mono font-black text-white">{(client.monthly_cost || 0).toLocaleString()} FCFA</span>
                              <span className="text-[9px] text-white/20 uppercase tracking-tighter tracking-tighter">Billed monthly</span>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <span className="text-[11px] font-mono text-white/40">
                              {new Date(client.activated_at || client.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </td>
                          <td className="px-6 py-6">
                            <div className="relative">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === client.id ? null : client.id);
                                }}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/20 hover:text-white"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                              
                              <AnimatePresence>
                                {activeMenuId === client.id && (
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xl z-[100] py-2"
                                  >
                                    <button 
                                      onClick={() => router.push(`/admin/system/${client.id}`)}
                                      className="w-full px-4 py-2.5 text-left text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-all"
                                    >
                                      <Zap className="w-3.5 h-3.5" />
                                      OUVRIR SYSTÈME
                                    </button>
                                    <button 
                                      onClick={() => router.push(`/admin/system/${client.id}/agents`)}
                                      className="w-full px-4 py-2.5 text-left text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-all"
                                    >
                                      <Brain className="w-3.5 h-3.5" />
                                      VOIR AGENTS
                                    </button>
                                    <div className="h-px bg-white/5 my-1" />
                                    <button 
                                      onClick={() => setShowConfirmModal({ id: client.id, name: client.name })}
                                      className="w-full px-4 py-2.5 text-left text-[11px] font-bold text-red-500/60 hover:text-red-500 hover:bg-red-500/5 flex items-center gap-3 transition-all"
                                    >
                                      <Power className="w-3.5 h-3.5" />
                                      DÉSACTIVER
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={11} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-4 text-white/20">
                          <Package className="w-12 h-12 stroke-[1px]" />
                          <div className="space-y-1">
                            <p className="text-[11px] font-black uppercase tracking-[0.3em]">Aucun système détecté</p>
                            <p className="text-[9px] font-mono uppercase tracking-widest italic">Vérifiez les paramètres du cluster ou les filtres</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="px-8 py-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                Total affiché : {filteredClients.length} systèmes
              </span>
              
              <div className="flex items-center gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-2 rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-white hover:border-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-[10px] font-mono font-bold transition-all ${
                        currentPage === i + 1 
                        ? 'bg-white text-black' 
                        : 'text-white/20 hover:text-white/40 hover:bg-white/5'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-white hover:border-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CONFIRMATION MODAL */}
        <AnimatePresence>
          {showConfirmModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowConfirmModal(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl"
              >
                <div className="space-y-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                    <Power className="w-8 h-8 text-red-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">Désactiver le système ?</h3>
                    <p className="text-xs text-white/40 leading-relaxed">
                      Vous allez suspendre l'accès pour <span className="text-white font-bold">{showConfirmModal.name}</span>. 
                      Tous les agents et processus neuraux seront mis en pause.
                    </p>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={() => setShowConfirmModal(null)}
                      className="flex-1 py-4 rounded-xl border border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-widest hover:bg-white/5 transition-all"
                    >
                      Annuler
                    </button>
                    <button 
                      onClick={() => {
                        showToast('success', `SYSTÈME ${showConfirmModal.id} DÉSACTIVÉ`);
                        setShowConfirmModal(null);
                      }}
                      className="flex-1 py-4 rounded-xl bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                    >
                      Confirmer
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* TOAST NOTIFICATION */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl z-[300] flex items-center gap-3"
            >
              <CheckCircle2 className={`w-4 h-4 ${toast.type === 'success' ? 'text-[#4ade80]' : 'text-red-500'}`} />
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DoubleRibbonIntelligent>
  );
}
