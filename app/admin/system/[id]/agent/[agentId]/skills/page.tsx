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
  Upload,
  Pencil,
  Copy,
  Hash,
  FileJson
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

// Mock File Structure
const MOCK_FILES = [
  { id: '1', name: 'SKILL.md', type: 'file', content: '# Skill Creator\n\nCreate new skills, modify and improve existing skills, and measure skill performance.' },
  { 
    id: '2', 
    name: 'agents', 
    type: 'folder', 
    children: [
      { id: '2-1', name: 'analyzer.md', type: 'file', content: '# Analyzer\n\nAnalyzes benchmark results for the skills.' }
    ] 
  },
  { 
    id: '3', 
    name: 'assets', 
    type: 'folder', 
    children: [
      { id: '3-1', name: 'eval_review.html', type: 'file', content: '<html><body>Review Content</body></html>' }
    ] 
  },
  { 
    id: '4', 
    name: 'eval-viewer', 
    type: 'folder', 
    children: [
      { 
        id: '4-1', 
        name: 'generate_review.py', 
        type: 'file', 
        content: `#!/usr/bin/env python3
"""Generate and serve a review page for eval results.

Reads the workspace directory, discovers runs (directories with outputs/),
embeds all output data into a self-contained HTML page, and serves it via
a tiny HTTP server. Feedback auto-saves to feedback.json in the workspace.
"""

import argparse
import base64
import json
import mimetypes
import os
import re
import signal
import subprocess
import sys
import time
import webbrowser
from functools import partial
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path` 
      },
      { id: '4-2', name: 'viewer.html', type: 'file', content: '<!-- Viewer HTML -->' }
    ] 
  },
  { 
    id: '5', 
    name: 'references', 
    type: 'folder', 
    children: [
      { id: '5-1', name: 'schemas.md', type: 'file', content: '# Schemas\n\nDefinitions for benchmark.json' }
    ] 
  },
  { 
    id: '6', 
    name: 'scripts', 
    type: 'folder', 
    children: [
      { id: '6-1', name: '__init__.py', type: 'file', content: '' },
      { id: '6-2', name: 'aggregate_benchmark.py', type: 'file', content: '# Script to aggregate results' },
      { id: '6-3', name: 'generate_report.py', type: 'file', content: '# Script to generate reports' }
    ] 
  },
  { id: '7', name: 'LICENSE.txt', type: 'file', content: 'MIT License' }
];

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

  // File Tree States
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['skill-creator']));
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  const toggleFolder = (folderId: string) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(folderId)) {
      newSet.delete(folderId);
    } else {
      newSet.add(folderId);
    }
    setExpandedFolders(newSet);
  };

  const handleFileClick = (file: any) => {
    setSelectedFile(file);
    setEditedContent(file.content);
    setIsEditing(false);
  };

  const renderFileTree = (items: any[], level = 0) => {
    return items.map((item) => {
      const isExpanded = expandedFolders.has(item.id);
      const isSelected = selectedFile?.id === item.id;

      if (item.type === 'folder') {
        return (
          <div key={item.id} className="space-y-0.5">
            <div 
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(item.id);
              }}
              className={`flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer transition-all hover:bg-white/5 ${level > 0 ? 'ml-4' : ''} group`}
            >
              <Folder className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
              <span className="text-[11px] text-white/40 font-mono tracking-tight flex-1 group-hover:text-white/60 transition-colors">{item.name}</span>
              <div className="text-white/10 group-hover:text-white/30 transition-colors">
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </div>
            </div>
            {isExpanded && item.children && (
              <div className="overflow-hidden">
                {renderFileTree(item.children, level + 1)}
              </div>
            )}
          </div>
        );
      }

      return (
        <div 
          key={item.id}
          onClick={(e) => {
            e.stopPropagation();
            handleFileClick(item);
          }}
          className={`flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer transition-all hover:bg-white/5 group ${isSelected ? 'bg-white/10 text-white' : 'text-white/40'} ${level > 0 ? 'ml-4' : ''}`}
        >
          {item.name.endsWith('.py') ? <FileCode className="w-4 h-4 text-[#4ade80]/40 group-hover:text-[#4ade80]/60" /> : 
           item.name.endsWith('.json') ? <FileJson className="w-4 h-4 text-blue-400/40 group-hover:text-blue-400/60" /> :
           <FileText className="w-4 h-4 text-white/20 group-hover:text-white/40" />}
          <span className="text-[11px] font-mono tracking-tight">{item.name}</span>
        </div>
      );
    });
  };

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
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => {
                          setShowPlusMenu(false);
                          setShowCreateSubMenu(false);
                        }}
                      />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-8 w-64 bg-[#000000] border border-white/10 rounded-xl shadow-2xl z-50 p-1"
                      >
                        <div className="flex flex-col relative">
                          <button className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors text-left group">
                            <ShoppingBag className="w-4 h-4 text-white/40 group-hover:text-white" />
                            <span className="text-[10px] font-bold text-white tracking-[0.2em] uppercase">PARCOURIR LES COMPÉTENCES</span>
                          </button>
                          
                          <div className="relative">
                            <button 
                              onMouseEnter={() => setShowCreateSubMenu(true)}
                              className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <Plus className="w-4 h-4 text-white/40 group-hover:text-white" />
                                <span className="text-[10px] font-bold text-white tracking-[0.2em] uppercase">CRÉER UNE COMPÉTENCE</span>
                              </div>
                              <ChevronRight className={`w-3 h-3 text-white/20 transition-transform ${showCreateSubMenu ? 'rotate-90' : ''}`} />
                            </button>

                            <AnimatePresence>
                              {showCreateSubMenu && (
                                <motion.div 
                                  initial={{ opacity: 0, x: 5 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 5 }}
                                  onMouseLeave={() => setShowCreateSubMenu(false)}
                                  className="absolute left-[calc(100%+8px)] top-0 w-72 bg-[#000000] border border-white/10 rounded-xl shadow-2xl z-60 p-1"
                                >
                                  <button className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors text-left group">
                                    <Sparkles className="w-4 h-4 text-white/40 group-hover:text-[#4ade80]" />
                                    <span className="text-[10px] font-bold text-white tracking-[0.15em] uppercase">Créer avec Claude</span>
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowEditInstructionsModal(true);
                                      setShowPlusMenu(false);
                                      setShowCreateSubMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors text-left group"
                                  >
                                    <FileText className="w-4 h-4 text-white/40 group-hover:text-[#4ade80]" />
                                    <span className="text-[10px] font-bold text-white tracking-[0.15em] uppercase truncate">Rédiger les instructions</span>
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowUploadModal(true);
                                      setShowPlusMenu(false);
                                      setShowCreateSubMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors text-left group"
                                  >
                                    <UploadCloud className="w-4 h-4 text-white/40 group-hover:text-[#4ade80]" />
                                    <span className="text-[10px] font-bold text-white tracking-[0.15em] uppercase">Téléverser une compétence</span>
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono">
            <div>
              <button 
                onClick={() => toggleFolder('personal-skills')}
                className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] hover:text-white transition-all mb-4 w-full text-left"
              >
                {expandedFolders.has('personal-skills') ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Compétences personnelles
              </button>
              
              <AnimatePresence>
                {expandedFolders.has('personal-skills') && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-1 overflow-hidden"
                  >
                    {/* Primary Skill Folder */}
                    <div className="bg-[#0A0A0A] rounded-xl border border-white/5 overflow-hidden">
                      <div 
                        onClick={() => toggleFolder('skill-creator')}
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 transition-colors group"
                      >
                        <div className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 group-hover:border-[#4ade80]/30 transition-all">
                          <Monitor className="w-3.5 h-3.5 text-[#4ade80]" />
                        </div>
                        <span className="text-[11px] font-bold text-white tracking-[0.1em] uppercase">skill-creator</span>
                        {expandedFolders.has('skill-creator') ? <ChevronDown className="w-3 h-3 ml-auto text-white/20" /> : <ChevronRight className="w-3 h-3 ml-auto text-white/20" />}
                      </div>

                      {/* File Tree Root */}
                      <AnimatePresence>
                        {expandedFolders.has('skill-creator') && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="p-2 pt-0 space-y-0.5 overflow-hidden"
                          >
                            {renderFileTree(MOCK_FILES)}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col bg-[#000000]">
          {selectedFile ? (
            <div className="flex-1 flex flex-col">
              {/* Header for File */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <FileCode className="w-4 h-4 text-[#4ade80]" />
                  <h2 className="text-sm font-bold text-white tracking-widest uppercase">{selectedFile.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className={`p-2 rounded-lg transition-all ${!isEditing ? 'bg-white/10 text-[#4ade80]' : 'text-white/40 hover:text-white'}`}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className={`p-2 rounded-lg transition-all ${isEditing ? 'bg-white/10 text-[#4ade80]' : 'text-white/40 hover:text-white'}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <div className="h-4 w-px bg-white/10 mx-2" />
                  <button className="p-2 text-white/40 hover:text-white transition-all">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Editor / Viewer Area */}
              <div className="flex-1 relative overflow-auto font-mono text-[13px] leading-relaxed group">
                {isEditing ? (
                  <textarea 
                    autoFocus
                    className="w-full h-full bg-black text-white/80 p-8 outline-none resize-none selection:bg-[#4ade80]/20"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    spellCheck={false}
                  />
                ) : (
                  <div className="p-0 flex min-h-full">
                    {/* Line Numbers */}
                    <div className="w-12 bg-white/[0.02] border-r border-white/5 py-8 flex flex-col items-center text-white/10 select-none">
                      {editedContent.split('\n').map((_, i) => (
                        <div key={i} className="h-[1.5em]">{i + 1}</div>
                      ))}
                    </div>
                    {/* Code Content */}
                    <pre className="p-8 flex-1 text-white/80 whitespace-pre scrollbar-hide overflow-x-auto">
                      {editedContent.split('\n').map((line, i) => (
                        <div key={i} className="h-[1.5em] hover:bg-white/[0.02] transition-colors px-2">
                          {line.startsWith('#') || line.startsWith('"""') || line.startsWith('//') ? (
                            <span className="text-[#4ade80]/60">{line}</span>
                          ) : (
                            <span>{line}</span>
                          )}
                        </div>
                      ))}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
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
                  </div>
                </div>
              </div>
            </>
          )}
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
              className="relative w-full max-w-2xl bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-3xl overflow-hidden"
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
                  <label className="text-[11px] font-bold text-white/60 uppercase tracking-[0.2em]">Nom de la compétence</label>
                  <input 
                    type="text"
                    placeholder="weekly-status-report"
                    className="w-full bg-[#1F1F1F] border border-white/5 rounded-lg px-5 py-3 text-white text-sm outline-none focus:border-white/20 transition-all font-mono placeholder:text-white/20"
                    value={skillForm.name}
                    onChange={(e) => setSkillForm({...skillForm, name: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-white/60 uppercase tracking-[0.2em]">Description</label>
                  <textarea 
                    placeholder="Générer des rapports d'état hebdomadaires à partir du travail récent. À utiliser pour les demandes de mises à jour ou de résumés de progression."
                    className="w-full bg-[#1F1F1F] border border-white/5 rounded-lg px-5 py-4 text-white text-sm outline-none focus:border-white/20 transition-all font-mono min-h-[120px] resize-none placeholder:text-white/20"
                    value={skillForm.description}
                    onChange={(e) => setSkillForm({...skillForm, description: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-white/60 uppercase tracking-[0.2em]">Instructions</label>
                  <textarea 
                    placeholder="Résumez mon travail récent en trois sections : réussites, obstacles et prochaines étapes. Adoptez un ton professionnel mais pas rigide..."
                    className="w-full bg-[#1F1F1F] border border-white/5 rounded-lg px-5 py-4 text-white text-sm outline-none focus:border-white/20 transition-all font-mono min-h-[220px] resize-none placeholder:text-white/20"
                    value={skillForm.instructions}
                    onChange={(e) => setSkillForm({...skillForm, instructions: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-8 pt-0 flex justify-end gap-3">
                <button 
                  onClick={() => setShowEditInstructionsModal(false)}
                  className="px-8 py-2.5 text-[12px] font-bold text-white/60 rounded-lg transition-all bg-[#2A2A2A] hover:bg-[#333333] tracking-widest uppercase"
                >
                  Annuler
                </button>
                <button 
                  className="px-8 py-2.5 text-[12px] font-bold text-black bg-[#E5E5E5] rounded-lg hover:bg-white transition-all tracking-widest uppercase"
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
              className="relative w-full max-w-2xl bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-3xl overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white tracking-tight">Importer une compétence</h2>
                <X 
                  className="w-5 h-5 text-white/40 hover:text-white cursor-pointer transition-colors" 
                  onClick={() => setShowUploadModal(false)}
                />
              </div>

              <div className="p-8 space-y-10">
                <div className="border border-dashed border-white/10 rounded-2xl p-20 flex flex-col items-center justify-center gap-6 group hover:border-white/20 transition-all bg-white/[0.01] cursor-pointer">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-all">
                    <Plus className="w-5 h-5 text-white/40 group-hover:text-white" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-[13px] font-medium text-white/60 tracking-tight">Glissez-déposez ou cliquez pour téléverser</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em]">Exigences de fichier</p>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex gap-4 text-[13px] text-white/40 leading-relaxed items-start">
                      <div className="w-1 h-1 bg-white/20 rounded-full mt-2 shrink-0" />
                      <p>Le fichier .md doit contenir le nom et la description de la compétence au format YAML.</p>
                    </li>
                    <li className="flex gap-4 text-[13px] text-white/40 leading-relaxed items-start">
                      <div className="w-1 h-1 bg-white/20 rounded-full mt-2 shrink-0" />
                      <p>Le fichier .zip ou .skill doit inclure un fichier SKILL.md.</p>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 flex gap-3 text-[12px] font-medium items-center">
                  <a href="#" className="text-white/40 hover:text-white underline underline-offset-8 decoration-white/10 decoration-1 transition-colors">En savoir plus sur la création de compétences</a>
                  <span className="text-white/10">ou</span>
                  <a href="#" className="text-white/40 hover:text-white underline underline-offset-8 decoration-white/10 decoration-1 transition-colors">voir un exemple.</a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
