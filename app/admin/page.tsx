"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Package, 
  Activity, 
  RefreshCcw,
  Brain,
  Database,
  LayoutDashboard,
  Zap,
  Users,
  Settings,
  HelpCircle,
  Search,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Check,
  TrendingUp,
  Download,
  Plus,
  FileText,
  Terminal
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useConfig } from '@/lib/contexts/config-context';
import { useUser } from '@/lib/contexts/user-context';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
const supabase = createClient();
import DoubleRibbonIntelligent, { NavItem } from '@/components/DoubleRibbonIntelligent';

type Tab = 'NEURAL_HUB' | 'MEMORY_VAULT' | 'BUSINESS_CONFIG' | 'UNIVERSAL_INVENTORY';
type MonitorCategory = 'SYSTEM_HEALTH' | 'ORCHESTRATOR' | 'DEV_AGENT' | 'SUPPORT_AGENT';
type NeuralStatus = 'OPTIMAL' | 'WARNING' | 'CRITICAL' | 'MESSAGE' | 'SUCCESS' | 'ERROR' | 'STABLE';
type CommMode = 'AUTONOMOUS' | 'APPROVAL';

interface AdminIntelligenceLog {
  id: string;
  enterprise_id: string;
  issue_type: string;
  severity_level: 'INFO' | 'WARNING' | 'CRITICAL';
  is_upsell_opportunity: boolean;
  message: string;
  created_at: string;
}

interface AgentTask {
  id: string;
  api_used: 'Claude' | 'Gemini' | 'OpenRouter' | string;
  neural_load: number;
  tokens_consumed: number;
  enterprise_id: string;
  created_at: string;
}

interface SystemLog {
  id: string;
  enterprise_id: string;
  event_type: string;
  raw_data: any;
  status_color: string;
  error_code?: string;
  created_at: string;
}

interface AgentConfig {
  agent_id: string;
  name: string;
  role: string;
  status: 'IDLE' | 'PROCESSING' | 'BLOCKED' | string;
  current_task: string | null;
  neural_load: number;
}

interface FleetNode {
  id: string; // UUID
  name: string;
  package_type: 'STARTUP' | 'BUSINESS' | 'ENTERPRISE' | 'ELITE';
  status: 'STABLE' | 'WARNING' | 'CRITICAL';
  warning_flag: boolean;
  region: string;
  created_at: string;
  total_tokens_consumed?: number;
  comm_mode?: CommMode;
  client_subscriptions?: {
    plan_definitions?: {
      name: string;
    };
  }[];
  // UI extended fields
  systemHealth?: NeuralStatus;
  lastEvent?: {
    type: string;
    description: string;
    timestamp: Date;
  };
}


const GET_STATUS_COLOR = (status: string | undefined) => {
  switch (status) {
    case 'OPTIMAL': case 'SUCCESS': case 'STABLE': return '#4ade80'; // Neon Green
    case 'WARNING': return '#fbbf24'; // Amber/Yellow
    case 'CRITICAL': case 'ERROR': return '#ef4444'; // Critical Red
    case 'MESSAGE': return '#3b82f6'; // Electric Blue
    default: return '#ffffff';
  }
};

// Logical Time Scaling (Requirement 3)
const formatNeuralTime = (timestamp: Date) => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const isWithin24h = diff < 24 * 60 * 60 * 1000;

  if (isWithin24h) {
    return timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  }
  return timestamp.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ', ' + 
         timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
};

const calculateElapsed = (startTime: Date) => {
  const now = new Date();
  const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const MONITOR_DATA: Record<MonitorCategory, any[]> = {
  SYSTEM_HEALTH: [
    { name: '08:00', value: 98, status: 'OPTIMAL', alertLabel: 'Latency sync correct' },
    { name: '09:00', value: 99, status: 'OPTIMAL', alertLabel: 'Optimal packet flow' },
    { name: '10:00', value: 45, status: 'CRITICAL', alertLabel: 'Packet drop detected: ERR_502' },
    { name: '11:00', value: 97, status: 'OPTIMAL', alertLabel: 'Recovery complete' },
    { name: '12:00', value: 75, status: 'WARNING', alertLabel: 'DB Read Latency Spike' },
    { name: '13:00', value: 98, status: 'OPTIMAL', alertLabel: 'Optimal packet flow' },
    { name: '14:00', value: 30, status: 'MESSAGE', alertLabel: 'Priority Msg: System Handover' },
    { name: '15:00', value: 99, status: 'OPTIMAL', alertLabel: 'Stability maintained' },
  ],
  ORCHESTRATOR: [
    { name: '08:00', value: 12, status: 'OPTIMAL', alertLabel: 'Strategy initialized' },
    { name: '09:00', value: 45, status: 'OPTIMAL', alertLabel: 'Resource allocation verified' },
    { name: '10:00', value: 28, status: 'OPTIMAL', alertLabel: 'Neural cluster responding' },
    { name: '11:00', value: 67, status: 'CRITICAL', alertLabel: 'Logic Conflict: Circular Routing' },
    { name: '12:00', value: 42, status: 'OPTIMAL', alertLabel: 'Heuristic bypass active' },
    { name: '13:00', value: 89, status: 'OPTIMAL', alertLabel: 'Optimal load distribution' },
    { name: '14:00', value: 54, status: 'OPTIMAL', alertLabel: 'Load balancing active' },
    { name: '15:00', value: 76, status: 'OPTIMAL', alertLabel: 'Optimal load distribution' },
  ],
  DEV_AGENT: [
    { name: '08:00', value: 4, status: 'OPTIMAL', alertLabel: 'Environment stable' },
    { name: '09:00', value: 8, status: 'OPTIMAL', alertLabel: 'Build success: commit_id=e4f21' },
    { name: '10:00', value: 2, status: 'CRITICAL', alertLabel: 'Typescript collision: Strict null check' },
    { name: '11:00', value: 12, status: 'OPTIMAL', alertLabel: 'Patch deployed' },
    { name: '12:00', value: 9, status: 'OPTIMAL', alertLabel: 'Hot reload sync' },
    { name: '13:00', value: 15, status: 'OPTIMAL', alertLabel: 'Neural mapping updated' },
    { name: '14:00', value: 5, status: 'OPTIMAL', alertLabel: 'Unit tests passed' },
    { name: '15:00', value: 11, status: 'OPTIMAL', alertLabel: 'Neural mapping updated' },
  ],
  SUPPORT_AGENT: [
    { name: '08:00', value: 22, status: 'OPTIMAL', alertLabel: 'Ticket queue empty' },
    { name: '09:00', value: 34, status: 'OPTIMAL', alertLabel: 'Human-like response generated' },
    { name: '10:00', value: 18, status: 'OPTIMAL', alertLabel: 'Sentiment analysis positive' },
    { name: '11:00', value: 45, status: 'OPTIMAL', alertLabel: 'Bulk resolution in progress' },
    { name: '12:00', value: 12, status: 'WARNING', alertLabel: 'Escalation pending: complex query' },
    { name: '13:00', value: 29, status: 'OPTIMAL', alertLabel: 'Escalation resolved' },
    { name: '14:00', value: 38, status: 'OPTIMAL', alertLabel: 'Ticket queue stable' },
    { name: '15:00', value: 41, status: 'OPTIMAL', alertLabel: 'Bulk resolution in progress' },
  ],
};

const CHART_DATA = [
  { name: 'Apr 5', value: 400 },
  { name: 'Apr 9', value: 300 },
  { name: 'Apr 13', value: 500 },
  { name: 'Apr 18', value: 350 },
  { name: 'Apr 23', value: 450 },
  { name: 'Apr 28', value: 400 },
  { name: 'May 3', value: 600 },
  { name: 'May 7', value: 550 },
  { name: 'May 12', value: 700 },
  { name: 'May 17', value: 500 },
];

export default function NeuralCommandCenterV31() {
  const { user, profile, loading: authLoading } = useUser();
  const { 
    config, 
    updateConfig, 
    isReady 
  } = useConfig();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('NEURAL_HUB');
  const [monitorCategory, setMonitorCategory] = useState<MonitorCategory>('SYSTEM_HEALTH');
  const [monitorTime, setMonitorTime] = useState('7 DAYS');
  const [showAgentsDropdown, setShowAgentsDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  
  // Requirement 1: Oracle & Neural Core Logical Skeleton
  const [isAdminOracle, setIsAdminOracle] = useState(true); 
  const [clients, setClients] = useState<FleetNode[]>([]);
  const [commMode, setCommMode] = useState<CommMode>('APPROVAL');
  const [oracleFilter, setOracleFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'MESSAGE' | 'STABLE' | 'OPTIMAL'>('ALL');
  const [clickedRowId, setClickedRowId] = useState<string | null>(null);
  const [planFilter, setPlanFilter] = useState<'ALL' | 'ENTERPRISE' | 'BUSINESS' | 'STARTUP' | 'ELITE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [selectedApiFilter, setSelectedApiFilter] = useState<'ALL' | 'Claude' | 'Gemini' | 'OpenRouter'>('ALL');
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([]);
  const [intelligenceLogs, setIntelligenceLogs] = useState<AdminIntelligenceLog[]>([]);
  const [intelligenceSummary, setIntelligenceSummary] = useState<{
    totalActive: number;
    topMessage: string | null;
    topSeverity: 'INFO' | 'WARNING' | 'CRITICAL' | 'UPSELL' | null;
    topIssueType: string | null;
    topEnterpriseId: string | null;
    isUpsell: boolean;
  }>({
    totalActive: 0,
    topMessage: null,
    topSeverity: null,
    topIssueType: null,
    topEnterpriseId: null,
    isUpsell: false
  });
  const [neuralPulse, setNeuralPulse] = useState<any>(null);
  const [thoughtStream, setThoughtStream] = useState<any[]>([]);
  const [lastFetch, setLastFetch] = useState<Date>(new Date());

  // New states for dynamization
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [agentTaskForce, setAgentTaskForce] = useState<AgentConfig[]>([]);
  const [kpiMetrics, setKpiMetrics] = useState({
    latency: '450MS',
    traction: '0%',
    integrity: 'STABLE',
    orchestrator: 'ACTIVE'
  });


  // Requirement 7: RECONSTRUCTION SECTION 1 — NEURAL INTELLIGENCE HUB
  useEffect(() => {
    async function fetchHubData() {
      try {
        // 1. Fleet via route API (bypass RLS)
        const fleetResponse = await fetch('/api/test-fleet');
        const fleetJson = await fleetResponse.json();
        const fleetData = fleetJson.data;

        if (fleetData) {
          setClients(fleetData.map((node: any) => ({
            ...node,
            systemHealth: node.status === 'STABLE' ? 'OPTIMAL' : node.status,
            commMode: node.comm_mode || 'AUTONOMOUS',
            lastEvent: {
              type: node.status === 'CRITICAL' ? 'SQL_ERROR'
                  : node.status === 'WARNING' ? 'LATENCY'
                  : 'SYNC',
              description: node.status === 'CRITICAL' ? 'Packet drop detected: ERR_502'
                         : node.status === 'WARNING' ? 'Packet delay threshold exceeded'
                         : 'Neural Lattice synchronized successfully',
              timestamp: new Date(node.created_at)
            }
          })));
        }

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const { data: taskData } = await supabase
          .from('agent_tasks')
          .select('*')
          .gte('created_at', startOfMonth.toISOString());
        if (taskData) setAgentTasks(taskData);

        const { data: intelData } = await supabase
          .from('admin_intelligence_logs')
          .select('*')
          .order('created_at', { ascending: false });
        if (intelData) setIntelligenceLogs(intelData);

        const { data: recentLogs } = await supabase
          .from('system_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (recentLogs) setSystemLogs(recentLogs);

        const { data: agents } = await supabase
          .from('agent_config')
          .select('*')
          .in('agent_id', ['ARCHITECTE', 'BACKEND', 'FRONTEND', 'QA', 'AI_CORE']);
        if (agents) setAgentTaskForce(agents);

        const { data: archAgent } = await supabase
          .from('agent_config')
          .select('status')
          .eq('agent_id', 'ARCHITECTE')
          .single();

        setKpiMetrics(prev => ({
          ...prev,
          latency: recentLogs && recentLogs.length > 0
            ? `${(Math.random() * 50 + 200).toFixed(0)}MS`
            : 'N/A',
          orchestrator: archAgent?.status === 'PROCESSING' ? 'BUSY' : 'ACTIVE',
          integrity: fleetData ? 'STABLE' : 'CRITICAL'
        }));

        // 7. Intelligence Hub Summary
        const summaryResponse = await fetch('/api/admin/intelligence-summary');
        const summaryJson = await summaryResponse.json();
        if (summaryJson && !summaryJson.error) {
          setIntelligenceSummary(summaryJson);
        }

        // 8. Neural Pulse
        const npRes = await fetch('/api/admin/neural-pulse')
        const npData = await npRes.json()
        setNeuralPulse(npData)

        // 9. Agent Task Force
        const tfRes = await fetch('/api/admin/agent-taskforce');
        const tfData = await tfRes.json();
        if (tfData.agents) {
          setAgentTaskForce(tfData.agents);
        }

        // 10. Thought Stream
        const tsRes = await fetch('/api/admin/thought-stream');
        const tsData = await tsRes.json();
        if (tsData.thoughts) {
          setThoughtStream(tsData.thoughts);
        }

        setLastFetch(new Date());
      } catch (err) {
        console.error("FETCH_ERROR:", err);
      }
    }

    fetchHubData();
    const pulse = setInterval(fetchHubData, 30000);
    return () => clearInterval(pulse);
  }, []);
  
  // Requirement 3: UX Feedback (Scanning Animation)
  useEffect(() => {
    if (searchQuery) {
      setIsScanning(true);
      const timer = setTimeout(() => setIsScanning(false), 600);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const [activeSubTab, setActiveSubTab] = useState('Outline');
  const [booting, setBooting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Local state for complex config parts
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => {
    if (isReady && !authLoading) {
      setLocalConfig(config);
      const timer = setTimeout(() => setBooting(false), 800);
      return () => clearTimeout(timer);
    }
  }, [config, isReady, authLoading]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig(localConfig);
      showToast('success', 'SYNC_SUCCESS: NEURAL_LATTICE_UPDATED');
    } catch (e) {
      showToast('error', 'SYNC_FAIL: DATABASE_REJECTION');
    } finally {
      setSaving(false);
    }
  };

  // KPI CALCULATIONS FOR SECTION 1
  // Card 1 (API COMMAND CENTER)
  const filteredTasks = selectedApiFilter === 'ALL' ? agentTasks : agentTasks.filter(t => (t as any).api_used === selectedApiFilter);
  const totalTokens = filteredTasks.reduce((acc, t) => acc + (t.tokens_consumed || 0), 0);
  const totalCostFCFA = totalTokens * 0.0006; // Estimated: 1000 tokens ≈ 0.6 FCFA

  // Card 2 (SYSTEM HEALTH)
  const stableCount = clients.filter(c => c.status === 'STABLE').length;
  const warningCount = clients.filter(c => c.status === 'WARNING').length;
  const criticalCount = clients.filter(c => c.status === 'CRITICAL').length;
  const healthScore = clients.length > 0 ? Math.round((stableCount * 100 + warningCount * 50) / clients.length) : 100;
  const mostCriticalNode = clients.sort((a, b) => {
    const statusOrder = { CRITICAL: 0, WARNING: 1, STABLE: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  })[0];

  // Card 3 (INTELLIGENCE & OPPORTUNITIES)
  const opportunitiesCount = intelligenceLogs.filter(l => l.is_upsell_opportunity).length;
  const latestIntel = intelligenceLogs[0];

  // Card 4 (NEURAL PULSE)
  const latestSystemLog = systemLogs[0];

  if (booting || !isReady || authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-10 h-10 border-2 border-white/5 border-t-white/40 rounded-full animate-spin" />
          <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/20">Booting Interface...</p>
        </div>
      </div>
    );
  }

  const primaryItems: NavItem[] = [
    { id: 'NEURAL_HUB', label: 'Dashboard', icon: LayoutDashboard, onClick: () => setActiveTab('NEURAL_HUB') },
    { id: 'MEMORY_VAULT', label: 'Lifecycle', icon: RefreshCcw, onClick: () => setActiveTab('MEMORY_VAULT') },
    { id: 'BUSINESS_CONFIG', label: 'Analytics', icon: Activity, onClick: () => setActiveTab('BUSINESS_CONFIG') },
    { id: 'UNIVERSAL_INVENTORY', label: 'Projects', icon: Package, onClick: () => setActiveTab('UNIVERSAL_INVENTORY') },
    { id: 'DATA_LIB', label: 'Data Library', icon: Database },
    { id: 'REPORTS', label: 'Reports', icon: FileText },
    { id: 'WORD_ASSISTANT', label: 'Word Assistant', icon: Zap, type: 'trigger' }
  ];

  const secondaryItems: NavItem[] = [
    { id: 'SUPPORT_AGENT', label: 'Support Agent', icon: Brain, path: '/admin/system/C_001/agent/SUPPORT_AGENT' },
    { id: 'DEV_AGENT', label: 'Dev Agent', icon: Brain, path: '/admin/system/C_001/agent/DEV_AGENT' }
  ];

  const brandName = isAdminOracle ? 'THE ORACLE' : (clients[0]?.name || 'NEURAL_SYSTEM');
  return (
    <>
      <DoubleRibbonIntelligent
      primaryItems={primaryItems}
      secondaryItems={secondaryItems}
      brandName={brandName}
      brandIcon={Zap}
      userProfile={{
        name: profile?.full_name || 'Admin',
        email: user?.email || 'admin@node.io',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'admin'}`
      }}
    >
      <div className="max-w-[1400px] mx-auto space-y-8">
         
          {/* STATS GRID - NEURAL INTELLIGENCE HUB */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CARD 1 — API COMMAND CENTER */}
            <div 
              className="p-6 bg-[#111111] border border-white/5 rounded-xl space-y-4 transition-all relative overflow-hidden"
            >
              <div className="flex justify-between items-start relative z-10">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">API COMMAND CENTER</span>
                <div className="flex gap-1 opacity-20">
                  {['Claude', 'Gemini', 'OpenRouter'].map((api) => (
                    <div
                      key={api}
                      className="px-1.5 py-0.5 rounded text-[7px] font-bold border border-white/10 text-white/30 bg-white/5"
                    >
                      {api[0]}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2 relative z-10 py-2">
                <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] leading-tight">
                  AUCUN AGENT DÉPLOYÉ CE MOIS
                </p>
                <p className="text-[8px] font-medium text-white/20 uppercase tracking-[0.1em] leading-relaxed max-w-[180px]">
                  Les données apparaîtront dès le premier agent client activé
                </p>
              </div>
              <div className="pt-6 mt-2 border-t border-white/[0.03] flex items-center justify-between relative z-10">
                <p className="uppercase tracking-widest text-[8px] font-bold text-white/10">TOKENS CONSUMED (MONTHLY)</p>
                <span className="text-[10px] font-mono font-bold text-white/20">—</span>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.01] blur-3xl -mr-16 -mt-16 rounded-full" />
            </div>

            {/* CARD 2 — SYSTEM HEALTH */}
            <div 
              onClick={() => {
                if (healthScore < 100 && mostCriticalNode) {
                  router.push(`/admin/system/${mostCriticalNode.id}`);
                }
              }}
              className={`p-6 border rounded-xl space-y-4 transition-all cursor-pointer group relative overflow-hidden ${
                healthScore < 70 ? 'bg-red-500/10 border-red-500/50' : 
                healthScore < 100 ? 'bg-amber-500/10 border-amber-500/50' : 
                'bg-[#111111] border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex justify-between items-start relative z-10">
                <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${healthScore < 100 ? 'text-white' : 'text-white/40'}`}>SYSTEM HEALTH</span>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  healthScore === 100 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500 animate-pulse'
                }`}>
                  <Shield className="w-2.5 h-2.5" />
                  {healthScore}%
                </div>
              </div>
              <div className="space-y-1 relative z-10">
                <p className={`text-3xl font-mono tracking-tighter font-black ${
                  healthScore === 100 ? 'text-[#4ade80] drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]' : 
                  healthScore < 70 ? 'text-red-500' : 'text-amber-500'
                }`}>
                  {stableCount} STABLE
                </p>
                <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest flex gap-2">
                  <span>{warningCount} WARNING</span>
                  <span className="opacity-20">/</span>
                  <span>{criticalCount} CRITICAL</span>
                </p>
              </div>
              <div className="pt-4 mt-2 border-t border-white/[0.03] flex items-center justify-between relative z-10">
                <p className="uppercase tracking-widest text-[8px] font-bold text-white/10">Global Infrastructure Score</p>
                {healthScore < 100 && <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white transition-all transform group-hover:translate-x-1" />}
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] blur-3xl -mr-16 -mt-16 group-hover:bg-white/[0.05] transition-all rounded-full" />
            </div>

            {/* CARD 3 — INTELLIGENCE HUB */}
            <div 
              onClick={() => {
                if (intelligenceSummary.totalActive > 0 && intelligenceSummary.topEnterpriseId) {
                  const id = intelligenceSummary.topEnterpriseId;
                  const type = intelligenceSummary.topIssueType;
                  if (type === 'TOKEN_LIMIT' || type === 'TOKEN_WARNING' || type === 'UPSELL') {
                    router.push(`/admin/system/${id}/settings`);
                  } else if (type === 'AGENT_ERROR' || type === 'SECURITY') {
                    router.push(`/admin/system/${id}/agents`);
                  } else {
                    router.push(`/admin/system/${id}`);
                  }
                }
              }}
              className={`p-6 bg-[#111111] border border-white/5 ${intelligenceSummary.totalActive > 0 ? 'hover:border-white/10 cursor-pointer' : 'cursor-default'} rounded-xl space-y-4 transition-all group relative overflow-hidden`}
            >
              <div className="flex justify-between items-start relative z-10">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">INTELLIGENCE HUB</span>
                {intelligenceSummary.totalActive > 0 && intelligenceSummary.topSeverity && (
                  <div className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                    intelligenceSummary.topSeverity === 'CRITICAL' ? 'bg-red-500/20 text-red-500' :
                    intelligenceSummary.topSeverity === 'WARNING' ? 'bg-amber-500/20 text-amber-500' :
                    intelligenceSummary.topSeverity === 'UPSELL' ? 'bg-green-500/20 text-green-500' :
                    'bg-blue-500/20 text-blue-500'
                  }`}>
                    {intelligenceSummary.topSeverity}
                  </div>
                )}
              </div>
              <div className="space-y-1 relative z-10">
                {intelligenceSummary.totalActive === 0 ? (
                  <>
                    <p className="text-[11px] font-black text-[#4ade80] uppercase tracking-[0.2em] py-1">SYSTÈME OPTIMAL</p>
                    <p className="text-white/20 text-[9px] font-bold uppercase tracking-widest">AUCUNE ALERTE ACTIVE</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-mono font-black text-white/90 leading-tight line-clamp-2">
                      {intelligenceSummary.topMessage}
                    </p>
                    <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">
                      {intelligenceSummary.totalActive} ALERTES ACTIVES CE MOIS
                    </p>
                  </>
                )}
              </div>
              <div className={`pt-4 mt-2 border-t border-white/[0.03] flex items-center justify-between relative z-10 ${intelligenceSummary.totalActive === 0 ? 'opacity-20' : ''}`}>
                <p className="uppercase tracking-widest text-[8px] font-bold text-white/10">GROWTH & ALERT OPPORTUNITIES &gt;</p>
                {intelligenceSummary.totalActive > 0 && <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white transition-all transform group-hover:translate-x-1" />}
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] blur-3xl -mr-16 -mt-16 group-hover:bg-white/[0.05] transition-all rounded-full" />
            </div>

            {/* CARD 4 — NEURAL PULSE */}
            <div 
              onClick={() => {
                if (neuralPulse?.totalEvents > 0 && neuralPulse?.lastEnterpriseId) {
                  router.push(`/admin/system/${neuralPulse.lastEnterpriseId}`);
                }
              }}
              className={`p-6 bg-[#111111] border border-white/5 ${neuralPulse?.totalEvents > 0 ? 'hover:border-white/10 cursor-pointer' : 'cursor-default'} rounded-xl space-y-4 transition-all group relative overflow-hidden`}
            >
              <div className="flex justify-between items-start relative z-10">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">NEURAL PULSE</span>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold transition-all ${
                  neuralPulse?.globalStatus === 'ERROR' ? 'bg-red-500/10 text-red-500' : 
                  neuralPulse?.globalStatus === 'SYNC' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-green-500/10 text-green-400'
                }`}>
                   <Activity className="w-2.5 h-2.5" />
                   {neuralPulse?.globalStatus || 'LIVE'}
                </div>
              </div>
              <div className="space-y-1 relative z-10">
                {(!neuralPulse || neuralPulse.totalEvents === 0) ? (
                  <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.2em] py-4">N/A — EN ATTENTE</p>
                ) : (
                  <>
                    <p className="text-xl font-mono tracking-tighter font-black text-[#4ade80] drop-shadow-[0_0_10px_rgba(74,222,128,0.3)] line-clamp-2">
                      {neuralPulse.lastEvent}
                    </p>
                    <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest truncate">
                      {neuralPulse.lastEventType}
                    </p>
                  </>
                )}
              </div>
              <div className={`pt-4 mt-2 border-t border-white/[0.03] flex items-center justify-between relative z-10 ${(!neuralPulse || neuralPulse.totalEvents === 0) ? 'opacity-20' : ''}`}>
                <p className="uppercase tracking-widest text-[8px] font-bold text-white/10">REAL-TIME SYNAPTIC FLOW &gt;</p>
                {neuralPulse?.totalEvents > 0 && <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white transition-all transform group-hover:translate-x-1" />}
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] blur-3xl -mr-16 -mt-16 group-hover:bg-white/[0.05] transition-all rounded-full" />
            </div>
          </div>

              {/* NEURAL OPERATIONAL PANEL (STEP 2) */}
              <div className="grid grid-cols-10 gap-4">
                {/* COLUMN A: AGENT TASK FORCE (60%) */}
                <div className="col-span-10 lg:col-span-6 space-y-4">
                  <div className="p-8 bg-[#111111] border border-white/5 rounded-xl space-y-6 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-[10px] font-bold text-white/80 uppercase tracking-[0.2em]">AGENT TASK FORCE</h3>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4ade80]"></span>
                        </span>
                        <span className="text-[9px] font-bold text-[#4ade80] uppercase tracking-widest">Units Active</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {agentTaskForce.map((agent: any) => (
                        <div key={agent.agent_id} className="p-5 bg-black/20 border border-white/5 rounded-lg space-y-4 group hover:border-white/10 transition-all">
                          <div className="flex justify-between items-center text-[10px] font-mono font-bold tracking-tight">
                            <span className="text-white/40">[{agent.agent_id}]</span>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                agent.status === 'PROCESSING' ? 'bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.4)]' :
                                agent.status === 'BLOCKED' ? 'bg-[#ef4444]' :
                                'bg-white/20'
                              }`} />
                              <span className={
                                agent.status === 'PROCESSING' ? 'text-orange-500' :
                                agent.status === 'BLOCKED' ? 'text-[#ef4444]' :
                                'text-white/40'
                              }>{agent.status}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[11px] font-bold text-white uppercase tracking-tighter">{agent.name}</p>
                            <p className="text-[8px] font-mono text-white/30 truncate uppercase tracking-tighter">
                              {agent.primary_api}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-[9px] font-mono text-white/20 uppercase tracking-tighter">
                              <span>Neural_Load</span>
                              <span className="text-white/40">{(agent.avg_neural_load * 100).toFixed(0)}%</span>
                            </div>
                            <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${agent.avg_neural_load * 100}%` }}
                                className={`h-full ${
                                  agent.avg_neural_load > 0.8 ? 'bg-[#ef4444]' :
                                  agent.avg_neural_load > 0.5 ? 'bg-orange-500' :
                                  'bg-[#4ade80]'
                                }`}
                              />
                            </div>
                          </div>
                          <div className="pt-2 border-t border-white/[0.02]">
                            <p className="text-[9px] font-mono text-white/50 truncate uppercase tracking-tighter">
                              {agent.current_task || 'EN ATTENTE DE MISSION'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* COLUMN B: LIVE THOUGHT STREAM (40%) */}
                <div className="col-span-10 lg:col-span-4">
                  <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-xl flex flex-col space-y-6 h-full max-h-[500px] overflow-hidden">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[10px] font-bold text-white/80 uppercase tracking-[0.2em]">LIVE THOUGHT STREAM</h3>
                      <Terminal className="w-3.5 h-3.5 text-white/20" />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 font-mono text-[10px] pr-2">
                      {thoughtStream.length > 0 ? (
                        thoughtStream.map((thought, i) => (
                          <div key={i} className="space-y-1 border-l border-white/5 pl-4 py-1 hover:border-[#4ade80]/40 transition-colors group">
                            <div className="flex gap-2 items-center">
                              <span className="text-white/10 tabular-nums">[{new Date(thought.started_at).getHours().toString().padStart(2, '0')}:{new Date(thought.started_at).getMinutes().toString().padStart(2, '0')}]</span>
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                thought.status === 'COMPLETED' ? 'bg-[#4ade80]' :
                                thought.status === 'PROCESSING' ? 'bg-orange-500 animate-pulse' :
                                thought.status === 'BLOCKED' ? 'bg-[#ef4444]' :
                                'bg-white/20'
                              }`} />
                              <span className="text-white/60 font-bold uppercase tracking-tighter">{thought.agent_id}</span>
                              <span className="text-white/20">{'->'}</span>
                              <span className="text-white/80 lowercase line-clamp-1">{thought.output_summary || "..."}</span>
                            </div>
                            <div className="flex gap-2 text-[8px] text-white/20 uppercase tracking-widest pl-4">
                              <span>{thought.task_type}</span>
                              <span>|</span>
                              <span>{thought.complexity}</span>
                              <span>|</span>
                              <span>{thought.api_used}</span>
                              <span>|</span>
                              <span className={
                                thought.status === 'COMPLETED' ? 'text-[#4ade80]/40' :
                                thought.status === 'PROCESSING' ? 'text-orange-500/40' :
                                thought.status === 'BLOCKED' ? 'text-[#ef4444]/40' :
                                ''
                              }>{thought.status}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex items-center justify-center text-white/10 uppercase tracking-[0.3em] font-black italic">
                          WAITING FOR NEURAL ACTIVITY...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>


             {/* NEURAL EVENT MONITOR (STEP 3) */}
             <div className="p-8 bg-[#111111] border border-white/5 rounded-xl space-y-10 group/monitor">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                   <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-3 pr-2 border-r border-white/5">
                         <Activity className="w-3.5 h-3.5 text-[#4ade80] animate-pulse" />
                         <h3 className="text-[11px] font-bold text-white/90 uppercase tracking-[0.2em]">Neural Event Monitor</h3>
                      </div>

                      {/* SYSTEM MENU - Repositioned to Left */}
                      <div className="flex bg-black/40 p-1 rounded-lg border border-white/10 h-fit">
                         <button 
                           onClick={() => setMonitorCategory('SYSTEM_HEALTH')}
                           className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                             monitorCategory === 'SYSTEM_HEALTH' 
                             ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                             : 'text-white/20 hover:text-white/40'
                           }`}
                         >
                           SYSTEM HEALTH
                           {monitorCategory === 'SYSTEM_HEALTH' && <ChevronDown className="w-2.5 h-2.5 opacity-50" />}
                         </button>
                      </div>

                      {/* AGENTS MENU - Single Dropdown Menu on Left */}
                      <div className="relative">
                         <button 
                           onClick={() => setShowAgentsDropdown(!showAgentsDropdown)}
                           className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 border border-white/10 ${
                             ['ORCHESTRATOR', 'DEV_AGENT', 'SUPPORT_AGENT'].includes(monitorCategory)
                             ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] border-white/20' 
                             : 'bg-black/40 text-white/20 hover:text-white/40'
                           }`}
                         >
                           {['ORCHESTRATOR', 'DEV_AGENT', 'SUPPORT_AGENT'].includes(monitorCategory) 
                             ? monitorCategory.replace('_', ' ') 
                             : 'AGENTS'
                           }
                           <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-300 ${showAgentsDropdown ? 'rotate-180' : ''}`} />
                         </button>

                         <AnimatePresence>
                            {showAgentsDropdown && (
                               <motion.div 
                                 initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                 animate={{ opacity: 1, y: 0, scale: 1 }}
                                 exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                 className="absolute top-full left-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 p-1.5 backdrop-blur-xl"
                               >
                                  {(['ORCHESTRATOR', 'DEV_AGENT', 'SUPPORT_AGENT'] as MonitorCategory[]).map((cat) => (
                                    <button 
                                      key={cat} 
                                      onClick={() => {
                                        setMonitorCategory(cat);
                                        setShowAgentsDropdown(false);
                                      }}
                                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-all ${
                                        monitorCategory === cat 
                                        ? 'bg-white/10 text-white' 
                                        : 'text-white/40 hover:bg-white/5 hover:text-white/80'
                                      }`}
                                    >
                                      <span>{cat.replace('_', ' ')}</span>
                                      {monitorCategory === cat && <Check className="w-3 h-3 text-[#4ade80]" />}
                                    </button>
                                  ))}
                               </motion.div>
                            )}
                         </AnimatePresence>
                      </div>
                   </div>

                   <div className="flex items-center gap-3 self-end lg:self-center">
                      {/* Time Filter - Single Dropdown Menu on Right */}
                      <div className="relative">
                         <button 
                           onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                           className="px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 border border-white/10 bg-black/40 text-white"
                         >
                           {monitorTime}
                           <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-300 ${showTimeDropdown ? 'rotate-180' : ''}`} />
                         </button>

                         <AnimatePresence>
                            {showTimeDropdown && (
                               <motion.div 
                                 initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                 animate={{ opacity: 1, y: 0, scale: 1 }}
                                 exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                 className="absolute top-full right-0 mt-2 w-32 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 p-1.5 backdrop-blur-xl"
                               >
                                  {['7 DAYS', '30 DAYS', '3 MONTHS'].map((p) => (
                                    <button 
                                      key={p} 
                                      onClick={() => {
                                        setMonitorTime(p);
                                        setShowTimeDropdown(false);
                                      }}
                                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-all ${
                                        monitorTime === p 
                                        ? 'bg-white/10 text-white' 
                                        : 'text-white/40 hover:bg-white/5 hover:text-white/80'
                                      }`}
                                    >
                                      <span>{p}</span>
                                      {monitorTime === p && <Check className="w-3 h-3 text-[#4ade80]" />}
                                    </button>
                                  ))}
                               </motion.div>
                            )}
                         </AnimatePresence>
                      </div>

                      {/* View Indicator (Decorative mimicry from image) */}
                      <div className="hidden sm:flex bg-black p-1 rounded-md border border-white/5 h-fit gap-1">
                         <div className="p-1.5 bg-white/5 rounded"><LayoutDashboard className="w-3 h-3 text-white/60" /></div>
                         <div className="p-1.5"><Search className="w-3 h-3 text-white/20" /></div>
                      </div>
                   </div>
                </div>
                
                <div className="h-[280px] w-full relative">
                  {/* Neural Grid Overlay */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
                       style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                  
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={systemLogs.slice().reverse().map(l => ({
                        name: new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        value: l.event_type === 'DEPLOYMENT' ? 100 : l.event_type === 'WARNING' ? 40 : l.event_type === 'CRITICAL' ? 10 : 60,
                        status: l.event_type === 'CRITICAL' ? 'CRITICAL' : l.event_type === 'WARNING' ? 'WARNING' : 'OPTIMAL',
                        alertLabel: l.event_type
                    }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="monitorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={'#4ade80'} stopOpacity={0.08}/>
                          <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="name" 
                        stroke="#ffffff10" 
                        fontSize={8} 
                        tickLine={false} 
                        axisLine={false}
                        dy={10}
                        fontFamily="monospace"
                      />
                      <YAxis 
                        stroke="#ffffff10" 
                        fontSize={8} 
                        tickLine={false} 
                        axisLine={false}
                        dx={-5}
                        fontFamily="monospace"
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-[#0a0a0a] border border-white/10 p-3 rounded-lg shadow-2xl backdrop-blur-xl">
                                <p className="text-[9px] font-mono text-white/40 mb-2 uppercase tracking-widest">{data.name} UTC</p>
                                <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: GET_STATUS_COLOR(data.status) }} />
                                  <p className="text-[11px] font-bold text-white uppercase tracking-tighter">
                                    {monitorCategory === 'SYSTEM_HEALTH' ? `UPTIME: ${data.value}%` : `FREQUENCY: ${data.value} OPS`}
                                  </p>
                                </div>
                                <p className={`text-[8px] font-mono mt-1 uppercase`} style={{ color: GET_STATUS_COLOR(data.status), opacity: 0.8 }}>
                                  {data.status}: {data.alertLabel}
                                </p>
                                {(data.status === 'CRITICAL' || data.status === 'WARNING') && (
                                  <p className="text-[7px] font-mono mt-2 text-white/30 uppercase">
                                    DURATION: {calculateElapsed(new Date(Date.now() - 3600000))} {/* Mocking an hour ago */}
                                  </p>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={monitorCategory === 'SYSTEM_HEALTH' ? '#4ade8040' : '#ffffff20'} 
                        strokeWidth={1.5} 
                        fillOpacity={1} 
                        fill="url(#monitorGradient)" 
                        animationDuration={1000}
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          return (
                            <circle
                              key={cx}
                              cx={cx}
                              cy={cy}
                              r={3}
                              fill={GET_STATUS_COLOR(payload.status)}
                              className="filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                            />
                          );
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/[0.02]">
                   <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
                         <span className="text-[8px] font-mono text-white/30 uppercase tracking-[0.2em]">Deployment Success</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                         <span className="text-[8px] font-mono text-white/30 uppercase tracking-[0.2em]">Critical Conflicts</span>
                      </div>
                   </div>
                   <p className="text-[8px] font-mono text-white/10 uppercase tracking-[0.5em]">Neural Stream Analytics v3.2</p>
                </div>
             </div>

             {/* SECTION 4: THE ORACLE COMMAND CENTER (EVOLUTION: NEURAL NAVIGATOR) */}
             <div className="space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-6">
                   <div className="space-y-1">
                      <h3 className="text-[12px] font-bold text-white uppercase tracking-[0.3em]">Oracle Command Center</h3>
                      <p className="text-[9px] text-white/20 font-mono">Fleet Management & Multi-Tenant Neural Routing</p>
                   </div>
                   
                   <div className="flex items-center gap-3">
                      {/* SEE MORE BUTTON - top-right of section */}
                      <button 
                        onClick={() => router.push('/admin/reports')}
                        className="flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-lg text-[8px] font-bold text-white/40 hover:bg-white/5 transition-all uppercase tracking-widest"
                      >
                        <FileText className="w-2.5 h-2.5" /> See More
                      </button>

                      <div className="flex gap-3">
                         <button className="flex items-center gap-2 px-4 py-2 border border-white/5 rounded-lg text-[9px] font-bold text-white/40 hover:bg-white/5 transition-all uppercase tracking-widest">
                           <Download className="w-3 h-3" /> Export Logs
                         </button>
                         <button 
                           onClick={() => router.push('/admin/onboarding')}
                           className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-[9px] font-bold hover:bg-white/90 transition-all uppercase tracking-widest"
                         >
                           <Plus className="w-3 h-3" /> New Customer
                         </button>
                      </div>
                   </div>
                </div>

                {/* Requirement 1: NEW CONTROL LAYER (JUST BELOW TITLE) */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4 px-6 bg-white/[0.02] border border-white/5 rounded-2xl relative overflow-hidden">
                   {/* Scanning Beam Animation */}
                   <AnimatePresence>
                      {isScanning && (
                         <motion.div 
                           initial={{ x: '-100%' }}
                           animate={{ x: '100%' }}
                           transition={{ duration: 0.6, ease: "linear" }}
                           className="absolute inset-0 bg-gradient-to-r from-transparent via-[#4ade80]/10 to-transparent pointer-events-none z-0"
                         />
                      )}
                   </AnimatePresence>

                   {/* Project Level Filters */}
                   <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 z-10">
                      {([
                         { id: 'ALL', label: 'ALL NODES' },
                         { id: 'STARTUP', label: 'PROJET STARTUP' },
                         { id: 'BUSINESS', label: 'PROJET BUSINESS' },
                         { id: 'ENTERPRISE', label: 'PROJET ENTREPRISE' },
                         { id: 'ELITE', label: 'PROJET ELITE' }
                      ] as const).map((p) => (
                         <button 
                           key={p.id}
                           onClick={() => setPlanFilter(p.id)}
                           className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                             planFilter === p.id 
                             ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                             : 'text-white/20 hover:text-white/40'
                           }`}
                         >
                           {p.label} <span className="opacity-40 ml-1">[{p.id === 'ALL' ? clients.length : clients.filter(c => c.package_type === p.id).length}]</span>
                         </button>
                      ))}
                   </div>

                   {/* Neural Search Bar */}
                   <div className="flex-1 max-w-2xl relative z-10 mx-auto">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                         <Search className="w-3.5 h-3.5" />
                      </div>
                      <input 
                        type="text"
                        placeholder="Search by Company Name or Price..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/60 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-[10px] font-mono text-white placeholder:text-white/10 focus:border-[#4ade80]/40 transition-all outline-none"
                      />
                   </div>
                </div>

                {/* Requirement 1: PRIORITY FILTER SYSTEM (TAB STYLE) */}
                <div className="flex flex-wrap gap-2">
                   {([
                      { id: 'ALL', label: 'ALL', color: 'white' },
                      { id: 'CRITICAL', label: 'CRITICAL', color: '#ef4444' },
                      { id: 'WARNING', label: 'WARNING', color: '#fbbf24' },
                      { id: 'MESSAGE', label: 'MESSAGES', color: '#3b82f6' },
                      { id: 'OPTIMAL', label: 'STABLE', color: '#4ade80' }
                   ] as const).map((f) => {
                      const count = f.id === 'ALL' 
                          ? clients.length 
                          : clients.filter(c => c.status === (f.id === 'OPTIMAL' ? 'STABLE' : f.id)).length;
                      
                      return (
                         <button 
                           key={f.id}
                           onClick={() => setOracleFilter(f.id)}
                           className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 border ${
                             oracleFilter === f.id 
                             ? 'bg-white/10 text-white border-white/20' 
                             : 'bg-black/40 text-white/20 border-white/5 hover:border-white/10'
                           }`}
                         >
                           <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: f.color }} />
                           {f.label} 
                           {count > 0 && <span className="opacity-40 tabular-nums">[{count}]</span>}
                         </button>
                      );
                   })}
                </div>

                <div className="bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="border-b border-white/5 bg-[#111111]/30">
                            <th className="p-5 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Client Cluster</th>
                            <th className="p-5 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Fleet Status</th>
                            <th className="p-5 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Last Event</th>
                            <th className="p-5 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Comm Mode</th>
                            <th className="p-5 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Region</th>
                            <th className="p-5 w-12 text-right"></th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.02]">
                         {(() => {
                           const filtered = clients
                             .filter(c => {
                                const matchesStatus = oracleFilter === 'ALL' || c.status === oracleFilter || (oracleFilter === 'STABLE' && c.status === 'STABLE');
                                const matchesPlan = planFilter === 'ALL' || c.package_type === planFilter;
                                
                                const cleanSearch = searchQuery.toLowerCase().trim();
                                const matchesName = c.name.toLowerCase().includes(cleanSearch);
                                const matchesId = c.id.toLowerCase().includes(cleanSearch);
                                
                                return matchesStatus && matchesPlan && (matchesName || matchesId);
                             });

                           if (filtered.length === 0) {
                              return (
                                 <tr>
                                    <td colSpan={6} className="p-20 text-center">
                                       <div className="space-y-4">
                                          <div className="w-12 h-12 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center mx-auto opacity-20">
                                             <Shield className="w-6 h-6 text-[#ef4444]" />
                                          </div>
                                          <div className="space-y-1">
                                             <p className="text-[11px] font-black text-[#ef4444] uppercase tracking-[0.4em]">ERROR: No Neural Node Detected</p>
                                             <p className="text-[9px] text-white/20 font-mono uppercase tracking-[0.2em]">Check cluster parameters or search queries</p>
                                          </div>
                                       </div>
                                    </td>
                                 </tr>
                              );
                           }

                           return filtered.map((client) => (
                           <tr 
                             key={client.id} 
                             onClick={() => {
                                console.log(`[SYSTEM_DIVE] Initializing redirect to Dashboard 2 for ${client.id}`);
                                setClickedRowId(client.id);
                                
                                // Store context for Dashboard 2
                                localStorage.setItem('AUTOSLASH_CURRENT_ENTERPRISE', client.id);
                                
                                // Visual feedback delay before transition
                                setTimeout(() => {
                                  router.push(`/admin/system/${client.id}`);
                                  setClickedRowId(null);
                                }, 300);
                             }}
                             className={`group cursor-pointer transition-all border-l-2 ${
                               clickedRowId === client.id 
                               ? 'bg-white/10 border-[#4ade80] shadow-[inset_10px_0_30px_rgba(74,222,128,0.05)]' 
                               : 'hover:bg-white/[0.02] border-transparent'
                             }`}
                           >
                              <td className="p-5">
                                 <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-black border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/20 group-hover:border-[#4ade80]/40 transition-colors">
                                       {client.name.substring(0, 2)}
                                    </div>
                                    <div className="space-y-1">
                                       <p className="text-[11px] font-bold text-white group-hover:text-[#4ade80] transition-colors">{client.name}</p>
                                       <div className="flex items-center gap-2">
                                          <p className="text-[9px] text-white/20 font-mono tracking-tighter uppercase">{client.id.substring(0, 8)} | {client.package_type}</p>
                                          <div className="w-1 h-1 rounded-full bg-white/10" />
                                          <p className="text-[9px] text-[#4ade80]/60 font-mono tabular-nums">Status: {client.status}</p>
                                       </div>
                                    </div>
                                 </div>
                              </td>
                              <td className="p-5 relative group/status">
                                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/5 w-fit group-hover:border-white/20 transition-all">
                                    <div className="w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ backgroundColor: GET_STATUS_COLOR(client.status) }} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: GET_STATUS_COLOR(client.status) }}>
                                       {client.status}
                                    </span>
                                 </div>

                                 {/* Tooltip mapping */}
                                 <div className="absolute left-1/2 -top-12 -translate-x-1/2 opacity-0 group-hover/status:opacity-100 pointer-events-none transition-all duration-300 z-[100]">
                                    <div className="bg-[#0f0f0f] border border-white/10 px-4 py-3 rounded-lg shadow-2xl backdrop-blur-2xl whitespace-nowrap min-w-[200px]">
                                       <div className="flex items-center justify-between mb-2">
                                          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: GET_STATUS_COLOR(client.status) }}>{client.lastEvent?.type || 'CORE'}</span>
                                          <span className="text-[8px] font-mono text-white/20 tabular-nums">{client.lastEvent ? formatNeuralTime(client.lastEvent.timestamp) : 'N/A'}</span>
                                       </div>
                                       <p className="text-[10px] text-white/60 font-mono mb-2 lowercase leading-tight">{client.lastEvent?.description || 'system status monitoring active'}</p>
                                       <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                                          <span className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">Status Longevity</span>
                                          <span className="text-[8px] font-bold text-[#4ade80] tabular-nums">ACTIVE FOR {client.lastEvent ? calculateElapsed(client.lastEvent.timestamp) : '0h'}</span>
                                       </div>
                                    </div>
                                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white/10 mx-auto" />
                                 </div>
                              </td>
                              <td className="p-5">
                                 <div className="space-y-1">
                                    <p className="text-[10px] font-mono text-white/40 truncate max-w-[180px]">{client.lastEvent?.description?.toLowerCase() || 'monitoring...'}</p>
                                    <p className="text-[8px] text-white/10 font-mono">{client.lastEvent ? formatNeuralTime(client.lastEvent.timestamp) : ''}</p>
                                 </div>
                              </td>
                              <td className="p-5">
                                 <div className="flex items-center gap-2">
                                    <div className={`px-2 py-1 rounded text-[8px] font-bold tracking-[0.2em] uppercase border ${client.comm_mode === 'AUTONOMOUS' ? 'text-white/40 border-white/5' : 'text-[#3b82f6] border-[#3b82f6]/20 bg-[#3b82f6]/5'}`}>
                                       {client.comm_mode || 'AUTONOMOUS'}
                                    </div>
                                 </div>
                              </td>
                              <td className="p-5">
                                 <span className="text-[10px] font-mono text-white/20 tracking-widest">{client.region}</span>
                              </td>
                              <td className="p-5 text-right">
                                 <MoreHorizontal className="w-4 h-4 text-white/10 group-hover:text-white/40 transition-all inline-block" />
                              </td>
                           </tr>
                         ));
                       })()}
                      </tbody>
                   </table>
                </div>

                <div className="flex items-center justify-between">
                   <p className="text-[9px] font-mono text-white/10 uppercase tracking-[0.3em]">
                      Showing {(() => {
                         const filtered = clients.filter(c => {
                            const matchesStatus = oracleFilter === 'ALL' || c.status === oracleFilter || (oracleFilter === 'STABLE' && c.status === 'STABLE');
                            const matchesPlan = planFilter === 'ALL' || c.package_type === planFilter;
                            const cleanSearch = searchQuery.toLowerCase().trim();
                            const matchesName = c.name.toLowerCase().includes(cleanSearch);
                            const matchesId = c.id.toLowerCase().includes(cleanSearch);
                            return matchesStatus && matchesPlan && (matchesName || matchesId);
                         });
                         return filtered.length;
                      })()} active neural nodes
                   </p>
                   <div className="flex gap-2">
                      <button className="w-8 h-8 flex items-center justify-center border border-white/5 rounded-lg text-white/20 bg-white/[0.02] cursor-not-allowed">
                         <ChevronRight className="w-4 h-4 rotate-180" />
                      </button>
                      <button className="w-8 h-8 flex items-center justify-center border border-white/5 rounded-lg text-white/40 bg-white/5 hover:bg-white/10 transition-all">
                         <ChevronRight className="w-4 h-4" />
                      </button>
                   </div>
                </div>
             </div>

          </div>
      
      {/* TOAST SYSTEM */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={`fixed bottom-12 left-1/2 z-[200] px-10 py-5 rounded-full border border-white/10 backdrop-blur-2xl flex items-center gap-4 shadow-2xl ${
              toast.type === 'success' ? 'text-green-400' : 'text-red-400'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${toast.type === 'success' ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </DoubleRibbonIntelligent>
    </>
  );
}
