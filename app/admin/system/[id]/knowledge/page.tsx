"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  FileText as FileTextIcon, 
  Globe as GlobeIcon, 
  MessageSquare, 
  BarChart3, 
  Shield as ShieldIcon,
  Plus,
  Search,
  Database,
  Lock,
  Unlock,
  MoreVertical,
  Trash2,
  Archive,
  Edit,
  Clock,
  ExternalLink,
  Tag,
  Check,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  X,
  Zap
} from 'lucide-react';

// --- TYPES & INTERFACES ---
interface KBNode {
  id: string;
  enterprise_id: string;
  content: string;
  category: string;
  type: string; // DOCUMENT / URL / TEXT / CONVERSATION / SPREADSHEET
  sensitivity_level: string; // PUBLIC / INTERNAL / RESTRICTED / CONFIDENTIAL
  agent_access: any; // "ALL" ou array de agent_id
  expires_at: string | null;
  last_used_at: string | null;
  usage_count: number;
  relevance_score: number;
  is_locked: boolean;
  source_url: string | null;
  file_path: string | null;
  tags: string[];
  title: string | null;
  created_at: string;
}

interface Agent {
  id: string;
  name: string;
  avatar_url: string | null;
  status: string;
}

// --- HELPER COMPONENTS ---

function MetricCard({ title, value, subValue, icon: Icon, colorClass, shadowColor }: any) {
  return (
    <div className={`bg-[#080808] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-white/20 transition-all ${shadowColor}`}>
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-16 h-16 text-white" />
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Icon className={`w-4 h-4 ${colorClass}`} />
          <span className="text-[10px] font-bold text-white/40 tracking-[0.2em] uppercase">{title}</span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-normal text-white tracking-tighter">{value}</span>
          {subValue && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${colorClass} bg-white/5`}>{subValue}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function SensitivityBadge({ level }: { level: string }) {
  const configs: Record<string, { bg: string, text: string, label: string }> = {
    PUBLIC: { bg: 'bg-[#4ade80]/10', text: 'text-[#4ade80]', label: 'PUBLIC' },
    INTERNAL: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'INTERNAL' },
    RESTRICTED: { bg: 'bg-orange-500/10', text: 'text-orange-400', label: 'RESTRICTED' },
    CONFIDENTIAL: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'CONFIDENTIAL' }
  };
  const config = configs[level] || configs.INTERNAL;
  return (
    <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-widest ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

// --- MAIN PAGE COMPONENT ---

export default function EnterpriseKnowledgeBase() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [nodes, setNodes] = useState<KBNode[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('VUE_GLOBALE');
  const [showInjectModal, setShowInjectModal] = useState(false);
  const [editingNode, setEditingNode] = useState<KBNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'TEXT',
    sensitivity_level: 'INTERNAL',
    selectedAgents: [] as string[],
    is_locked: false,
    expires_at: '',
    tags: [] as string[],
    tagInput: ''
  });

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      try {
        const { data: kbData, error: kbError } = await supabase
          .from('enterprise_kb')
          .select('*')
          .eq('enterprise_id', id)
          .order('created_at', { ascending: false });
        
        if (kbError) throw kbError;

        const { data: agentsData, error: agentsError } = await supabase
          .from('agents')
          .select('id, name, avatar_url, status')
          .eq('enterprise_id', id);

        if (agentsError) throw agentsError;

        setNodes(kbData || []);
        setAgents(agentsData || []);
      } catch (err) {
        console.error('Error loading KB data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const saveNode = async () => {
    const supabase = createClient();
    const payload = {
      enterprise_id: id,
      title: formData.title,
      content: formData.content,
      type: formData.type,
      category: formData.type, // Map category to type for now
      sensitivity_level: formData.sensitivity_level,
      agent_access: formData.sensitivity_level === 'PUBLIC' ? 'ALL' 
        : formData.sensitivity_level === 'RESTRICTED' ? formData.selectedAgents 
        : formData.sensitivity_level === 'CONFIDENTIAL' ? [] : 'ALL',
      is_locked: formData.is_locked,
      expires_at: formData.expires_at || null,
      relevance_score: 100,
      usage_count: 0,
      tags: formData.tags || []
    };

    try {
      if (editingNode) {
        const { data, error } = await supabase
          .from('enterprise_kb')
          .update(payload)
          .eq('id', editingNode.id)
          .select()
          .single();
        if (error) throw error;
        setNodes(prev => prev.map(n => n.id === data.id ? data : n));
      } else {
        const { data, error } = await supabase
          .from('enterprise_kb')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setNodes(prev => [data, ...prev]);
      }
      setShowInjectModal(false);
      setEditingNode(null);
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    }
  };

  const deleteNode = async (nodeId: string) => {
    if (!confirm('Supprimer ce nœud de connaissance ?')) return;
    const supabase = createClient();
    try {
      const { error } = await supabase.from('enterprise_kb').delete().eq('id', nodeId);
      if (error) throw error;
      setNodes(prev => prev.filter(n => n.id !== nodeId));
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    }
  };

  const archiveNode = async (node: KBNode) => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('enterprise_kb')
        .update({ relevance_score: 0 })
        .eq('id', node.id)
        .select()
        .single();
      if (error) throw error;
      setNodes(prev => prev.map(n => n.id === data.id ? data : n));
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    }
  };

  const openInjectModal = (node: KBNode | null = null) => {
    if (node) {
      setEditingNode(node);
      setFormData({
        title: node.title || '',
        content: node.content,
        type: node.type,
        sensitivity_level: node.sensitivity_level,
        selectedAgents: Array.isArray(node.agent_access) ? node.agent_access : [],
        is_locked: node.is_locked,
        expires_at: node.expires_at || '',
        tags: node.tags || [],
        tagInput: ''
      });
    } else {
      setEditingNode(null);
      setFormData({
        title: '',
        content: '',
        type: activePage === 'DOCUMENTS' ? 'DOCUMENT' : activePage === 'SOURCES_WEB' ? 'URL' : activePage === 'CONVERSATIONS' ? 'CONVERSATION' : 'TEXT',
        sensitivity_level: 'INTERNAL',
        selectedAgents: [],
        is_locked: false,
        expires_at: '',
        tags: [],
        tagInput: ''
      });
    }
    setShowInjectModal(true);
  };

  const toggleAgentAccess = (agentId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedAgents: prev.selectedAgents.includes(agentId)
        ? prev.selectedAgents.filter(id => id !== agentId)
        : [...prev.selectedAgents, agentId]
    }));
  };

  const addTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: ''
      }));
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // --- RENDERING HELPERS ---

  const renderSidebar = () => {
    const navItems = [
      { id: 'VUE_GLOBALE', label: 'Vue Globale', icon: LayoutDashboard }, 
      { id: 'DOCUMENTS', label: 'Documents', icon: FileTextIcon },
      { id: 'SOURCES_WEB', label: 'Sources Web', icon: GlobeIcon },
      { id: 'CONVERSATIONS', label: 'Conversations', icon: MessageSquare },
      { id: 'DONNÉES_MÉTIER', label: 'Données Métier', icon: Database },
      { id: 'DONNÉES_SENSIBLES', label: 'Sécurité', icon: ShieldIcon },
    ];

    return (
      <aside className="w-64 border-r border-white/5 h-full flex flex-col pt-12 pb-24">
        <div className="px-6 mb-12">
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] mb-4">Navigation_Locus</p>
        </div>
        <nav className="flex-1 space-y-2 px-3">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all font-mono font-bold uppercase text-[10px] tracking-widest ${
                  isActive 
                    ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-[0_0_20px_rgba(168,85,247,0.05)]' 
                    : 'text-white/20 hover:text-white/60 hover:bg-white/5'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    );
  };

  const renderOverview = () => {
    const activeNodesCount = nodes.filter(n => n.relevance_score > 0).length;
    const now = new Date();
    const expiredCount = nodes.filter(n => n.expires_at && new Date(n.expires_at) < now).length;
    const renewalCount = nodes.filter(n => n.relevance_score < 30 && n.relevance_score > 0).length;
    const avgFreshness = nodes.length > 0 
      ? Math.round(nodes.reduce((acc, curr) => acc + (curr.relevance_score || 0), 0) / nodes.length) 
      : 0;

    const freshnessColor = avgFreshness > 70 ? 'text-[#4ade80]' : avgFreshness > 40 ? 'text-orange-400' : 'text-red-400';

    return (
      <div className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Nœuds Actifs" 
            value={activeNodesCount} 
            icon={Database} 
            colorClass="text-[#4ade80]" 
          />
          <MetricCard 
            title="A Renouveler" 
            value={renewalCount} 
            subValue="CRITICAL"
            icon={TrendingUp} 
            colorClass="text-orange-400"
            shadowColor="shadow-[0_0_15px_rgba(251,146,60,0.05)]"
          />
          <MetricCard 
            title="Expirés" 
            value={expiredCount} 
            subValue="ALERT"
            icon={Clock} 
            colorClass="text-red-500"
            shadowColor="shadow-[0_0_15px_rgba(239,68,68,0.05)]"
          />
          <MetricCard 
            title="Fraîcheur Global" 
            value={`${avgFreshness}%`} 
            icon={Zap} 
            colorClass={freshnessColor} 
          />
        </div>

        <div className="space-y-8">
           <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-[0.3em]">Nouveautés_Locus</h2>
              <button 
                onClick={() => openInjectModal()}
                className="px-5 py-2.5 bg-violet-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Injecter_Données
              </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nodes.slice(0, 6).map(node => (
                <div 
                  key={node.id}
                  onClick={() => openInjectModal(node)}
                  className="bg-[#080808] border border-white/10 p-6 rounded-2xl group hover:border-violet-500/40 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <SensitivityBadge level={node.sensitivity_level} />
                    {node.is_locked ? <Lock className="w-3 h-3 text-white/20" /> : <Unlock className="w-3 h-3 text-white/10" />}
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-white/80 line-clamp-2 min-h-[32px]">
                      {node.title || node.content.substring(0, 60) + '...'}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">{node.type}</span>
                      <span className="text-[8px] font-mono text-white/20">Score: {node.relevance_score}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${node.relevance_score}%` }}
                        className={`h-full ${node.relevance_score > 70 ? 'bg-[#4ade80]' : node.relevance_score > 40 ? 'bg-orange-400' : 'bg-red-400'}`}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                       <span className="text-[8px] text-white/10 uppercase">Vu: {node.last_used_at ? new Date(node.last_used_at).toLocaleDateString() : 'Jamais'}</span>
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={(e) => { e.stopPropagation(); archiveNode(node); }} className="p-1.5 hover:text-orange-400 text-white/20 transition-colors"><Archive className="w-3 h-3" /></button>
                         <button onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} className="p-1.5 hover:text-red-500 text-white/20 transition-colors"><Trash2 className="w-3 h-3" /></button>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  };

  const renderSection = (typeFilter: string[] | string) => {
    let filteredNodes = nodes;
    if (activePage === 'DONNÉES_SENSIBLES') {
      filteredNodes = nodes.filter(n => ['RESTRICTED', 'CONFIDENTIAL'].includes(n.sensitivity_level));
    } else {
      filteredNodes = nodes.filter(n => Array.isArray(typeFilter) ? typeFilter.includes(n.type) : n.type === typeFilter);
    }

    if (searchQuery) {
      filteredNodes = filteredNodes.filter(n => n.content.toLowerCase().includes(searchQuery.toLowerCase()) || n.title?.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
             <h2 className="text-sm font-bold text-white uppercase tracking-[0.3em]">{activePage.replace(/_/g, ' ')}</h2>
             <p className="text-[10px] text-white/40 italic">Filtrage neuronal par cluster {activePage}</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="SCAN_CLUSTER..."
                  className="bg-black border border-white/10 rounded-xl pl-12 pr-6 py-3 text-[10px] font-bold text-white outline-none focus:border-violet-500/40 w-full sm:w-64 transition-all"
                />
             </div>
             <button 
                onClick={() => openInjectModal()}
                className="px-6 py-3 bg-violet-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Injecter
              </button>
          </div>
        </div>

        {activePage === 'DONNÉES_SENSIBLES' && (
          <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl flex items-center gap-4">
            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
            <p className="text-xs text-red-400 font-mono italic">Ces données sont protégées — modification réservée à l'administrateur système.</p>
          </div>
        )}

        <div className="space-y-4">
          {filteredNodes.length > 0 ? filteredNodes.map(node => (
            <div 
              key={node.id}
              className="bg-[#080808] border border-white/5 p-6 rounded-2xl hover:border-violet-500/40 transition-all group relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-5 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0`}>
                    {node.type === 'DOCUMENT' ? <FileTextIcon className="w-5 h-5 text-blue-400" /> :
                     node.type === 'URL' ? <GlobeIcon className="w-5 h-5 text-violet-400" /> :
                     node.type === 'CONVERSATION' ? <MessageSquare className="w-5 h-5 text-[#4ade80]" /> :
                     node.type === 'SPREADSHEET' ? <BarChart3 className="w-5 h-5 text-orange-400" /> :
                     <Database className="w-5 h-5 text-white/40" />}
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-bold text-white/90 truncate">{node.title || "NODE_DATA_UNTITLED"}</h3>
                      <SensitivityBadge level={node.sensitivity_level} />
                      {node.is_locked && <Lock className="w-3 h-3 text-white/20" />}
                    </div>
                    {/* Content Preview with optional Blur for Confidential */}
                    <p className={`text-[11px] font-mono text-white/40 line-clamp-1 italic ${node.sensitivity_level === 'CONFIDENTIAL' && node.is_locked ? 'blur-[4px] select-none' : ''}`}>
                      {node.content}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-8 shrink-0">
                  <div className="hidden lg:flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold text-white/60">{node.relevance_score}%</span>
                    <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-violet-500" style={{ width: `${node.relevance_score}%` }} />
                    </div>
                  </div>
                  
                  <div className="hidden sm:flex flex-col items-end text-right">
                    <span className="text-[10px] text-white/20 uppercase tracking-widest leading-none mb-1">Expires</span>
                    <span className="text-[10px] font-bold text-white/40 uppercase">
                      {node.expires_at ? `${Math.ceil((new Date(node.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} Days` : '∞'}
                    </span>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <button 
                      onClick={() => openInjectModal(node)}
                      disabled={node.is_locked}
                      className={`p-2 rounded-lg bg-white/5 hover:text-violet-400 transition-all ${node.is_locked ? 'cursor-not-allowed opacity-20' : ''}`}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteNode(node.id)}
                      disabled={node.is_locked}
                      className={`p-2 rounded-lg bg-white/5 hover:text-red-500 transition-all ${node.is_locked ? 'cursor-not-allowed opacity-20' : ''}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-white/10 hover:text-white"><MoreVertical className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>

              {/* Expandable Preview on Hover (Simple display) */}
              <div className="mt-4 pt-4 border-t border-white/5 hidden group-hover:block animate-in fade-in slide-in-from-top-1 duration-200">
                 <div className="flex flex-wrap gap-2 mb-4">
                    {node.tags?.map(tag => (
                      <span key={tag} className="text-[8px] font-bold px-2 py-0.5 bg-white/5 text-white/40 rounded uppercase border border-white/5 tracking-widest">{tag}</span>
                    ))}
                 </div>
                 {node.source_url && (
                   <a href={node.source_url} target="_blank" rel="noreferrer" className="text-[10px] text-violet-400 hover:underline flex items-center gap-1 mb-2">
                     <ExternalLink className="w-3 h-3" /> {node.source_url}
                   </a>
                 )}
              </div>
            </div>
          )) : (
            <div className="py-24 border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-6 opacity-40">
               <Search className="w-12 h-12" />
               <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Aucun nœud détecté dans ce cluster</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-2 border-white/5 border-t-violet-500 rounded-full animate-spin shadow-[0_0_30px_rgba(168,85,247,0.2)]" />
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.5em] font-mono">Calibrating_Knowledge_Lattice...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono flex">
      {/* LOCAL SIDEBAR */}
      {renderSidebar()}

      {/* MAIN LAYOUT CONTENT */}
      <main className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* HEADER SECTION */}
          <div className="flex justify-between items-end mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-violet-400 rounded-full shadow-[0_0_10px_#a855f7] animate-pulse" />
                <span className="text-[10px] font-bold text-white/40 tracking-[0.4em] uppercase">
                  Enterprise Knowledge Base // Neural Core
                </span>
              </div>
              <h1 className="text-5xl font-normal text-white tracking-tighter uppercase">
                KNOWLEDGE_LATTICE
              </h1>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/20 uppercase tracking-widest mb-1">Enterprise_ID</p>
              <p className="text-xs font-bold text-white/60 tracking-wider font-mono uppercase">0X-{id?.substring(0,8).toUpperCase()}</p>
            </div>
          </div>

          {/* PAGE CONTENT SWITCHER */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activePage === 'VUE_GLOBALE' && renderOverview()}
              {activePage === 'DOCUMENTS' && renderSection(['DOCUMENT', 'SPREADSHEET'])}
              {activePage === 'SOURCES_WEB' && renderSection('URL')}
              {activePage === 'CONVERSATIONS' && renderSection('CONVERSATION')}
              {activePage === 'DONNÉES_MÉTIER' && renderSection('TEXT')}
              {activePage === 'DONNÉES_SENSIBLES' && renderSection([])}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* INJECTION / EDIT MODAL */}
      <AnimatePresence>
        {showInjectModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(168,85,247,0.1)]"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-violet-500/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/20">
                    <Database className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">
                      {editingNode ? 'Edit_Knowledge_Node' : 'Inject_Knowledge_Node'}
                    </h3>
                    <p className="text-[10px] text-white/40 italic uppercase tracking-wider">Calibration de cluster neuronal</p>
                  </div>
                </div>
                <button onClick={() => setShowInjectModal(false)} className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/40 hover:text-white transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Left Column: Content */}
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Node_Title</label>
                      <input 
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-black border border-white/10 rounded-xl px-6 py-4 text-xs font-bold text-white outline-none focus:border-violet-500/40 transition-all font-mono"
                        placeholder="Assign_Identification_Title"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Data_Lattice_Content</label>
                      <textarea 
                        value={formData.content}
                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                        className="w-full h-80 bg-black border border-white/10 rounded-xl px-6 py-6 text-xs font-mono text-white/80 leading-relaxed outline-none focus:border-violet-500/40 transition-all resize-none custom-scrollbar"
                        placeholder="Insert architectural knowledge data here..."
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Tags_Lattice</label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {formData.tags.map(tag => (
                          <span key={tag} className="flex items-center gap-2 px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[9px] font-bold rounded uppercase tracking-widest">
                            {tag}
                            <button onClick={() => removeTag(tag)} className="hover:text-white"><X className="w-2.5 h-2.5" /></button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={formData.tagInput}
                          onChange={(e) => setFormData({...formData, tagInput: e.target.value})}
                          onKeyDown={(e) => e.key === 'Enter' && addTag()}
                          className="flex-1 bg-black border border-white/10 rounded-lg px-4 py-2 text-[10px] text-white outline-none focus:border-violet-500/40"
                          placeholder="ADD_TAG..."
                        />
                        <button onClick={addTag} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white"><Plus className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Meta Data & Security */}
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Cluster_Type</label>
                        <select 
                          value={formData.type}
                          onChange={(e) => setFormData({...formData, type: e.target.value})}
                          className="w-full bg-black border border-white/10 rounded-xl px-6 py-4 text-[10px] font-bold text-white outline-none appearance-none cursor-pointer uppercase tracking-widest focus:border-violet-500/40"
                        >
                          <option value="TEXT">DONNÉES MÉTIER</option>
                          <option value="DOCUMENT">DOCUMENT</option>
                          <option value="SPREADSHEET">TABLEUR</option>
                          <option value="URL">SOURCE WEB</option>
                          <option value="CONVERSATION">CONVERSATION</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Sensitivity_Level</label>
                        <select 
                          value={formData.sensitivity_level}
                          onChange={(e) => setFormData({...formData, sensitivity_level: e.target.value})}
                          className="w-full bg-black border border-white/10 rounded-xl px-6 py-4 text-[10px] font-bold text-white outline-none appearance-none cursor-pointer uppercase tracking-widest focus:border-violet-500/40"
                        >
                          <option value="PUBLIC">PUBLIC</option>
                          <option value="INTERNAL">INTERNAL</option>
                          <option value="RESTRICTED">RESTRICTED</option>
                          <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-6 border border-white/5 bg-white/[0.02] rounded-2xl">
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Lock_Node_Consistency</h4>
                        <p className="text-[8px] text-white/40 uppercase">Immutabilité temporaire pour l'administrateur</p>
                      </div>
                      <button 
                        onClick={() => setFormData({...formData, is_locked: !formData.is_locked})}
                        className={`w-12 h-6 rounded-full transition-all relative ${formData.is_locked ? 'bg-violet-500' : 'bg-white/10'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.is_locked ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

                    {formData.sensitivity_level === 'RESTRICTED' && (
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Agents_Authorized_Lattice</label>
                        <div className="grid grid-cols-2 gap-2">
                          {agents.map(agent => {
                            const isSelected = formData.selectedAgents.includes(agent.id);
                            return (
                              <button
                                key={agent.id}
                                onClick={() => toggleAgentAccess(agent.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left group ${
                                  isSelected 
                                    ? 'border-violet-500/40 bg-violet-500/10 text-white' 
                                    : 'border-white/5 text-white/20 hover:border-white/10'
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] border border-white/10 group-hover:border-white/20 transition-all ${isSelected ? 'border-violet-500/40' : ''}`}>
                                  {agent.name[0]}
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-widest truncate flex-1">{agent.name}</span>
                                {isSelected && <Check className="w-3 h-3 text-violet-400" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Expiration_Neural_Path</label>
                      <input 
                        type="date"
                        value={formData.expires_at}
                        onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
                        className="w-full bg-black border border-white/10 rounded-xl px-6 py-4 text-xs font-bold text-white outline-none focus:border-violet-500/40 transition-all font-mono"
                      />
                    </div>

                    <div className="p-6 border border-violet-500/10 bg-violet-500/5 rounded-2xl">
                       <p className="text-[9px] text-[#4ade80]/60 uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                         <Zap className="w-3 h-3" /> Oracle_Calibration_Metrics
                       </p>
                       <p className="text-[8px] text-white/40 leading-relaxed uppercase tracking-wider">
                         L'injection de ce nœud augmentera la densité du Knowledge_Hub de 0.8% et mettra à jour les vecteurs de RAG pour tous les agents autorisés.
                       </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-white/5 flex justify-end gap-4 bg-black/40">
                <button 
                  onClick={() => setShowInjectModal(false)}
                  className="px-8 py-4 text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest transition-all"
                >
                  Cancel_Injection
                </button>
                <button 
                  onClick={saveNode}
                  className="px-12 py-4 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all flex items-center gap-3"
                >
                  <Zap className="w-4 h-4 fill-white" /> {editingNode ? 'Sync_Calibration' : 'Inject_Node'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
