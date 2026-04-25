"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Shield, 
  Search, 
  Image as ImageIcon, 
  FileText, 
  Upload, 
  ToggleLeft as Toggle, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  X,
  FileCode,
  File,
  Loader2,
  Cpu,
  Palette,
  CloudUpload,
  Leaf,
  Home,
  Shirt,
  Car,
  Utensils,
  GraduationCap,
  DollarSign,
  ShoppingBag,
  Plane,
  Truck,
  Building2,
  Laptop,
  Activity
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

const DOMAINS = [
  { id: 'AGRICULTURE', label: 'Agriculture / Ferme', icon: Leaf },
  { id: 'REAL_ESTATE', label: 'Real Estate / Immobilier', icon: Building2 },
  { id: 'FASHION', label: 'Fashion / Mode', icon: Shirt },
  { id: 'HEALTH', label: 'Health / Santé', icon: Activity },
  { id: 'ELECTRONICS', label: 'Electronics / Électronique', icon: Laptop },
  { id: 'AUTOMOBILE', label: 'Automobile / Voiture', icon: Car },
  { id: 'FOOD_BEVERAGE', label: 'Food & Beverage / Restauration', icon: Utensils },
  { id: 'EDUCATION', label: 'Education / Enseignement', icon: GraduationCap },
  { id: 'FINANCE', label: 'Finance / Banque', icon: DollarSign },
  { id: 'E_COMMERCE', label: 'E-Commerce / Vente en ligne', icon: ShoppingBag },
  { id: 'TRAVEL', label: 'Travel / Voyage', icon: Plane },
  { id: 'LOGISTICS', label: 'Logistics / Transport', icon: Truck },
];

type OnboardingStep = 1 | 2 | 3;

const MOCK_PROJECTS: Record<string, { name: string; level: string; agents: string[] }> = {
  "PRJ-772": {
    name: "Nexus Dynamics",
    level: "Projet Entreprise",
    agents: ["SUPPORT_AGENT", "DEV_AGENT", "ANALYSIS_CORE", "STRATEGY_UNIT", "NEXUS_VOICE"]
  },
  "PRJ-004": {
    name: "Aether Systems",
    level: "Projet Business",
    agents: ["CHRONOS_AGENT", "SUPPORT_HUB"]
  },
  "PRJ-119": {
    name: "Startup Alpha",
    level: "Projet Startup",
    agents: ["BASE_MINER"]
  }
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [projectId, setProjectId] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isSweep, setIsSweep] = useState(false);
  const [discoveredNode, setDiscoveredNode] = useState<null | { name: string; level: string; agents: string[] }>(null);
  const [scanError, setScanError] = useState("");
  const [logs, setLogs] = useState<string[]>(["[SYSTEM] STANDBY...", "[NETWORK] READY FOR LINK"]);

  // Branding State
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [brandColor, setBrandColor] = useState("#4ade80");
  const [business_domain, setBusinessDomain] = useState("");
  const [domainSearch, setDomainSearch] = useState("");
  const [isDomainOpen, setIsDomainOpen] = useState(false);

  // Files State
  const [files, setFiles] = useState<Array<{ id: string; name: string; type: string; label: string }>>([]);

  // Agents State
  const [agentConfigs, setAgentConfigs] = useState<Record<string, { online: boolean; instructions: string }>>({});

  // Finalizing state
  const [isFinalizing, setIsFinalizing] = useState(false);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-4), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleScan = () => {
    setIsScanning(true);
    setIsSweep(true);
    setScanError("");
    setDiscoveredNode(null);
    addLog("FETCHING DATABASE SCAN IN PROGRESS...");

    setTimeout(() => {
      setIsSweep(false);
      
      if (projectId.toUpperCase() === "TEST-99") {
        addLog("SYSTEM TEST KEY DETECTED. INJECTING MOCK DATA...");
        const mockNode = {
          name: "TEST_CORE_NODE",
          level: "Projet Entreprise",
          agents: ["ORACLE_CORE", "FLEET_MASTER", "NEURAL_SYNAPSE", "LOGIC_STREAM", "GHOST_SHELL"]
        };
        setDiscoveredNode(mockNode);
        setCompanyName(mockNode.name);
        const configs: any = {};
        mockNode.agents.forEach((a) => {
          configs[a] = { online: true, instructions: "TEST_OVERRIDE_ACTIVE" };
        });
        setAgentConfigs(configs);
        setIsScanning(false);
        addLog("LINK_ESTABLISHED: TEST_BYPASS_SUCCESS");
        return;
      }

      const node = MOCK_PROJECTS[projectId.toUpperCase()];
      if (node) {
        setDiscoveredNode(node);
        setCompanyName(node.name);
        addLog(`CONNECTION_SUCCESS: ${node.name.toUpperCase()} SYNCED`);
        const configs: any = {};
        node.agents.forEach(a => {
          configs[a] = { online: true, instructions: "" };
        });
        setAgentConfigs(configs);
      } else {
        setScanError("LINK_FAIL: PROJECT_ID NOT FOUND IN NEURAL LATTICE");
        addLog("LINK_ERROR: RESOURCE_NOT_FOUND");
      }
      setIsScanning(false);
    }, 1500);
  };

  const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(f => ({
        id: Math.random().toString(36).substr(2, 9),
        name: f.name,
        type: f.type,
        label: ""
      }));
      setFiles([...files, ...newFiles]);
    }
  };

  const handleFinalize = async () => {
    if (!discoveredNode) return;
    setIsFinalizing(true);
    
    try {
      const packageTypeMap: Record<string, string> = {
        "Projet Entreprise": "ENTERPRISE",
        "Projet Business": "BUSINESS",
        "Projet Startup": "STARTUP"
      };

      const packageType = packageTypeMap[discoveredNode.level] || "STARTUP";

      const { data, error } = await supabase
        .from('enterprises')
        .insert({
          name: companyName || discoveredNode.name,
          sector: business_domain || "GENERAL",
          package_type: packageType,
          region: "EU-WEST-1", // Default region
          comm_mode: "AUTONOMOUS",
          warning_flag: false,
          status: "STABLE",
          brand_color: brandColor,
          total_tokens_consumed: 0,
          token_budget: packageType === "ENTERPRISE" ? 10000000 : 1000000
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        addLog(`SYNC_SUCCESS: ENTERPRISE_ID: ${data.id}`);
        
        // Optional: Pre-create agents if needed or handle via SystemContext
        
        setTimeout(() => {
          router.push(`/admin/system/${data.id}`);
        }, 2000);
      }
    } catch (error) {
      console.error("Finalize error:", error);
      addLog(`SYNC_ERROR: ${error instanceof Error ? error.message : "DATABASE_FAILURE"}`);
      setIsFinalizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans selection:bg-[#4ade80] selection:text-black flex flex-col overflow-hidden relative">
      {/* NEURAL GRID BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute inset-0 bg-[#050505]" />
         <div className="absolute inset-0 opacity-[0.03]" 
              style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
         <motion.div 
           className="absolute inset-0 bg-gradient-to-t from-[#4ade80]/10 via-transparent to-transparent"
           animate={{ opacity: [0.05, 0.1, 0.05] }}
           transition={{ duration: 4, repeat: Infinity }}
         />
      </div>

      {/* SEARCH SWEEP ANIMATION */}
      <AnimatePresence>
         {isSweep && (
           <motion.div 
             initial={{ top: "-100%" }}
             animate={{ top: "100%" }}
             transition={{ duration: 1.5, ease: "linear" }}
             className="fixed inset-x-0 h-40 bg-gradient-to-b from-transparent via-[#4ade80]/20 to-transparent z-[60] pointer-events-none"
           />
         )}
      </AnimatePresence>
      
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* TERMINAL STATUS LOG */}
        <div className="fixed bottom-10 left-10 w-72 p-4 bg-black/60 border border-white/5 rounded-2xl backdrop-blur-3xl z-[100] group shadow-2xl">
           <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                 <div className="w-1 h-1 rounded-full bg-[#4ade80] animate-pulse" />
                 <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em] font-mono">Neural_Status_Log</span>
              </div>
              <span className="text-[7px] font-mono text-white/10 uppercase">v3.2_Final</span>
           </div>
           <div className="space-y-1 h-20 overflow-hidden">
              {logs.map((log, i) => (
                <p key={i} className="text-[9px] font-mono text-white/30 truncate uppercase leading-tight">
                  <span className="text-[#4ade80]/50 mr-2 opacity-50 font-bold">{log.split(']')[0]}]</span>
                  {log.split(']')[1] || log}
                </p>
              ))}
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center p-4 lg:p-6">
          <div className="w-full max-w-2xl my-auto pt-16 pb-40">
            
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-8"
                >
                  <div className="space-y-4 text-center">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#4ade80]/10 border border-[#4ade80]/20 mb-2 mx-auto">
                       <Zap className="w-3.5 h-3.5 text-[#4ade80]" />
                       <span className="text-[9px] font-black text-[#4ade80] uppercase tracking-widest font-mono">Step_01/Link_Establishment</span>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-black tracking-[-0.05em] text-white uppercase leading-[1.1]">
                      Neural <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/20 italic font-medium">Discovery</span>
                    </h2>
                    <p className="text-[11px] text-white/30 font-mono leading-relaxed max-w-xs mx-auto">Input your Node Identity key to initiate the synchronization sequence.</p>
                  </div>

                  <div className="space-y-4 max-w-md mx-auto">
                     <AnimatePresence>
                        {discoveredNode && (
                          <motion.div 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 border border-[#4ade80]/30 bg-[#4ade80]/5 rounded-[1rem] space-y-3 shadow-[0_0_40px_rgba(74,222,128,0.05)] relative overflow-hidden backdrop-blur-3xl group"
                          >
                             <div className="absolute top-0 right-0 p-3 opacity-5 blur-xl group-hover:blur-none transition-all duration-1000">
                                <Shield className="w-20 h-20 rotate-12 text-[#4ade80]" />
                             </div>
                             <div className="flex items-center gap-4 relative z-10">
                                <div className="w-10 h-10 rounded-xl bg-[#4ade80]/20 flex items-center justify-center border border-[#4ade80]/30 shadow-inner">
                                   <Shield className="w-4 h-4 text-[#4ade80]" />
                                </div>
                                <div className="space-y-0.5">
                                   <h4 className="text-base font-black text-white uppercase tracking-tight leading-none">{discoveredNode.name}</h4>
                                   <div className="flex items-center gap-2 pt-0.5">
                                      <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">{discoveredNode.level}</span>
                                      <div className="w-1 h-1 rounded-full bg-[#4ade80]" />
                                      <span className="text-[8px] font-mono text-[#4ade80] uppercase tracking-widest font-bold">{discoveredNode.agents.length} Detect Agents</span>
                                   </div>
                                </div>
                             </div>
                          </motion.div>
                        )}
                     </AnimatePresence>

                     <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                           <div className="flex-1 relative group">
                              <input 
                                type="text" 
                                placeholder="NODE ID (e.g. TEST-99)"
                                value={projectId}
                                onChange={(e) => {
                                  setProjectId(e.target.value);
                                  setScanError("");
                                  setDiscoveredNode(null);
                                }}
                                className={`w-full bg-white/[0.04] border rounded-xl px-5 py-3 text-sm font-mono text-white outline-none transition-all placeholder:text-white/10 ${
                                  projectId.toUpperCase() === 'TEST-99' 
                                  ? 'border-[#4ade80] shadow-[0_0_20px_rgba(74,222,128,0.1)] bg-[#4ade80]/5' 
                                  : 'border-white/10 focus:border-[#4ade80]/50 focus:bg-white/[0.08]'
                                }`}
                              />
                           </div>
                           <button 
                             onClick={handleScan}
                             disabled={!projectId || isScanning}
                             className={`px-6 h-12 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all ${
                               isScanning ? 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5' : 'bg-white text-black hover:scale-[1.02] active:scale-98 shadow-lg'
                             }`}
                           >
                             {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                             Scan Node
                           </button>
                        </div>
                        {scanError && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] font-mono text-red-500 uppercase text-center font-black tracking-[0.2em] bg-red-500/10 py-3 rounded-xl border border-red-500/20">
                            Error_Log: {scanError}
                          </motion.div>
                        )}
                     </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                       <h2 className="text-xl font-black tracking-tight text-white uppercase">Branding Identity <br /><span className="text-white/20 text-base">The face of the node.</span></h2>
                       {business_domain && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-10 h-10 rounded-lg bg-[#4ade80]/10 border border-[#4ade80]/20 flex items-center justify-center">
                             {(() => {
                               const domain = DOMAINS.find(d => d.id === business_domain);
                               const Icon = domain?.icon || Zap;
                               return <Icon className="w-5 h-5 text-[#4ade80]" />;
                             })()}
                          </motion.div>
                       )}
                    </div>
                    <p className="text-[10px] text-white/40 font-mono leading-relaxed max-w-xs">Define the visual persona and tone for the synchronized instance.</p>
                  </div>

                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em]">Business Domain</label>
                        <div className="relative">
                           <div 
                             onClick={() => setIsDomainOpen(!isDomainOpen)}
                             className={`w-full bg-white/[0.03] border rounded-lg px-4 py-3 text-[10px] font-mono text-white flex items-center justify-between cursor-pointer transition-all ${isDomainOpen ? 'border-[#4ade80] bg-white/[0.06]' : 'border-white/5'}`}
                           >
                              <span className={business_domain ? 'text-[#4ade80]' : 'text-white/20'}>
                                 {business_domain ? DOMAINS.find(d => d.id === business_domain)?.label : 'Search Sector...'}
                              </span>
                              <ChevronRight className={`w-3 h-3 text-white/20 transition-transform ${isDomainOpen ? 'rotate-90' : ''}`} />
                           </div>

                           <AnimatePresence>
                              {isDomainOpen && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 10 }}
                                  className="absolute top-full left-0 right-0 mt-3 bg-black border border-white/10 rounded-2xl backdrop-blur-3xl z-[300] overflow-hidden shadow-2xl"
                                >
                                   <div className="p-3 border-b border-white/5 bg-black/80">
                                      <div className="relative">
                                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
                                         <input 
                                           autoFocus
                                           placeholder="Filter sector..."
                                           value={domainSearch}
                                           onChange={(e) => setDomainSearch(e.target.value)}
                                           className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-[10px] font-mono text-white outline-none"
                                         />
                                      </div>
                                   </div>
                                   <div className="max-h-52 overflow-y-auto custom-scrollbar p-1.5">
                                      {DOMAINS.filter(d => d.label.toLowerCase().includes(domainSearch.toLowerCase())).map(d => (
                                        <div 
                                          key={d.id}
                                          onClick={() => {
                                            setBusinessDomain(d.id);
                                            setIsDomainOpen(false);
                                            setDomainSearch("");
                                            addLog(`DOMAIN DETECTED: ${d.id}`);
                                          }}
                                          className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 cursor-pointer group transition-all"
                                        >
                                           <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-white/20 group-hover:text-[#4ade80] transition-all">
                                              <d.icon className="w-3.5 h-3.5" />
                                           </div>
                                           <span className="text-[10px] font-mono text-white/40 group-hover:text-white uppercase">{d.label}</span>
                                        </div>
                                      ))}
                                   </div>
                                </motion.div>
                              )}
                           </AnimatePresence>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em]">Signature Frequency</label>
                           <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                              <input 
                                type="color" 
                                value={brandColor}
                                onChange={(e) => setBrandColor(e.target.value)}
                                className="w-8 h-8 rounded-md bg-transparent border-none p-0 cursor-pointer overflow-hidden"
                              />
                              <div className="space-y-0.5">
                                 <p className="text-[10px] font-mono text-white uppercase">{brandColor}</p>
                                 <p className="text-[7px] font-bold text-white/20 uppercase tracking-widest">HEX_ALLOCATED</p>
                              </div>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em]">Logo Asset</label>
                           <div className="h-14 rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center gap-2 cursor-pointer hover:border-[#4ade80]/20 transition-all group">
                              <ImageIcon className="w-3.5 h-3.5 text-white/10 group-hover:text-[#4ade80]/40 transition-colors" />
                              <span className="text-[7px] font-bold text-white/10 uppercase tracking-widest tracking-tighter">SELECT_VISUAL_ID</span>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Neural Persona Brief</label>
                        <textarea 
                          placeholder="Describe goals..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full h-24 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-4 text-xs font-mono text-white focus:border-[#4ade80]/40 outline-none transition-all resize-none placeholder:text-white/5"
                        />
                     </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-xl font-black tracking-tight text-white uppercase">Knowledge Injection <br /><span className="text-white/20 text-base">The brain of the node.</span></h2>
                    <p className="text-[10px] text-white/40 font-mono leading-relaxed max-w-xs">Upload core documentation for the agents.</p>
                  </div>

                  <div className="space-y-4">
                     <div className="relative group">
                        <input type="file" multiple onChange={handleAddFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="p-6 border-2 border-dashed border-white/5 bg-white/[0.01] rounded-xl flex flex-col items-center justify-center gap-2 group-hover:border-[#4ade80]/20 group-hover:bg-[#4ade80]/5 transition-all">
                           <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <CloudUpload className="w-5 h-5 text-white/40 group-hover:text-[#4ade80]" />
                           </div>
                           <div className="text-center space-y-0">
                              <p className="text-[10px] font-bold text-white uppercase tracking-widest">Neural Upload Portal</p>
                              <p className="text-[7px] text-white/20 font-mono uppercase">PDF, DOCX, TXT, JSON</p>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar">
                        {files.map(file => (
                          <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={file.id} className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-3 group hover:border-white/10 transition-all">
                             <div className="w-9 h-9 rounded-lg bg-black border border-white/5 flex items-center justify-center">
                                {file.name.endsWith('.pdf') ? <FileText className="w-4 h-4 text-red-500/60" /> : <FileCode className="w-4 h-4 text-blue-500/60" />}
                             </div>
                             <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                   <p className="text-[9px] font-mono text-white/40 uppercase truncate max-w-[150px]">{file.name}</p>
                                   <span className="text-[8px] font-bold text-[#4ade80] uppercase tracking-widest flex items-center gap-1.5"><Check className="w-2.5 h-2.5" /> READY</span>
                                </div>
                                <input 
                                  value={file.label}
                                  onChange={(e) => setFiles(files.map(f => f.id === file.id ? { ...f, label: e.target.value } : f))}
                                  placeholder="Document Name..."
                                  className="w-full bg-transparent border-b border-white/5 py-0.5 text-[10px] font-bold text-white focus:border-[#4ade80]/40 outline-none"
                                />
                             </div>
                             <button onClick={() => setFiles(files.filter(f => f.id !== file.id))} className="p-1.5 text-white/10 hover:text-red-500 transition-colors">
                                <X className="w-3.5 h-3.5" />
                             </button>
                          </motion.div>
                        ))}
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        <div className="fixed bottom-0 inset-x-0 h-16 bg-black/40 backdrop-blur-3xl border-t border-white/5 z-[200] flex items-center justify-between px-6 lg:px-12">
           <div className="flex items-center gap-6">
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-0.5">Progress</span>
                 <div className="flex gap-1">
                    {[1, 2, 3].map((s) => (
                      <div 
                        key={s} 
                        className={`h-1 rounded-full transition-all duration-500 ${step >= s ? 'w-8 bg-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.4)]' : 'w-4 bg-white/10'}`} 
                      />
                    ))}
                 </div>
              </div>
              <div className="h-5 w-px bg-white/5" />
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-0.5">Node_ID</span>
                 <span className="text-[9px] font-mono text-white/60 uppercase">
                    {step === 1 ? 'Discovery' : step === 2 ? 'Identity' : 'Knowledge'}
                 </span>
              </div>
           </div>

           <div className="flex items-center gap-3">
              {step > 1 && (
                <button onClick={() => setStep((s) => (s - 1) as OnboardingStep)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/5 text-[9px] font-black text-white/40 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest">
                   <ChevronLeft className="w-3 h-3" /> Prev
                </button>
              )}
              {step < 3 ? (
                <>
                  <button onClick={() => setStep((s) => (s + 1) as OnboardingStep)} className="px-3 py-2 text-[9px] font-black text-white/20 hover:text-white transition-all uppercase tracking-widest">Skip</button>
                  <button 
                    disabled={step === 1 && !discoveredNode}
                    onClick={() => setStep((s) => (s + 1) as OnboardingStep)}
                    className={`h-10 px-6 rounded-lg flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[9px] transition-all ${(step === 1 && !discoveredNode) ? 'bg-white/5 text-white/10 cursor-not-allowed' : 'bg-[#4ade80] text-black hover:scale-[1.05] shadow-[0_0_20px_rgba(74,222,128,0.2)]'}`}
                  >
                     Next Sector <ChevronRight className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <button onClick={handleFinalize} disabled={isFinalizing} className="h-10 px-8 bg-[#4ade80] text-black rounded-lg flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:bg-[#22c55e] transition-all">
                   {isFinalizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                   LAUNCH ORACLE
                </button>
              )}
           </div>
        </div>

        <div className="fixed top-8 left-8 z-[200]">
           <button onClick={() => router.back()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[8px] font-black text-white/40 hover:text-white transition-all tracking-[0.2em]">
              <X className="w-2.5 h-2.5" /> ABORT
           </button>
        </div>
      </main>

      {/* SYNC MODAL */}
      <AnimatePresence>
        {isFinalizing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center gap-10">
             <div className="relative">
                <motion.div className="w-48 h-48 border border-[#4ade80]/20 rounded-full flex items-center justify-center" animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
                   <div className="absolute top-0 w-3 h-3 bg-[#4ade80] rounded-full shadow-[0_0_15px_#4ade80]" />
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
                   <Zap className="w-10 h-10 text-[#4ade80] animate-pulse" />
                </div>
             </div>
             <div className="text-center space-y-2">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.4em] animate-pulse">Synchronizing Data Lattice</h3>
                <p className="text-[8px] font-mono text-white/20 uppercase">Linking Sector: {projectId}</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
