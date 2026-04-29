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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  const [oracleFilter, setOracleFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'MESSAGE' | 'MESSAGES' | 'STABLE' | 'OPTIMAL'>('ALL');
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
  const [apiMonitor, setApiMonitor] = useState<any>(null);
  const [activeApis, setActiveApis] = useState<string[]>([]);
  const [monitorDays, setMonitorDays] = useState('30');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [activeSection3Tab, setActiveSection3Tab] = useState('API_MONITOR');
  const [growthIntel, setGrowthIntel] = useState<any>(null);
  const [modalStep, setModalStep] = useState(1);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [fleetData, setFleetData] = useState<any>(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    sector: '',
    region: '',
    plan: 'BUSINESS'
  });
  const [plansMetadata, setPlansMetadata] = useState<any[]>([]);

  const exportLogsCSV = () => {
    if (!fleetData?.clients) return;
    const headers = "ID,Name,Sector,Package,Region,Status,Tokens,Cost\n";
    const rows = fleetData.clients.map((c: any) => 
      `${c.id},${c.name},${c.sector},${c.package_type},${c.region},${c.status},${c.total_tokens_consumed},${c.monthly_cost}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'fleet_logs.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Debounced search function
  const debounceSearch = (fn: Function, ms: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), ms);
    };
  };

  const handleSearch = debounceSearch(async (q: string) => {
    setIsScanning(true);
    try {
      if (!q) {
        const res = await fetch('/api/admin/fleet');
        const data = await res.json();
        setFleetData(data);
      } else {
        const res = await fetch(`/api/admin/fleet/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setFleetData(data);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsScanning(false);
    }
  }, 300);

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
        const initialFleetJson = await fleetResponse.json();
        const fleetNodes = initialFleetJson.data;

        if (fleetNodes) {
          setClients(fleetNodes.map((node: any) => ({
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

        // 11. API Monitor
        const apiRes = await fetch(`/api/admin/api-monitor?days=${monitorDays}${selectedPlan ? `&plan=${selectedPlan}` : ''}`);
        const apiData = await apiRes.json();
        setApiMonitor(apiData);
        if (apiData.apiKeys && activeApis.length === 0) {
          setActiveApis(apiData.apiKeys);
        }

        // 12. Growth Intelligence
        const growthRes = await fetch('/api/admin/growth-intelligence');
        const growthData = await growthRes.json();
        setGrowthIntel(growthData);

         // 13. Fleet Data
         const fleetRes = await fetch('/api/admin/fleet');
         const fleetAdminJson = await fleetRes.json();
         setFleetData(fleetAdminJson);

         // 14. Plan Definitions for Modal
         const { data: plans } = await supabase.from('plan_definitions').select('*');
         if (plans) setPlansMetadata(plans);

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
    async function refreshApiMonitor() {
      try {
        const apiRes = await fetch(`/api/admin/api-monitor?days=${monitorDays}${selectedPlan ? `&plan=${selectedPlan}` : ''}`);
        const apiData = await apiRes.json();
        setApiMonitor(apiData);
        if (apiData.apiKeys && activeApis.length === 0) {
          setActiveApis(apiData.apiKeys);
        }
      } catch (err) {
        console.error("API_MONITOR_REFRESH_ERROR:", err);
      }
    }
    if (!booting) refreshApiMonitor();
  }, [monitorDays, selectedPlan]);

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

  const getUpsellMessage = (pkg: string, usage: number) => {
    if (pkg === 'BUSINESS' && usage > 80) return `Usage critique ${usage}% — Migration ENTERPRISE recommandée`
    if (pkg === 'ENTERPRISE' && usage > 80) return `Usage critique ${usage}% — Augmentation budget tokens recommandée`
    if (pkg === 'ELITE') return `Usage ${usage}% — Révision plan sur mesure recommandée`
    return `Usage ${usage}% — Surveiller consommation`
  }

  const getChurnMessage = (status: string, name: string) => {
    if (status === 'CRITICAL') return `${name} — Intervention immédiate requise`;
    if (status === 'WARNING') return `${name} — Surveillance renforcée activée`;
    return `${name} — Statut à surveiller`;
  }

  const filteredClients = (fleetData?.clients || [])
    .filter((c: any) => {
       const matchesStatus = oracleFilter === 'ALL' 
         || (oracleFilter === 'MESSAGES' ? c.unread_messages > 0 : c.status === oracleFilter);
       const matchesPlan = planFilter === 'ALL' || c.package_type === planFilter;
       return matchesStatus && matchesPlan;
    });

  const COLORS = ["#8B5CF6", "#3B82F6", "#F97316", "#10B981", "#EF4444", "#EC4899"];

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
                            <p className="text-[11px] font-bold text-white uppercase tracking-tighter">{agent.agent_id}</p>
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

             {/* SECTION 3: API MONITOR & GROWTH INTELLIGENCE */}
             <div className="space-y-4">
                {/* TABS HEADERS */}
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => setActiveSection3Tab('API_MONITOR')}
                     className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-3 border ${
                       activeSection3Tab === 'API_MONITOR' 
                       ? 'bg-[#111111] border-white/10 text-white shadow-[0_0_20px_rgba(0,0,0,0.5)]' 
                       : 'bg-transparent border-transparent text-white/20 hover:text-white/40'
                     }`}
                   >
                     <div className={`w-1.5 h-1.5 rounded-full ${activeSection3Tab === 'API_MONITOR' ? 'bg-[#4ade80] animate-pulse' : 'bg-white/10'}`} />
                     API MONITOR
                   </button>
                   
                   <button 
                     onClick={() => setActiveSection3Tab('GROWTH_INTEL')}
                     className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-3 border ${
                       activeSection3Tab === 'GROWTH_INTEL' 
                       ? 'bg-[#111111] border-white/10 text-white shadow-[0_0_20px_rgba(0,0,0,0.5)]' 
                       : 'bg-transparent border-transparent text-white/20 hover:text-white/40'
                     }`}
                   >
                     GROWTH INTELLIGENCE
                     {growthIntel?.totalOpportunities > 0 && (
                        <span className="px-1.5 py-0.5 bg-[#4ade80] text-black text-[8px] font-black rounded-sm flex items-center gap-1">
                           {growthIntel.totalOpportunities} <ChevronRight className="w-2 h-2" />
                        </span>
                     )}
                   </button>
                </div>

                <div className="min-h-[500px]">
                   {activeSection3Tab === 'API_MONITOR' ? (
                     <div className="p-8 bg-[#111111] border border-white/5 rounded-xl flex flex-col space-y-8 animate-in fade-in duration-500">
                        {/* N1: HEADER & PERIOD */}
                        <div className="flex justify-between items-start">
                           <div className="space-y-1">
                              <h3 className="text-xs font-bold text-white uppercase tracking-widest">API MONITORING SYSTEM</h3>
                              <div className="flex items-center gap-3">
                                 <p className="text-[9px] font-mono text-white/20 uppercase">Neural Traffic Control</p>
                                 {apiMonitor?.mostUsed && (
                                    <div className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded flex items-center gap-1.5">
                                       <span className="text-[7px] font-bold text-violet-400 uppercase tracking-widest">MOST USED:</span>
                                       <span className="text-[7px] font-mono text-white/80 uppercase">{apiMonitor.mostUsed}</span>
                                    </div>
                                 )}
                              </div>
                           </div>
                           
                           <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                              {['7', '30', '90'].map(d => (
                                <button
                                  key={d}
                                  onClick={() => setMonitorDays(d)}
                                  className={`px-4 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                                    monitorDays === d 
                                    ? 'bg-white/10 text-white' 
                                    : 'text-white/20 hover:text-white/40'
                                  }`}
                                >
                                  {d} DAYS
                               </button>
                            ))}
                         </div>
                      </div>

                      {/* GRAPH AREA */}
                      <div style={{ width: '100%', height: 300, marginTop: 16 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={apiMonitor?.dailyData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              {(apiMonitor?.apiKeys || []).map((api: string, index: number) => (
                                <linearGradient key={api} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.3} />
                                  <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0} />
                                </linearGradient>
                              ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                            <XAxis
                              dataKey="date"
                              tick={{ fill: '#4b5563', fontSize: 10, fontFamily: 'monospace' }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(val) => val.slice(5)}
                            />
                            <YAxis
                              tick={{ fill: '#4b5563', fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                              allowDecimals={false}
                            />
                            <Tooltip
                              contentStyle={{
                                background: '#0a0a0a',
                                border: '1px solid #1f2937',
                                borderRadius: '8px',
                                fontFamily: 'monospace',
                                fontSize: 12
                              }}
                              labelStyle={{ color: '#6b7280', marginBottom: 8, letterSpacing: 2 }}
                              itemStyle={{ color: '#e5e7eb' }}
                              formatter={(value: any, name: any) => [`${value} calls`, String(name || '').toUpperCase()]}
                              labelFormatter={(label) => `${label} UTC`}
                            />
                            {(apiMonitor?.apiKeys || []).map((api: string, index: number) =>
                              activeApis.includes(api) ? (
                                <Area
                                  key={api}
                                  type="monotone"
                                  dataKey={api}
                                  stroke={COLORS[index % COLORS.length]}
                                  strokeWidth={2}
                                  fill={`url(#gradient-${index})`}
                                  dot={{ r: 4, fill: COLORS[index % COLORS.length], strokeWidth: 0 }}
                                  activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                              ) : null
                            )}
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* FILTRES API — ICÔNES COMPACTES */}
                      <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center' }}>
                        {(apiMonitor?.apiKeys || []).map((api: string, index: number) => (
                          <button
                            key={api}
                            onClick={() => {
                              setActiveApis((prev: string[]) =>
                                prev.includes(api)
                                  ? prev.filter((a: string) => a !== api)
                                  : [...prev, api]
                              )
                            }}
                            title={`${api} — ${apiMonitor?.totals?.[api] || 0} calls ce mois`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              background: 'transparent',
                              border: `1px solid ${activeApis.includes(api) ? COLORS[index % COLORS.length] : '#374151'}`,
                              borderRadius: 20,
                              padding: '4px 10px',
                              cursor: 'pointer',
                              opacity: activeApis.includes(api) ? 1 : 0.35,
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <span style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: COLORS[index % COLORS.length],
                              display: 'inline-block',
                              boxShadow: activeApis.includes(api)
                                ? `0 0 6px ${COLORS[index % COLORS.length]}`
                                : 'none'
                            }} />
                            <span style={{
                              fontSize: 10,
                              fontFamily: 'monospace',
                              color: activeApis.includes(api) ? COLORS[index % COLORS.length] : '#6b7280',
                              letterSpacing: 1
                            }}>
                              {api.split('-')[0].toUpperCase()}
                            </span>
                            <span style={{ fontSize: 9, color: '#4b5563' }}>
                              [{apiMonitor?.totals?.[api] || 0}]
                            </span>
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-col space-y-6 pt-6 border-t border-white/[0.03]">

                           {/* PLAN FILTERS */}
                           <div className="flex items-center gap-4">
                              <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">PLAN FILTER:</span>
                              <div className="flex gap-2">
                                 <button 
                                   onClick={() => setSelectedPlan(null)}
                                   className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border ${
                                     selectedPlan === null 
                                     ? 'bg-white/10 border-white/20 text-white' 
                                     : 'bg-black/40 border-white/5 text-white/10 hover:text-white/20'
                                   }`}
                                 >
                                   ALL
                                 </button>
                                 {apiMonitor?.availablePlans?.map((plan: string) => (
                                    <button 
                                      key={plan}
                                      onClick={() => setSelectedPlan(plan)}
                                      className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border ${
                                        selectedPlan === plan 
                                        ? 'bg-white/10 border-white/20 text-white' 
                                        : 'bg-black/40 border-white/5 text-white/10 hover:text-white/20'
                                      }`}
                                    >
                                      {plan}
                                    </button>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>
                   ) : (
                     <div className="p-8 bg-[#111111] border border-white/5 rounded-xl flex flex-col space-y-8 h-full animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest">GROWTH INTELLIGENCE</h3>
                            <p className="text-[9px] font-mono text-white/20 uppercase">Neural Ecosystem Optimization</p>
                          </div>
                          {growthIntel?.totalOpportunities > 0 && (
                            <div className="px-3 py-1 bg-[#4ade80]/10 border border-[#4ade80]/20 rounded-full flex items-center gap-2 animate-pulse">
                              <TrendingUp className="w-2.5 h-2.5 text-[#4ade80]" />
                              <span className="text-[10px] font-black text-[#4ade80] tracking-tighter">{growthIntel.totalOpportunities} OPPORTUNITIES DETECTION</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-8">
                          {/* UPSELL SECTION */}
                          <div className="space-y-4">
                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Revenue Opportunities</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {growthIntel?.upsellOpportunities?.map((item: any) => (
                                <div 
                                  key={item.enterprise_id}
                                  className="p-5 bg-black/20 border border-white/5 rounded-xl group hover:border-white/10 transition-all flex items-center justify-between cursor-pointer"
                                  onClick={() => router.push(`/admin/system/${item.enterprise_id}/settings`)}
                                >
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-white uppercase tracking-tight">{item.name}</p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] font-mono text-white/30 uppercase">{item.package_type}</span>
                                      <span className="text-white/10">•</span>
                                      <span className="text-[9px] font-mono text-orange-500/60">{item.usage_percent}% USAGE</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <p className="text-[9px] font-bold text-[#4ade80] uppercase tracking-tighter">UPSELL</p>
                                      <p className="text-[8px] font-mono text-white/20 uppercase">{getUpsellMessage(item.package_type, item.usage_percent)}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:translate-x-1 transition-all" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* CHURN RISK SECTION */}
                          <div className="space-y-4">
                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Retention Risks</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {growthIntel?.churnRisks?.map((item: any) => (
                                <div 
                                  key={item.enterprise_id}
                                  className="p-5 bg-black/20 border border-red-500/10 rounded-xl group hover:border-red-500/20 transition-all flex items-center justify-between cursor-pointer"
                                  onClick={() => router.push(`/admin/system/${item.enterprise_id}`)}
                                >
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-white uppercase tracking-tight">{item.name}</p>
                                    <p className="text-[9px] font-mono text-red-500/40 uppercase tracking-widest">{getChurnMessage(item.status, item.name)}</p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <p className="text-[9px] font-bold text-red-500 uppercase tracking-tighter">CHURN RISK</p>
                                      <p className="text-[8px] font-mono text-white/20 uppercase">Action Required</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:translate-x-1 transition-all" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {growthIntel?.totalOpportunities === 0 && (
                            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20 py-24">
                               <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center">
                                  <Check className="w-8 h-8" />
                                </div>
                                <p className="text-xs font-black uppercase tracking-[0.5em] text-center max-w-[300px]">
                                  ÉCOSYSTÈME OPTIMAL — AUCUNE ACTION REQUISE
                                </p>
                            </div>
                          )}
                        </div>
                     </div>
                   )}
                </div>
             </div>

             {/* SECTION 4: THE ORACLE COMMAND CENTER */}
             <div className="space-y-6">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div>
                    <h2 style={{ fontFamily: 'monospace', letterSpacing: 3, fontSize: 18 }}>
                      ORACLE COMMAND CENTER
                    </h2>
                    <p style={{ color: '#4b5563', fontSize: 11, fontFamily: 'monospace', letterSpacing: 2 }}>
                      Fleet Management & Multi-Tenant Neural Routing
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button 
                      onClick={() => router.push('/admin/fleet')}
                      className="px-4 py-2 border border-white/10 rounded-lg text-[9px] font-bold text-white/40 hover:bg-white/5 transition-all uppercase tracking-widest"
                    >
                      SEE MORE
                    </button>
                    <button 
                      onClick={() => exportLogsCSV()}
                      className="px-4 py-2 border border-white/5 rounded-lg text-[9px] font-bold text-white/40 hover:bg-white/5 transition-all uppercase tracking-widest"
                    >
                      EXPORT LOGS
                    </button>
                    <button 
                      onClick={() => setShowNewCustomerModal(true)}
                      className="px-4 py-2 bg-white text-black rounded-lg text-[9px] font-black hover:bg-white/90 transition-all uppercase tracking-widest"
                    >
                      + NEW CUSTOMER
                    </button>
                  </div>
                </div>

                {/* SEARCH & FILTERS LAYER */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4 px-6 bg-white/[0.01] border border-white/5 rounded-2xl relative overflow-hidden">
                   {/* Scanning Beam Animation */}
                   <AnimatePresence>
                      {isScanning && (
                         <motion.div 
                           initial={{ x: '-100%' }}
                           animate={{ x: '100%' }}
                           transition={{ duration: 0.6, ease: "linear", repeat: Infinity }}
                           className="absolute inset-0 bg-gradient-to-r from-transparent via-[#4ade80]/10 to-transparent pointer-events-none z-0"
                         />
                      )}
                   </AnimatePresence>

                   {/* PLAN FILTERS - DYNAMIC */}
                   <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 z-10 overflow-x-auto no-scrollbar">
                      <button 
                        onClick={() => setPlanFilter('ALL')}
                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                          planFilter === 'ALL' 
                          ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                          : 'text-white/20 hover:text-white/40'
                        }`}
                      >
                        ALL NODES
                      </button>
                      {fleetData?.availablePlans?.map((plan: string) => (
                         <button 
                           key={plan}
                           onClick={() => setPlanFilter(plan as any)}
                           className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                             planFilter === plan 
                             ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                             : 'text-white/20 hover:text-white/40'
                           }`}
                         >
                           {plan}
                         </button>
                      ))}
                   </div>

                   {/* SEARCH BAR */}
                   <div className="flex-1 max-w-2xl relative z-10">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                         <Search className="w-4 h-4" />
                      </div>
                      <input 
                        type="text"
                        placeholder="Rechercher par nom, statut, plan, région, secteur..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          handleSearch(e.target.value);
                        }}
                        className="w-full bg-black/60 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-[11px] font-mono text-white placeholder:text-white/10 focus:border-[#4ade80]/40 transition-all outline-none"
                      />
                   </div>
                </div>

                {/* STATUS TABS */}
                <div className="flex flex-wrap gap-2">
                   {([
                      { id: 'ALL', label: 'ALL', color: 'white' },
                      { id: 'CRITICAL', label: 'CRITICAL', color: '#ef4444' },
                      { id: 'WARNING', label: 'WARNING', color: '#fbbf24' },
                      { id: 'STABLE', label: 'STABLE', color: '#4ade80' },
                      { id: 'MESSAGES', label: 'MESSAGES', color: '#3b82f6' }
                   ] as const).map((f) => {
                      const count = f.id === 'ALL' 
                          ? fleetData?.clients?.length 
                          : f.id === 'MESSAGES'
                            ? fleetData?.clients?.filter((c: any) => c.unread_messages > 0).length
                            : fleetData?.clients?.filter((c: any) => c.status === f.id).length;
                      
                      return (
                         <button 
                           key={f.id}
                           onClick={() => setOracleFilter(f.id as any)}
                           className={`px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2.5 border ${
                             oracleFilter === f.id 
                             ? 'bg-white/10 text-white border-white/20' 
                             : 'bg-black/40 text-white/20 border-white/5 hover:border-white/10'
                           }`}
                         >
                           <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: f.color }} />
                           {f.label} 
                           {count > 0 && <span className="opacity-40 tabular-nums font-mono text-[9px]">[{count}]</span>}
                         </button>
                      );
                   })}
                </div>

                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="border-b border-white/5 bg-[#111111]/30">
                            <th className="p-6 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">CLIENT CLUSTER</th>
                            <th className="p-6 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">FLEET STATUS</th>
                            <th className="p-6 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">TOKEN USAGE</th>
                            <th className="p-6 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">INTELLIGENCE MODE</th>
                            <th className="p-6 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">REGION</th>
                            <th className="p-6 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">MONTHLY COST</th>
                            <th className="p-6 w-12 text-right"></th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.02]">
                         {filteredClients.length === 0 ? (
                            <tr>
                               <td colSpan={7} className="p-20 text-center">
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
                         ) : (
                            filteredClients.map((client: any) => (
                               <tr 
                                 key={client.id} 
                                 onClick={() => router.push(`/admin/system/${client.id}`)}
                                 onMouseEnter={(e) => {
                                   (e.currentTarget as HTMLElement).style.background = '#111827'
                                 }}
                                 onMouseLeave={(e) => {
                                   (e.currentTarget as HTMLElement).style.background = 'transparent'
                                 }}
                                 style={{ cursor: 'pointer', transition: 'background 0.2s ease', borderBottom: '1px solid #1f2937' }}
                                 className="group border-l-2 border-transparent hover:border-[#4ade80]/40 transition-colors"
                               >
                                  <td className="p-6">
                                     <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/5 flex items-center justify-center text-[12px] font-black text-white/40 group-hover:text-white group-hover:border-[#4ade80]/50 transition-all">
                                           {client.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="space-y-1">
                                           <p className="text-[12px] font-bold text-white group-hover:text-[#4ade80] transition-colors">{client.name}</p>
                                           <p className="text-[9px] text-white/20 font-mono tracking-tighter uppercase">{client.id.substring(0, 8)} • {client.package_type}</p>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="p-6">
                                     <div className={`px-3 py-1.5 rounded-full border w-fit flex items-center gap-2 ${
                                       client.status === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                       client.status === 'WARNING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                       'bg-green-500/10 border-green-500/20 text-green-500'
                                     }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${client.status === 'CRITICAL' ? 'animate-pulse bg-red-500' : client.status === 'WARNING' ? 'bg-amber-500' : 'bg-green-500'}`} />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">{client.status}</span>
                                     </div>
                                  </td>
                                  <td className="p-6 min-w-[150px]">
                                     <div className="space-y-2">
                                        <div className="flex justify-between text-[9px] font-mono text-white/30">
                                           <span className="uppercase tracking-widest">{client.token_usage_percent}% LOAD</span>
                                           <span className="font-bold">{(client.total_tokens_consumed / 1000).toFixed(0)}k / {(client.token_budget / 1000).toFixed(0)}k</span>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                           <motion.div 
                                             initial={{ width: 0 }}
                                             animate={{ width: `${Math.min(client.token_usage_percent, 100)}%` }}
                                             className={`h-full ${
                                               client.token_usage_percent > 80 ? 'bg-red-500' :
                                               client.token_usage_percent > 60 ? 'bg-orange-500' :
                                               'bg-green-500'
                                             }`}
                                           />
                                        </div>
                                     </div>
                                  </td>
                                  <td className="p-6" onClick={(e) => {
                                    e.stopPropagation();
                                    if (client.intelligence?.source_url) {
                                      router.push(client.intelligence.source_url);
                                    }
                                  }}>
                                     {client.intelligence?.severity ? (
                                       <div className="flex items-center gap-3 group/intel hover:bg-white/5 p-2 -m-2 rounded-lg transition-all">
                                          <div className={`p-2 rounded-lg ${
                                            client.intelligence.severity === 'CRITICAL' ? 'bg-red-500/20' :
                                            client.intelligence.severity === 'WARNING' ? 'bg-amber-500/20' :
                                            'bg-blue-500/20'
                                          }`}>
                                             {client.intelligence.type === 'SYSTEM_ERROR' && <Shield className="w-3.5 h-3.5 text-red-500" />}
                                             {client.intelligence.type === 'TOKEN_WARNING' && <Activity className="w-3.5 h-3.5 text-amber-500" />}
                                             {client.intelligence.type === 'MESSAGE' && <Users className="w-3.5 h-3.5 text-blue-500" />}
                                          </div>
                                          <div className="space-y-0.5">
                                             <p className={`text-[10px] font-bold uppercase tracking-tight ${
                                               client.intelligence.severity === 'CRITICAL' ? 'text-red-400' :
                                               client.intelligence.severity === 'WARNING' ? 'text-amber-400' :
                                               'text-blue-400'
                                             }`}>
                                               {client.intelligence.message}
                                             </p>
                                             <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest italic">
                                               {(() => {
                                                 const date = new Date(client.intelligence.created_at);
                                                 const diffMs = new Date().getTime() - date.getTime();
                                                 const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                                                 const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                                 if (diffDays > 0) return `Il y a ${diffDays} jours`;
                                                 if (diffHrs > 0) return `Il y a ${diffHrs}h`;
                                                 return "À l'instant";
                                               })()}
                                             </p>
                                          </div>
                                       </div>
                                     ) : (
                                       <div className="flex items-center gap-3 opacity-20 group-hover:opacity-100 transition-all">
                                          <Check className="w-3.5 h-3.5 text-green-500" />
                                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Système optimal</span>
                                       </div>
                                     )}
                                  </td>
                                  <td className="p-6">
                                     <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.2em]">{client.region || 'GLOBAL'}</span>
                                  </td>
                                  <td className="p-6">
                                     <p className="text-[12px] font-mono font-black text-white">
                                       {client.monthly_cost
                                         ? `${client.monthly_cost.toLocaleString('fr-FR')} FCFA`
                                         : '—'
                                       }
                                     </p>
                                  </td>
                                  <td className="p-6 text-right" onClick={(e) => e.stopPropagation()}>
                                     <div className="relative group/menu">
                                        <button className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/20 hover:text-white">
                                           <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-50 overflow-hidden">
                                           <button onClick={() => router.push(`/admin/system/${client.id}`)} className="w-full text-left px-5 py-3 text-[10px] font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all border-b border-white/5 uppercase tracking-widest">Voir Dashboard</button>
                                           <button onClick={() => router.push(`/admin/system/${client.id}/messages`)} className="w-full text-left px-5 py-3 text-[10px] font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all border-b border-white/5 uppercase tracking-widest">Envoyer message</button>
                                           <button onClick={() => router.push(`/admin/system/${client.id}/settings`)} className="w-full text-left px-5 py-3 text-[10px] font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest">Voir settings</button>
                                        </div>
                                     </div>
                                  </td>
                               </tr>
                            ))
                         )}
                      </tbody>
                   </table>
                </div>

                <div className="flex items-center justify-between py-4">
                   <p className="text-[10px] font-mono text-white/10 uppercase tracking-[0.4em]">
                      SHOWING <span className="text-white/40">{(fleetData?.clients || []).filter((c: any) => {
                                const matchesStatus = oracleFilter === 'ALL' 
                                  || (oracleFilter === 'MESSAGES' ? c.unread_messages > 0 : c.status === oracleFilter);
                                const matchesPlan = planFilter === 'ALL' || c.package_type === planFilter;
                                return matchesStatus && matchesPlan;
                             }).length}</span> OF <span className="text-white/40">{fleetData?.total || 0}</span> ACTIVE NEURAL NODES
                   </p>
                   <div className="flex gap-2">
                      <button className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white/20 uppercase tracking-[0.2em] cursor-not-allowed">PREV</button>
                      <button className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white/40 hover:text-white hover:bg-white/10 transition-all uppercase tracking-[0.2em]">NEXT</button>
                   </div>
                </div>
             </div>

          </div>
      
      {/* NEW CUSTOMER MODAL */}
      <AnimatePresence>
        {showNewCustomerModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewCustomerModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)]"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="space-y-1">
                  <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-white">Créer Nouveau Node</h2>
                  <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Étape {modalStep} sur 3</p>
                </div>
                <button 
                  onClick={() => setShowNewCustomerModal(false)}
                  className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center hover:bg-white/5 transition-all"
                >
                  <Plus className="w-4 h-4 rotate-45 text-white/40" />
                </button>
              </div>

              <div className="p-8">
                {modalStep === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Nom de l'entreprise</label>
                      <input 
                        type="text" 
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                        placeholder="ex: Neural Dynamics"
                        className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-[11px] font-mono text-white placeholder:text-white/10 focus:border-[#4ade80]/40 transition-all outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Secteur d'activité</label>
                        <input 
                          type="text" 
                          value={newCustomer.sector}
                          onChange={(e) => setNewCustomer({...newCustomer, sector: e.target.value})}
                          placeholder="ex: Fintech"
                          className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-[11px] font-mono text-white focus:border-[#4ade80]/40 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Région</label>
                        <input 
                          type="text" 
                          value={newCustomer.region}
                          onChange={(e) => setNewCustomer({...newCustomer, region: e.target.value})}
                          placeholder="ex: AF-WEST-1"
                          className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-[11px] font-mono text-white focus:border-[#4ade80]/40 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {modalStep === 2 && (
                  <div className="space-y-6">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Sélection du plan neural</label>
                    <div className="space-y-3">
                      {plansMetadata.filter(p => p.name !== 'STARTUP').map((plan) => (
                        <button 
                          key={plan.id}
                          onClick={() => setNewCustomer({...newCustomer, plan: plan.name})}
                          className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${
                            newCustomer.plan === plan.name 
                            ? 'bg-white/5 border-[#4ade80]/40 shadow-[0_0_30px_rgba(74,222,128,0.05)]' 
                            : 'bg-black border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-4 text-left">
                            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                               newCustomer.plan === plan.name ? 'border-[#4ade80]/20 text-[#4ade80]' : 'border-white/5 text-white/20'
                            }`}>
                              <Zap className="w-5 h-5" />
                            </div>
                            <div>
                              <p className={`text-[12px] font-black uppercase tracking-widest ${newCustomer.plan === plan.name ? 'text-white' : 'text-white/40'}`}>{plan.name}</p>
                              <p className="text-[9px] font-mono text-white/20 uppercase">Intelligence Avancée Incluse</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[14px] font-black font-mono text-white">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(plan.monthly_price)}</p>
                             <p className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">Par mois</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {modalStep === 3 && (
                  <div className="space-y-8 py-4">
                    <div className="flex flex-col items-center text-center space-y-4">
                       <div className="w-20 h-20 rounded-full border-2 border-[#4ade80]/20 bg-[#4ade80]/5 flex items-center justify-center">
                          <Shield className="w-10 h-10 text-[#4ade80] animate-pulse" />
                       </div>
                       <div className="space-y-1">
                          <h3 className="text-[14px] font-black uppercase tracking-[0.4em] text-white">Confirmation du Node</h3>
                          <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Prêt pour initialisation neurale</p>
                       </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
                       <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Entreprise</span>
                          <span className="text-[11px] font-mono font-bold text-white">{newCustomer.name}</span>
                       </div>
                       <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Secteur / Région</span>
                          <span className="text-[11px] font-mono font-bold text-white/60">{newCustomer.sector} • {newCustomer.region}</span>
                       </div>
                       <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Plan de Routing</span>
                          <span className="text-[11px] font-black text-[#4ade80] uppercase tracking-widest">{newCustomer.plan}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Tarification</span>
                          <span className="text-[14px] font-black font-mono text-white">
                             {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(plansMetadata.find(p => p.name === newCustomer.plan)?.monthly_price || 0)}
                          </span>
                       </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-8 pt-0 flex gap-4">
                 {modalStep > 1 && (
                    <button 
                      onClick={() => setModalStep(s => s - 1)}
                      className="flex-1 py-4 border border-white/10 rounded-xl text-[10px] font-black text-white/40 uppercase tracking-[0.4em] hover:bg-white/5 transition-all"
                    >
                      Précédent
                    </button>
                 )}
                 <button 
                   onClick={async () => {
                     if (modalStep < 3) {
                       setModalStep(s => s + 1);
                     } else {
                       // Handle Create Customer
                       setSaving(true);
                       try {
                         const res = await fetch('/api/admin/fleet/create', {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify(newCustomer)
                         });
                         const result = await res.json();
                         if (result.success) {
                           showToast('success', 'NODE_INITIALIZED: SUCCESS');
                           setShowNewCustomerModal(false);
                           // Refresh fleet
                           const fleetRes = await fetch('/api/admin/fleet');
                           const fleetJson = await fleetRes.json();
                           setFleetData(fleetJson);
                         } else {
                           showToast('error', 'INIT_FAIL: ' + result.error);
                         }
                       } catch (err) {
                         showToast('error', 'CONNECTION_TIMEOUT');
                       } finally {
                         setSaving(false);
                       }
                     }
                   }}
                   disabled={saving || (modalStep === 1 && !newCustomer.name)}
                   className="flex-[2] py-4 bg-[#4ade80] text-black rounded-xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#22c55e] transition-all disabled:opacity-50"
                 >
                   {saving ? 'INITIALIZING...' : modalStep === 3 ? 'CRÉER LE CLIENT' : 'Suivant'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
