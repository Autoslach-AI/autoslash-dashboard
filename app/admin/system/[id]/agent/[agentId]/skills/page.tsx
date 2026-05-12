'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { getAgentsByEnterprise } from '@/lib/db/actions';

import { 
  Search, 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  FileCode, 
  Monitor, 
  Info, 
  MoreVertical, 
  Eye, 
  Code,
  ShoppingBag,
  Sparkles,
  FileText,
  UploadCloud,
  X,
  Upload
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export default function AgentSkillsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const agentId = params?.agentId as string;
  
  const [agentName, setAgentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSkillActive, setIsSkillActive] = useState(true);

  // UI States
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showCreateSubMenu, setShowCreateSubMenu] = useState(false);
  const [showEditInstructionsModal, setShowEditInstructionsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form States
  const [skillForm, setSkillForm] = useState({ name: '', description: '', instructions: '' });

  useEffect(() => {
    const fetchAgent = async () => {
      const { data: agents } = await getAgentsByEnterprise(id);
      const currentAgent = (agents as any[])?.find((a: any) => a.id === agentId);
      if (currentAgent) {
        setAgentName(currentAgent.name);
      }
      setLoading(false);
    };
    fetchAgent();
  }, [id, agentId]);

  if (loading) return null;

  return (
    <div className="relative p-6 lg:p-12 max-w-[1400px] mx-auto space-y-12 pb-64 font-mono">
      {/* PAGE HEADER */}
      <div className="flex justify-between items-end">
        <div className="space-y-4">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#4ade80] rounded-full shadow-[0_0_10px_#4ade80] animate-pulse" />
              <span className="text-[10px] font-bold text-white/40 tracking-[0.4em] uppercase">Status // Online_Configuration</span>
           </div>
           <h1 className="text-5xl font-normal text-white tracking-tighter small-caps">{agentName || 'UNDEFINED_NODE'}</h1>
        </div>
        <div className="text-right">
           <p className="text-[10px] text-white/20 uppercase tracking-widest mb-1">Sector_Cluster</p>
           <p className="text-xs font-bold text-white/60 tracking-wider">0X-{id?.substring(0, 8).toUpperCase()}</p>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex border-b border-white/10 gap-10">
        <button 
          onClick={() => router.push(`/admin/system/${id}/agent/${agentId}`)}
          className="pb-4 text-[10px] font-bold uppercase text-white/20 hover:text-white/40 tracking-[0.3em] transition-all relative"
        >
          Core_Config
        </button>
        <button 
          onClick={() => router.push(`/admin/system/${id}/agent/${agentId}?tab=KNOWLEDGE`)}
          className="pb-4 text-[10px] font-bold uppercase text-white/20 hover:text-white/40 tracking-[0.3em] transition-all relative"
        >
          Knowledge_Base
        </button>
        <button 
          className="pb-4 text-[10px] font-bold uppercase text-white tracking-[0.3em] transition-all relative"
        >
          Skills
          <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4ade80] shadow-[0_0_10px_#4ade80]" />
        </button>
      </div>

      {/* DUAL PANE LAYOUT */}
      <div className="flex bg-[#050505] border border-white/10 rounded-2xl overflow-hidden min-h-[700px]">
        {/* SIDEBAR */}
        <aside className="w-80 border-r border-white/10 flex flex-col bg-black">
          {/* Sidebar Header */}
          <div className="p-6 flex items-center justify-between border-b border-white/5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Compétences</h3>
            <div className="flex items-center gap-3 text-white/40">
              <Search className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
              <div className="relative">
                <Plus 
                  className="w-4 h-4 hover:text-[#4ade80] cursor-pointer transition-colors" 
                  onClick={() => setShowPlusMenu(!showPlusMenu)}
                />
                
                <AnimatePresence>
                  {showPlusMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-8 w-64 bg-[#0D0D0D] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-1">
                        <button className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors text-left group">
                          <ShoppingBag className="w-4 h-4 text-white/40 group-hover:text-white" />
                          <span className="text-[11px] font-bold text-white tracking-widest uppercase">Parcourir les compétences</span>
                        </button>
                        
                        <div className="relative">
                          <button 
                            onMouseEnter={() => setShowCreateSubMenu(true)}
                            className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <Plus className="w-4 h-4 text-white/40 group-hover:text-white" />
                              <span className="text-[11px] font-bold text-white tracking-widest uppercase">Créer une compétence</span>
                            </div>
                            <ChevronRight className={`w-3 h-3 transition-transform ${showCreateSubMenu ? 'rotate-90' : ''}`} />
                          </button>

                          <AnimatePresence>
                            {showCreateSubMenu && (
                              <motion.div 
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                onMouseLeave={() => setShowCreateSubMenu(false)}
                                className="absolute left-[calc(100%+8px)] top-0 w-72 bg-[#0D0D0D] border border-white/10 rounded-xl shadow-2xl z-50 p-1"
                              >
                                <button className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors text-left group">
                                  <Sparkles className="w-4 h-4 text-white/40 group-hover:text-[#4ade80]" />
                                  <span className="text-[11px] font-bold text-white tracking-widest uppercase">Créer avec Claude</span>
                                </button>
                                <button 
                                  onClick={() => {
                                    setShowEditInstructionsModal(true);
                                    setShowPlusMenu(false);
                                  }}
                                  className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors text-left group"
                                >
                                  <FileText className="w-4 h-4 text-white/40 group-hover:text-[#4ade80]" />
                                  <span className="text-[11px] font-bold text-white tracking-widest uppercase">Rédiger les instructions</span>
                                </button>
                                <button 
                                  onClick={() => {
                                    setShowUploadModal(true);
                                    setShowPlusMenu(false);
                                  }}
                                  className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors text-left group"
                                >
                                  <UploadCloud className="w-4 h-4 text-white/40 group-hover:text-[#4ade80]" />
                                  <span className="text-[11px] font-bold text-white tracking-widest uppercase">Téléverser une compétence</span>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <button className="flex items-center gap-2 text-[10px] font-bold text-white/60 uppercase tracking-widest hover:text-white transition-all mb-4 w-full text-left">
                <ChevronDown className="w-3 h-3" />
                Compétences personnelles
              </button>
              
              <div className="space-y-1">
                {/* Active Skill Item */}
                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <div className="flex items-center gap-3 p-3 bg-white/5">
                    <div className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                      <Monitor className="w-3.5 h-3.5 text-[#4ade80]" />
                    </div>
                    <span className="text-[11px] font-bold text-white tracking-widest uppercase">skill-creator</span>
                    <ChevronDown className="w-3 h-3 ml-auto text-white/20" />
                  </div>

                  {/* File Tree */}
                  <div className="p-3 pl-10 space-y-2 text-[10px] font-mono text-white/40">
                    <div className="flex items-center gap-3 hover:text-white transition-colors cursor-pointer">
                      <FileCode className="w-3 h-3" />
                      <span>SKILL.md</span>
                    </div>
                    {[
                      { name: 'agents', hasChildren: true },
                      { name: 'assets', hasChildren: true },
                      { name: 'eval-viewer', hasChildren: true },
                      { name: 'references', hasChildren: true },
                      { name: 'scripts', hasChildren: true },
                    ].map((folder) => (
                      <div key={folder.name} className="flex items-center justify-between group cursor-pointer hover:text-white transition-all">
                        <div className="flex items-center gap-3">
                          <Folder className="w-3 h-3 text-white/20 group-hover:text-white/40" />
                          <span>{folder.name}</span>
                        </div>
                        {folder.hasChildren && <ChevronRight className="w-3 h-3 text-white/10 group-hover:text-white/30" />}
                      </div>
                    ))}
                    <div className="flex items-center gap-3 hover:text-white transition-colors cursor-pointer pt-1">
                      <FileCode className="w-3 h-3 text-white/10" />
                      <span>LICENSE.txt</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col bg-[#050505]">
          {/* Content Header */}
          <div className="p-8 pb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white uppercase tracking-[0.2em]">skill-creator</h2>
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsSkillActive(!isSkillActive)}
                className={`relative w-11 h-5 rounded-full transition-all ${isSkillActive ? 'bg-[#4ade80]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isSkillActive ? 'left-6.5' : 'left-0.5'}`} />
              </button>
              <MoreVertical className="w-4 h-4 text-white/20 cursor-pointer hover:text-white transition-colors" />
            </div>
          </div>

          <div className="p-8 pt-0 space-y-10 overflow-y-auto">
            {/* Metadata Section */}
            <div className="flex gap-12">
              <div>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] mb-2">Ajouté par</p>
                <p className="text-[12px] font-bold text-white tracking-widest uppercase">Anthropic</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] mb-2">Déclencheur</p>
                <p className="text-[12px] font-bold text-white tracking-widest uppercase">Commande / + auto</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3 max-w-[800px]">
              <div className="flex items-center gap-2 text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">
                <span>Description</span>
                <Info className="w-3 h-3" />
              </div>
              <p className="text-[12px] font-medium text-white/60 leading-relaxed tracking-wide">
                Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy.
              </p>
            </div>

            {/* Code / Markdown Block */}
            <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl p-8 space-y-8 relative group">
              <div className="absolute right-6 top-6 flex items-center gap-3 opacity-20 group-hover:opacity-100 transition-all">
                <div className="p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                  <Eye className="w-4 h-4 text-white" />
                </div>
                <div className="p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                  <Code className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Code Snippet */}
              <div className="bg-[#080808] border border-white/5 rounded-xl p-6 font-mono text-[12px] space-y-4">
                <p className="text-white/20 mb-2 uppercase tracking-widest text-[9px]">bash</p>
                <p className="text-white">
                  python -m scripts.aggregate_benchmark <span className="text-[#4ade80] opacity-60">{"<workspace>"}</span>/iteration-N --skill-name <span className="text-[#4ade80] opacity-60">{"<name>"}</span>
                </p>
              </div>

              {/* MD Sample Text */}
              <div className="space-y-6 text-[13px] leading-relaxed text-white/70">
                <p>
                  This produces <code className="bg-white/5 px-1.5 py-0.5 rounded text-orange-200/70 border border-white/10">benchmark.json</code> and <code className="bg-white/5 px-1.5 py-0.5 rounded text-orange-200/70 border border-white/10">benchmark.md</code> with pass_rate, time, and tokens for each configuration, with mean ± stddev and the delta. If generating benchmark.json manually, see <code className="bg-white/5 px-1.5 py-0.5 rounded text-orange-200/70 border border-white/10">references/schemas.md</code> for the exact schema the viewer expects. Put each with_skill version before its baseline counterpart.
                </p>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <span className="text-white/20 font-bold shrink-0 mt-0.5">3.</span>
                    <p>
                      <span className="font-bold text-white">Do an analyst pass</span> — read the benchmark data and surface patterns the aggregate stats might hide. See <code className="bg-white/5 px-1.5 py-0.5 rounded text-orange-200/70 border border-white/10">agents/analyzer.md</code> (the "Analyzing Benchmark Results" section) for what to look for — things like assertions that always pass regardless of skill (non-discriminating), high-variance evals (possibly flaky), and time/token tradeoffs.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-white/20 font-bold shrink-0 mt-0.5">4.</span>
                    <p>
                      <span className="font-bold text-white">Launch the viewer</span> with both qualitative outputs and quantitative data:
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {showEditInstructionsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditInstructionsModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0D0D0D] border border-white/10 rounded-2xl shadow-3xl overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white tracking-tight">Rédiger les instructions de la compétence</h2>
                <X 
                  className="w-5 h-5 text-white/40 hover:text-white cursor-pointer transition-colors" 
                  onClick={() => setShowEditInstructionsModal(false)}
                />
              </div>

              <div className="p-8 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Nom de la compétence</label>
                  <input 
                    type="text"
                    placeholder="weekly-status-report"
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3.5 text-white text-sm outline-none focus:border-[#4ade80]/30 transition-all font-mono"
                    value={skillForm.name}
                    onChange={(e) => setSkillForm({...skillForm, name: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Description</label>
                  <textarea 
                    placeholder="Générer des rapports d'état hebdomadaires à partir du travail récent..."
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-[#4ade80]/30 transition-all font-mono min-h-[120px] resize-none"
                    value={skillForm.description}
                    onChange={(e) => setSkillForm({...skillForm, description: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Instructions</label>
                  <textarea 
                    placeholder="Résumez mon travail récent en trois sections : réussites, obstacles et prochaines étapes..."
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-[#4ade80]/30 transition-all font-mono min-h-[220px] resize-none"
                    value={skillForm.instructions}
                    onChange={(e) => setSkillForm({...skillForm, instructions: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-8 pt-0 flex justify-end gap-4">
                <button 
                  onClick={() => setShowEditInstructionsModal(false)}
                  className="px-6 py-2.5 text-[11px] font-bold text-white/60 uppercase tracking-widest hover:text-white transition-all bg-white/5 rounded-lg border border-white/10"
                >
                  Annuler
                </button>
                <button 
                  className="px-8 py-2.5 text-[11px] font-bold text-black bg-[#4ade80] uppercase tracking-widest rounded-lg shadow-[0_0_20px_#4ade8033] hover:shadow-[0_0_30px_#4ade8055] transition-all"
                >
                  Créer
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0D0D0D] border border-white/10 rounded-2xl shadow-3xl overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white tracking-tight">Importer une compétence</h2>
                <X 
                  className="w-5 h-5 text-white/40 hover:text-white cursor-pointer transition-colors" 
                  onClick={() => setShowUploadModal(false)}
                />
              </div>

              <div className="p-8 space-y-10">
                <div className="border-2 border-dashed border-white/10 rounded-2xl p-16 flex flex-col items-center justify-center gap-6 group hover:border-[#4ade80]/30 transition-all bg-white/[0.02] cursor-pointer">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-[#4ade80]/30 transition-all">
                    <Upload className="w-6 h-6 text-white/40 group-hover:text-[#4ade80]" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm font-bold text-white tracking-wide uppercase">Glissez-déposez ou cliquez pour téléverser</p>
                    <p className="text-xs text-white/20 uppercase tracking-widest">Fichiers .md, .zip, .skill</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Exigences de fichier</p>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex gap-4 text-[13px] text-white/60 leading-relaxed">
                      <div className="w-1.5 h-1.5 bg-[#4ade80] rounded-full mt-2 shrink-0 shadow-[0_0_10px_#4ade80]" />
                      <p>Le fichier .md doit contenir le nom et la description de la compétence au format YAML.</p>
                    </li>
                    <li className="flex gap-4 text-[13px] text-white/60 leading-relaxed">
                      <div className="w-1.5 h-1.5 bg-[#4ade80] rounded-full mt-2 shrink-0 shadow-[0_0_10px_#4ade80]" />
                      <p>Le fichier .zip ou .skill doit inclure un fichier SKILL.md.</p>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 flex gap-6 text-[11px] font-bold uppercase tracking-widest">
                  <a href="#" className="text-[#4ade80]/60 hover:text-[#4ade80] underline transition-colors">En savoir plus sur la création de compétences</a>
                  <span className="text-white/10">ou</span>
                  <a href="#" className="text-white/40 hover:text-white transition-colors">voir un exemple.</a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
