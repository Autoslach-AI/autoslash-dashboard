"use client";

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Zap, LayoutDashboard, Users, ArrowLeft,
  Terminal, Sliders, Power, Save, Loader2, AlertCircle,
  CheckCircle2, ChevronDown, Clock
} from 'lucide-react';
import { useUser } from '@/lib/contexts/user-context';
import DoubleRibbonIntelligent, { NavItem } from '@/components/DoubleRibbonIntelligent';
import { createClient } from '@/lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

type AgentTabId = 'axon' | 'business' | 'commercial';

interface AgentConfigRow {
  id:                      string;
  agent_id:                string;
  provider:                string;
  model:                   string;
  max_tokens_per_session:  number | null;
  max_requests_per_day:    number | null;
  system_prompt:           string | null;
  is_active:               boolean;
  created_at:              string;
  updated_at:              string;
}

interface AvailableModel {
  id:           string;
  name:         string;
  provider:     string;
  model_string: string;
  complexity:   string;
  is_active:    boolean;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const AGENT_TABS: Array<{ id: AgentTabId; label: string; color: string; glow: string; description: string }> = [
  { id: 'axon',       label: 'AXON',       color: '#39FF14', glow: 'rgba(57,255,20,0.5)',  description: 'Analyste stratégique — pipeline, prospects, performance' },
  { id: 'business',   label: 'BUSINESS',   color: '#3b82f6', glow: 'rgba(59,130,246,0.5)', description: 'Commercial automatique — e-mails, relances, fiches prospects' },
  { id: 'commercial', label: 'COMMERCIAL', color: '#a855f7', glow: 'rgba(168,85,247,0.5)', description: 'Vitrine interactive — simulateur, qualification des leads' },
];

// ─── Composant principal ─────────────────────────────────────────────────────

export default function AgentSettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center font-mono">
        <Loader2 className="w-6 h-6 text-[#39FF14] animate-spin" />
      </div>
    }>
      <AgentSettingsPageInner />
    </Suspense>
  );
}

function AgentSettingsPageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useUser();

  const initialTab = (searchParams.get('tab') as AgentTabId) || 'axon';
  const [activeAgentId, setActiveAgentId] = useState<AgentTabId>(
    ['axon', 'business', 'commercial'].includes(initialTab) ? initialTab : 'axon'
  );

  const [configs,        setConfigs]        = useState<Record<string, AgentConfigRow>>({});
  const [loading,        setLoading]        = useState(true);
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [error,          setError]          = useState<string | null>(null);
  const [saveState,      setSaveState]      = useState<'idle' | 'saving' | 'saved'>('idle');

  // ── Champs édités localement (déférés jusqu'au SYNC) ──────────────────────
  const [systemPrompt,        setSystemPrompt]        = useState('');
  const [model,                setModel]               = useState('');
  const [provider,             setProvider]            = useState('');
  const [maxTokensPerSession,  setMaxTokensPerSession] = useState<number>(2000);
  const [maxRequestsPerDay,    setMaxRequestsPerDay]   = useState<number>(10);
  const [isActive,             setIsActive]            = useState(true);

  const currentTabMeta = AGENT_TABS.find(t => t.id === activeAgentId)!;

  // ── Charger toutes les configs + les modèles disponibles ─────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/hq/agents');
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      const byId: Record<string, AgentConfigRow> = {};
      (json.data ?? []).forEach((row: AgentConfigRow) => {
        byId[row.agent_id] = row;
      });
      setConfigs(byId);

      const supabase = createClient();
      const { data: models } = await supabase
        .from('available_models')
        .select('*')
        .eq('is_active', true)
        .order('complexity');
      setAvailableModels(models || []);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des configurations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Synchroniser les champs locaux quand on change d'onglet ou que les données arrivent ──
  useEffect(() => {
    const cfg = configs[activeAgentId];
    if (cfg) {
      setSystemPrompt(cfg.system_prompt || '');
      setModel(cfg.model || '');
      setProvider(cfg.provider || '');
      setMaxTokensPerSession(cfg.max_tokens_per_session ?? 2000);
      setMaxRequestsPerDay(cfg.max_requests_per_day ?? 10);
      setIsActive(cfg.is_active ?? true);
    }
    setSaveState('idle');
  }, [activeAgentId, configs]);

  const handleTabChange = (tabId: AgentTabId) => {
    setActiveAgentId(tabId);
    router.replace(`/admin/hq/agents/axon/settings?tab=${tabId}`, { scroll: false });
  };

  const handleModelChange = (modelString: string) => {
    setModel(modelString);
    const matched = availableModels.find(m => m.model_string === modelString);
    if (matched) {
      setProvider(matched.provider);
    }
  };

  const handleSave = async () => {
    setSaveState('saving');
    setError(null);
    try {
      const res = await fetch('/api/admin/hq/agents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id:               activeAgentId,
          system_prompt:          systemPrompt,
          model:                  model,
          provider:               provider,
          max_tokens_per_session: maxTokensPerSession,
          max_requests_per_day:   maxRequestsPerDay,
          is_active:              isActive
        })
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setConfigs(prev => ({ ...prev, [activeAgentId]: json.data }));
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la sauvegarde.");
      setSaveState('idle');
    }
  };

  const systemPromptCharCount = systemPrompt.length;

  // ── Nav ─────────────────────────────────────────────────────────────────
  const primaryItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, onClick: () => router.push('/admin') },
    { id: 'prospects', label: 'Prospects', icon: Users,           path:    '/admin/prospects' },
    { id: 'hq-agents', label: 'Agents HQ', icon: Brain,           path:    '/admin/hq/agents' }
  ];

  return (
    <DoubleRibbonIntelligent
      primaryItems={primaryItems}
      secondaryItems={[]}
      brandName="AUTOSLASH"
      brandIcon={Zap}
      userProfile={{
        name:  profile?.full_name || 'Amadou',
        email: user?.email        || 'admin@autoslash.ai'
      }}
    >
      <div className="min-h-screen bg-[#0A0A0A] font-mono text-white/90 p-6 lg:p-12 pb-40">
        <div className="max-w-[1000px] mx-auto space-y-16">

          {/* ── HEADER ─────────────────────────────────────────────────── */}
          <div className="flex justify-between items-end">
            <div className="space-y-4">
              <button
                onClick={() => router.push('/admin/hq/agents')}
                className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Retour au chat
              </button>
              <div className="flex items-center gap-3">
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: currentTabMeta.color, boxShadow: `0 0 10px ${currentTabMeta.color}` }}
                />
                <span className="text-[10px] font-bold text-white/40 tracking-[0.4em] uppercase">
                  Status // Agent_Configuration
                </span>
              </div>
              <h1 className="text-5xl font-normal text-white tracking-tighter">
                {currentTabMeta.label}
              </h1>
              <p className="text-xs text-white/40">{currentTabMeta.description}</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-white/20 uppercase tracking-widest mb-1">Table</p>
              <p className="text-xs font-bold text-white/60 tracking-wider">agent_configs</p>
            </div>
          </div>

          {/* ── TAB NAVIGATION ─────────────────────────────────────────── */}
          <div className="flex border-b border-white/10 gap-10">
            {AGENT_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`pb-4 text-[10px] font-bold uppercase tracking-[0.3em] transition-all relative ${
                  activeAgentId === tab.id ? 'text-white' : 'text-white/20 hover:text-white/40'
                }`}
              >
                {tab.label}
                {activeAgentId === tab.id && (
                  <motion.div
                    layoutId="settings-tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: tab.color, boxShadow: `0 0 10px ${tab.color}` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* ── ERREUR ─────────────────────────────────────────────────── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-xs font-mono text-red-400 flex-1">{error}</span>
                <button onClick={() => setError(null)} className="text-red-400/50 hover:text-red-400">✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── CONTENU ────────────────────────────────────────────────── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
              <p className="text-[10px] text-white/20 uppercase tracking-widest">Chargement de la configuration...</p>
            </div>
          ) : (
            <motion.div
              key={activeAgentId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-16"
            >

              {/* SECTION_01 // STATUS */}
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: currentTabMeta.color, boxShadow: `0 0 10px ${currentTabMeta.color}` }} />
                  <h2 className="text-sm font-bold text-white uppercase tracking-[0.3em]">Section_01 // Status</h2>
                </div>

                <div className="bg-[#141414] border border-white/10 rounded-2xl p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl border ${isActive ? 'bg-white/5 border-white/10' : 'bg-orange-500/10 border-orange-500/20'}`}>
                      <Power className={`w-5 h-5 ${isActive ? 'text-white/60' : 'text-orange-400'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{isActive ? 'Agent actif' : 'Agent désactivé'}</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">agent_id : {activeAgentId}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsActive(!isActive)}
                    className={`relative w-14 h-7 rounded-full transition-all cursor-pointer shrink-0 ${
                      isActive ? 'bg-[#39FF14]/30' : 'bg-white/10'
                    }`}
                  >
                    <motion.div
                      animate={{ x: isActive ? 28 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={`absolute top-1 w-5 h-5 rounded-full ${isActive ? 'bg-[#39FF14]' : 'bg-white/40'}`}
                    />
                  </button>
                </div>

                {(configs[activeAgentId]?.created_at || configs[activeAgentId]?.updated_at) && (
                  <div className="flex items-center gap-6 px-2 text-[9px] text-white/20 uppercase tracking-widest">
                    {configs[activeAgentId]?.updated_at && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Modifié le {new Date(configs[activeAgentId].updated_at).toLocaleString('fr-FR')}
                      </span>
                    )}
                  </div>
                )}
              </section>

              {/* SECTION_02 // MODEL_CONFIG */}
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-[0.3em]">Section_02 // Model_Config</h2>
                </div>

                <div className="bg-[#141414] border border-white/10 rounded-2xl p-8 space-y-8">

                  {/* Modèle */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Modèle actif</label>
                    <div className="bg-black border border-white/10 rounded-xl px-5 py-3.5 hover:border-white/20 transition-all relative group">
                      <select
                        value={model}
                        onChange={(e) => handleModelChange(e.target.value)}
                        className="w-full bg-black text-[13px] font-bold text-white outline-none cursor-pointer appearance-none relative z-10"
                      >
                        <option value="">SÉLECTIONNER UN MODÈLE</option>
                        {availableModels.map((m) => (
                          <option key={m.id} value={m.model_string} className="bg-black text-white">
                            {m.name} — {m.provider} ({m.complexity})
                          </option>
                        ))}
                        {model && !availableModels.some(m => m.model_string === model) && (
                          <option value={model} className="bg-black text-white">
                            {model} (valeur actuelle)
                          </option>
                        )}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover:text-white/40 transition-colors">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    {provider && (
                      <p className="text-[9px] text-white/20 uppercase tracking-widest px-1">Fournisseur : {provider}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Max tokens / session */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Tokens max / session</label>
                      <div className="bg-black border border-white/10 rounded-xl px-5 py-3.5">
                        <input
                          type="number"
                          value={maxTokensPerSession}
                          onChange={(e) => setMaxTokensPerSession(parseInt(e.target.value) || 0)}
                          className="w-full bg-transparent text-[13px] font-bold text-white outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* Max requests / jour */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Requêtes max / jour</label>
                      <div className="bg-black border border-white/10 rounded-xl px-5 py-3.5">
                        <input
                          type="number"
                          value={maxRequestsPerDay}
                          onChange={(e) => setMaxRequestsPerDay(parseInt(e.target.value) || 0)}
                          className="w-full bg-transparent text-[13px] font-bold text-white outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION_03 // SYSTEM_PROMPT */}
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <Terminal className="w-4 h-4" style={{ color: currentTabMeta.color }} />
                  <h2 className="text-sm font-bold text-white uppercase tracking-[0.3em]">Section_03 // System_Prompt</h2>
                </div>

                <div className="bg-black border border-white/10 rounded-2xl p-6 relative focus-within:border-white/20 transition-all">
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full h-72 bg-transparent text-[13px] font-mono text-white/80 outline-none placeholder:text-white/10 leading-relaxed resize-none"
                    placeholder={`Instructions système pour ${currentTabMeta.label}...`}
                  />
                  <div className="absolute bottom-4 right-6 text-[9px] font-bold uppercase tracking-widest text-white/20">
                    {systemPromptCharCount.toLocaleString('fr-FR')} caractères
                  </div>
                </div>
              </section>

            </motion.div>
          )}

        </div>
      </div>

      {/* ── BOUTON SYNC FLOTTANT ───────────────────────────────────────── */}
      <div className="fixed bottom-10 right-10 z-[200]">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={saveState === 'saving' || loading}
          className={`px-7 py-3.5 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] font-mono transition-all shadow-2xl border ${
            saveState === 'saved'
              ? 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30'
              : saveState === 'saving'
                ? 'bg-white/5 text-white/40 border-white/10 cursor-wait'
                : 'bg-white text-black border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]'
          }`}
        >
          {saveState === 'saving' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saveState === 'saved' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>
            {saveState === 'saving' ? 'SYNC EN COURS...' : saveState === 'saved' ? 'SYNCHRONISÉ' : `SYNC_${currentTabMeta.label}_STATE`}
          </span>
        </motion.button>
      </div>

    </DoubleRibbonIntelligent>
  );
}
