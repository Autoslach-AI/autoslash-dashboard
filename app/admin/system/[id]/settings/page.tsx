"use client";

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  CreditCard, 
  Plug, 
  Bell, 
  AlertTriangle, 
  Save, 
  ChevronRight, 
  Info,
  ExternalLink,
  Mail,
  ShieldCheck,
  Zap,
  Box,
  Server,
  X
} from 'lucide-react';
import { useSystem } from '../SystemContext';
import { motion, AnimatePresence } from 'framer-motion';

const sections = [
  { id: 'general',      label: 'GÉNÉRAL',         icon: Settings,      active: true  },
  { id: 'plan',         label: 'PLAN & CONTRAT',   icon: CreditCard,    active: true  },
  { id: 'integrations', label: 'INTÉGRATIONS',     icon: Plug,          active: false },
  { id: 'notifications',label: 'NOTIFICATIONS',    icon: Bell,          active: false },
  { id: 'danger',       label: 'DANGER ZONE',      icon: AlertTriangle, active: false }
];

export default function SettingsPage() {
  const { enterprise, planDef, refreshEnterprise, loading } = useSystem();
  const [activeSection, setActiveSection] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // States for General
  const [generalForm, setGeneralForm] = useState({
    name: '',
    sector: '',
    region: '',
    email: '',
    phone: '',
    is_test: false,
    warning_flag: false
  });

  // States for Overrides
  const [overridesForm, setOverridesForm] = useState({
    max_agents_override: '',
    token_budget_override: '',
    is_custom_pricing: false,
    custom_notes: ''
  });

  useEffect(() => {
    if (enterprise) {
      setGeneralForm({
        name: enterprise.name || '',
        sector: enterprise.sector || '',
        region: enterprise.region || '',
        email: enterprise.email || '',
        phone: enterprise.phone || '',
        is_test: enterprise.is_test || false,
        warning_flag: enterprise.warning_flag || false
      });

      setOverridesForm({
        max_agents_override: enterprise.max_agents_override?.toString() || '',
        token_budget_override: enterprise.token_budget_override?.toString() || '',
        is_custom_pricing: enterprise.is_custom_pricing || false,
        custom_notes: enterprise.custom_notes || ''
      });
    }
  }, [enterprise]);

  const handleSaveGeneral = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/admin/enterprise/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enterprise_id: enterprise.enterprise_id,
          ...generalForm
        })
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      
      await refreshEnterprise();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveOverrides = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/admin/enterprise/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enterprise_id: enterprise.enterprise_id,
          max_agents_override: overridesForm.max_agents_override === '' ? null : parseInt(overridesForm.max_agents_override),
          token_budget_override: overridesForm.token_budget_override === '' ? null : parseInt(overridesForm.token_budget_override),
          is_custom_pricing: overridesForm.is_custom_pricing,
          custom_notes: overridesForm.custom_notes
        })
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      
      await refreshEnterprise();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !enterprise) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-white/20 font-mono text-xs uppercase tracking-widest">
        Loading_Central_Config...
      </div>
    );
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'general':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">PROJECT_ID</label>
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                    <Box className="w-4 h-4 text-[#39FF14]" />
                    <span className="font-mono text-sm text-white/30 truncate">{enterprise.project_id}</span>
                    <span className="ml-auto bg-white/10 px-2 py-0.5 rounded text-[9px] font-bold text-white/60">READ_ONLY</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">NOM_ENTREPRISE</label>
                  <input 
                    type="text" 
                    value={generalForm.name} 
                    onChange={(e) => setGeneralForm({...generalForm, name: e.target.value})}
                    className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#39FF14]/50 outline-none transition-all font-mono" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">SECTEUR_ACTIVITÉ</label>
                  <input 
                    type="text" 
                    value={generalForm.sector} 
                    onChange={(e) => setGeneralForm({...generalForm, sector: e.target.value})}
                    placeholder="Ex: Retail, FinTech, IA..."
                    className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#39FF14]/50 outline-none transition-all font-mono" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold font-mono">RÉGION</label>
                  <input 
                    type="text" 
                    value={generalForm.region} 
                    onChange={(e) => setGeneralForm({...generalForm, region: e.target.value})}
                    placeholder="Ex: Dakar, Paris, West Africa..."
                    className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#39FF14]/50 outline-none transition-all font-mono" 
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">EMAIL_CONTACT</label>
                  <input 
                    type="email" 
                    value={generalForm.email} 
                    onChange={(e) => setGeneralForm({...generalForm, email: e.target.value})}
                    className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#39FF14]/50 outline-none transition-all font-mono" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold font-mono">TÉLÉPHONE</label>
                  <input 
                    type="text" 
                    value={generalForm.phone} 
                    onChange={(e) => setGeneralForm({...generalForm, phone: e.target.value})}
                    className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#39FF14]/50 outline-none transition-all font-mono" 
                  />
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="space-y-1">
                      <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        MODE TEST {generalForm.is_test && <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded cursor-default border border-orange-500/20">ACTIF</span>}
                      </div>
                      <div className="text-[10px] text-white/30">Désactive la facturation réelle et active les logs débug.</div>
                    </div>
                    <button 
                      onClick={() => setGeneralForm({...generalForm, is_test: !generalForm.is_test})}
                      className={`w-12 h-6 rounded-full relative transition-all ${generalForm.is_test ? 'bg-orange-500' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${generalForm.is_test ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="space-y-1">
                      <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-red-400">
                        WARNING FLAG {generalForm.warning_flag && <span className="text-[9px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded cursor-default border border-red-500/20 animate-pulse">LOCK</span>}
                      </div>
                      <div className="text-[10px] text-white/30 truncate">Affiche une alerte rouge critique sur le dashboard client.</div>
                    </div>
                    <button 
                      onClick={() => setGeneralForm({...generalForm, warning_flag: !generalForm.warning_flag})}
                      className={`w-12 h-6 rounded-full relative transition-all ${generalForm.warning_flag ? 'bg-red-500' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${generalForm.warning_flag ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 flex items-center justify-between">
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em]">
                Last_Oracle_Sync: {new Date().toISOString().split('T')[0]}
              </div>
              <button 
                onClick={handleSaveGeneral}
                disabled={isSaving}
                className="bg-[#39FF14] text-black px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
              >
                {isSaving ? 'Synching...' : <><Save className="w-4 h-4" /> SAVE_GENERAL_CONFIG</>}
              </button>
            </div>
          </motion.div>
        );

      case 'plan':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">

            {/* BLOC 1 — Plan souscrit */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">PLAN_CONTRACT_NODE</h2>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                  enterprise.package_type === 'ELITE'      ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                  enterprise.package_type === 'ENTERPRISE' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                  enterprise.package_type === 'BUSINESS'   ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                             'bg-white/5 text-white/40 border border-white/10'
                }`}>
                  {enterprise.package_type || 'STARTUP'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {!enterprise.is_custom_pricing && (
                  <div className="bg-black/40 rounded-2xl p-5 border border-white/5 space-y-2">
                    <div className="text-[9px] font-black uppercase tracking-widest text-white/30">PRIX_BASE</div>
                    <div className="text-xl font-black text-white font-mono">
                      {planDef?.base_price_fcfa?.toLocaleString() ?? '—'} <span className="text-xs text-white/30">FCFA</span>
                    </div>
                  </div>
                )}
                <div className="bg-black/40 rounded-2xl p-5 border border-white/5 space-y-2">
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/30">MAX_AGENTS</div>
                  <div className="text-xl font-black text-[#39FF14] font-mono">
                    {enterprise.max_agents_override ?? planDef?.max_agents_allowed ?? '—'}
                    {enterprise.max_agents_override && <span className="text-[8px] text-orange-400 ml-2">OVERRIDE</span>}
                  </div>
                </div>
                <div className="bg-black/40 rounded-2xl p-5 border border-white/5 space-y-2">
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/30">KB_NODES</div>
                  <div className="text-xl font-black text-white font-mono">
                    {planDef?.max_kb_nodes === -1 ? '∞' : planDef?.max_kb_nodes ?? '—'}
                  </div>
                </div>
                <div className="bg-black/40 rounded-2xl p-5 border border-white/5 space-y-2">
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/30">STORAGE</div>
                  <div className="text-xl font-black text-white font-mono">
                    {planDef?.max_kb_storage_mb === -1 ? '∞' : `${planDef?.max_kb_storage_mb ?? '—'}`} <span className="text-xs text-white/30">MB</span>
                  </div>
                </div>
                <div className="bg-black/40 rounded-2xl p-5 border border-white/5 space-y-2">
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/30">RAG</div>
                  <div className={`text-sm font-black uppercase ${planDef?.kb_rag_enabled ? 'text-[#39FF14]' : 'text-white/20'}`}>
                    {planDef?.kb_rag_enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
                  </div>
                </div>
                <div className="bg-black/40 rounded-2xl p-5 border border-white/5 space-y-2">
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/30">ACTIVATED_AT</div>
                  <div className="text-sm font-black text-white/60 font-mono">
                    {enterprise.activated_at ? new Date(enterprise.activated_at).toLocaleDateString('fr-FR') : '—'}
                  </div>
                </div>
              </div>

              {enterprise.package_type !== 'ELITE' && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#39FF14]/20 text-[#39FF14] text-[10px] font-black uppercase tracking-widest hover:bg-[#39FF14]/5 transition-all"
                >
                  <Zap className="w-3.5 h-3.5" />
                  UPGRADE_PLAN
                </button>
              )}
            </div>

            {/* BLOC 2 — Token Budget */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 space-y-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">TOKEN_BUDGET_MONITOR</h2>

              {enterprise.token_budget === -1 || enterprise.token_budget_override === -1 ? (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
                  <span className="text-sm font-black text-[#39FF14] uppercase tracking-widest">INFRASTRUCTURE DÉDIÉE — ILLIMITÉ</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const budget   = enterprise.token_budget_override ?? enterprise.token_budget ?? 1
                    const consumed = enterprise.total_tokens_consumed ?? 0
                    const pct      = Math.min((consumed / budget) * 100, 100)
                    const color    = pct > 90 ? '#EF4444' : pct > 70 ? '#F97316' : '#39FF14'
                    return (
                      <>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-white/40">CONSOMMÉS</span>
                          <span style={{ color }}>{consumed.toLocaleString()} / {budget.toLocaleString()} tokens</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-mono text-white/20">
                          <span>0%</span>
                          <span style={{ color }}>{pct.toFixed(1)}% UTILISÉ</span>
                          <span>100%</span>
                        </div>
                      </>
                    )
                  })()}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                      <div className="text-[9px] text-white/30 uppercase tracking-widest mb-1">COÛT_MENSUEL</div>
                      <div className="text-lg font-black text-white font-mono">
                        {enterprise.monthly_cost?.toLocaleString() ?? '—'} <span className="text-xs text-white/30">FCFA</span>
                      </div>
                    </div>
                    <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                      <div className="text-[9px] text-white/30 uppercase tracking-widest mb-1">ALERT_THRESHOLD</div>
                      <div className="text-lg font-black text-white font-mono">
                        {enterprise.alert_threshold ?? '—'}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* BLOC 3 — Overrides Amadou */}
            <div className="bg-violet-500/5 border border-violet-500/20 rounded-3xl p-8 space-y-8">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-violet-400" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-400">OVERRIDE_CONSOLE — AMADOU ONLY</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold font-mono">
                    MAX_AGENTS_OVERRIDE <span className="text-white/20">(vide = plan par défaut)</span>
                  </label>
                  <input
                    type="number"
                    value={overridesForm.max_agents_override}
                    onChange={(e) => setOverridesForm({...overridesForm, max_agents_override: e.target.value})}
                    placeholder={`Défaut plan : ${planDef?.max_agents_allowed ?? '—'}`}
                    className="w-full bg-[#111111] border border-violet-500/20 rounded-xl px-4 py-3 text-sm focus:border-violet-500/50 outline-none transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold font-mono">
                    TOKEN_BUDGET_OVERRIDE <span className="text-white/20">(-1 = illimité)</span>
                  </label>
                  <input
                    type="number"
                    value={overridesForm.token_budget_override}
                    onChange={(e) => setOverridesForm({...overridesForm, token_budget_override: e.target.value})}
                    placeholder={`Défaut plan : ${enterprise.token_budget ?? '—'}`}
                    className="w-full bg-[#111111] border border-violet-500/20 rounded-xl px-4 py-3 text-sm focus:border-violet-500/50 outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/30 border border-violet-500/10 rounded-2xl">
                <div className="space-y-1">
                  <div className="text-xs font-black uppercase tracking-wider text-white/70">IS_CUSTOM_PRICING</div>
                  <div className="text-[9px] text-white/30 font-mono">Masque les prix standards — affiche custom_notes</div>
                </div>
                <button
                  onClick={() => setOverridesForm({...overridesForm, is_custom_pricing: !overridesForm.is_custom_pricing})}
                  className={`w-12 h-6 rounded-full relative transition-all ${overridesForm.is_custom_pricing ? 'bg-violet-500' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${overridesForm.is_custom_pricing ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              {overridesForm.is_custom_pricing && (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold font-mono">CUSTOM_NOTES</label>
                  <textarea
                    value={overridesForm.custom_notes}
                    onChange={(e) => setOverridesForm({...overridesForm, custom_notes: e.target.value})}
                    placeholder="Notes contractuelles visibles uniquement par Autoslash..."
                    className="w-full bg-[#111111] border border-violet-500/20 rounded-xl px-4 py-3 text-sm focus:border-violet-500/50 outline-none transition-all font-mono h-28 resize-none"
                  />
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleSaveOverrides}
                  disabled={isSaving}
                  className="bg-violet-600 text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-violet-500 transition-all flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isSaving ? 'SYNCING...' : 'COMMIT_INTERNAL_OVERRIDES'}
                </button>
              </div>
            </div>

            {/* Modal Upgrade */}
            <AnimatePresence>
              {showUpgradeModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center"
                  onClick={() => setShowUpgradeModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-10 max-w-md w-full space-y-6"
                  >
                    <h3 className="text-lg font-black uppercase tracking-widest text-white">UPGRADE_PLAN</h3>
                    <p className="text-sm text-white/40 font-mono leading-relaxed">
                      Pour faire évoluer l'infrastructure de cette enterprise vers un plan supérieur, contactez Autoslash directement.
                    </p>
                    
                    <a 
                      href={`mailto:contact@autoslash.ai?subject=UPGRADE REQUEST — ${enterprise.name} — ${enterprise.project_id}`}
                      className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-[#39FF14]/10 border border-[#39FF14]/20 text-[#39FF14] text-xs font-black uppercase tracking-widest hover:bg-[#39FF14]/20 transition-all"
                    >
                      <Mail className="w-4 h-4" />
                      CONTACTER AUTOSLASH
                    </a>
                    <button
                      onClick={() => setShowUpgradeModal(false)}
                      className="w-full py-3 rounded-xl border border-white/10 text-white/30 text-xs font-mono uppercase tracking-widest hover:border-white/20 transition-all"
                    >
                      ANNULER
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex text-white font-mono selection:bg-[#39FF14] selection:text-black">
      {/* SIDEBAR SETTINGS */}
      <aside className="w-[260px] border-r border-white/5 flex flex-col pt-24 shrink-0 px-6">
        <div className="space-y-2">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => s.active && setActiveSection(s.id)}
                disabled={!s.active}
                className={`w-full group relative flex items-center gap-4 px-5 py-4 rounded-2xl transition-all border ${
                  activeSection === s.id 
                    ? 'bg-[#39FF14]/5 border-[#39FF14]/20 text-[#39FF14]' 
                    : s.active 
                      ? 'border-transparent text-white/40 hover:bg-white/5 hover:text-white' 
                      : 'border-transparent text-white/10 cursor-not-allowed opacity-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${activeSection === s.id ? 'text-[#39FF14]' : 'text-current opacity-60'}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{s.label}</span>
                {!s.active && (
                   <span className="ml-auto text-[7px] font-black bg-white/5 px-1.5 py-0.5 rounded text-white/20 whitespace-nowrap">SOON</span>
                )}
                {activeSection === s.id && (
                  <motion.div layoutId="setting-active" className="absolute left-0 w-1 h-1/2 bg-[#39FF14] rounded-full shadow-[0_0_10px_#39FF14]" />
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 pt-24 px-16 max-w-[1200px]">
        {/* HEADER */}
        <div className="mb-16 space-y-4">
          <div className="flex items-center gap-4 text-white/20 text-[10px] font-bold uppercase tracking-[0.4em]">
            <span>CONTROL_PANEL</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#39FF14]">{activeSection}</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-white uppercase italic">
            Configurate_System//<span className="text-[#39FF14] opacity-80">{enterprise.name?.replace(/\s/g, '_')}</span>
          </h1>
        </div>

        {renderSectionContent()}
      </main>

      {/* TOASTS ERREUR / SUCCES */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 right-10 bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-[1000] border border-red-400/50"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">{error}</span>
            <button onClick={() => setError(null)} className="ml-4 hover:opacity-50 transition-all"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 right-10 bg-[#39FF14] text-black px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-[1000]"
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">DATABASE_SYNC_STABLE // COMMIT_SUCCESS</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL UPGRADE */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[2000] flex items-center justify-center p-6">
             <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full bg-[#111111] border border-white/10 p-12 rounded-[2.5rem] text-center space-y-10 shadow-[0_0_100px_rgba(57,255,20,0.05)]"
             >
                <div className="w-24 h-24 bg-violet-600/10 rounded-full flex items-center justify-center mx-auto text-violet-500 shadow-[0_0_40px_rgba(139,92,246,0.1)]">
                   <Zap className="w-10 h-10 animate-pulse" />
                </div>
                <div className="space-y-4">
                   <h2 className="text-3xl font-bold tracking-tight text-white uppercase italic">Flow_Upgrade_Locked</h2>
                   <p className="text-white/40 text-[11px] font-mono leading-relaxed uppercase tracking-wider">
                      Évoluer vers le plan supérieur nécessite une resynchronisation manuelle des ressources. <br/>
                      Veuillez contacter le support Autoslash pour lancer la procédure d'upgrade.
                   </p>
                </div>
                <div className="flex flex-col gap-4">
                   <a 
                    href={`mailto:contact@autoslash.ai?subject=Upgrade Plan: ${enterprise.name}&body=Bonjour Amadou, nous aimerions surclasser le plan de ${enterprise.name}.`}
                    className="w-full bg-white text-black py-4 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-[#39FF14] transition-all"
                   >
                     <Mail className="w-4 h-4" /> CONTACT_AUTOSLASH_DIRECT
                   </a>
                   <button 
                    onClick={() => setShowUpgradeModal(false)}
                    className="w-full py-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.4em] text-white/20 hover:text-white transition-all"
                   >
                      ABORT_SEQUENCE
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


