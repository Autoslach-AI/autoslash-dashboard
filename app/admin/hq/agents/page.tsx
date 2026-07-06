"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Brain, Zap, LayoutDashboard, Users,
  AlertTriangle, CheckCircle2, Clock,
  ChevronRight, Loader2, RefreshCw
} from 'lucide-react';
import { useUser } from '@/lib/contexts/user-context';
import DoubleRibbonIntelligent, { NavItem } from '@/components/DoubleRibbonIntelligent';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AgentConfig {
  agent_id:              string;
  provider:              string | null;
  model:                 string | null;
  max_tokens_per_session: number | null;
  max_requests_per_day:  number | null;
  system_prompt:         string | null;
  is_active:             boolean;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const AGENT_META: Record<string, {
  label:       string;
  description: string;
  role:        string;
  color:       string;
  border:      string;
  icon:        string;
}> = {
  axon: {
    label:       'AXON',
    description: 'Support client vitrine — parle aux visiteurs anonymes',
    role:        'SUPPORT PUBLIC',
    color:       'text-[#39FF14]',
    border:      'border-[#39FF14]/20',
    icon:        '⚡'
  },
  business: {
    label:       'BUSINESS',
    description: 'Assistant business — sert les clients inscrits sur la plateforme',
    role:        'ASSISTANT CLIENT',
    color:       'text-blue-400',
    border:      'border-blue-500/20',
    icon:        '💼'
  },
  commercial: {
    label:       'COMMERCIAL',
    description: 'Agent vocal commercial — interface vocale ElevenLabs',
    role:        'AGENT VOCAL',
    color:       'text-violet-400',
    border:      'border-violet-500/20',
    icon:        '🎙️'
  }
}

const AGENT_ORDER = ['axon', 'business', 'commercial']

// ─── Composant principal ─────────────────────────────────────────────────────

export default function HQAgentsPage() {
  const router            = useRouter()
  const { user, profile } = useUser()

  const [agents, setAgents]     = useState<AgentConfig[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  // ── Charger les agents ──────────────────────────────────────────────────
  const loadAgents = async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/admin/hq/agents')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setAgents(json.data ?? [])
      setLastSync(new Date())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAgents() }, [])

  // ── Nav ─────────────────────────────────────────────────────────────────
  const primaryItems: NavItem[] = [
    {
      id:      'dashboard',
      label:   'Dashboard',
      icon:    LayoutDashboard,
      onClick: () => router.push('/admin')
    },
    {
      id:    'prospects',
      label: 'Prospects',
      icon:  Users,
      path:  '/admin/prospects'
    },
    {
      id:    'hq-agents',
      label: 'Agents HQ',
      icon:  Brain,
      path:  '/admin/hq/agents'
    }
  ]

  // ── Helper statut ────────────────────────────────────────────────────────
  const getStatus = (agent: AgentConfig) => {
    if (!agent.is_active) return { label: 'INACTIF',   color: 'text-white/30',  bg: 'bg-white/5',         dot: 'bg-white/20'  }
    if (!agent.system_prompt) return { label: 'CONFIG REQUISE', color: 'text-orange-400', bg: 'bg-orange-500/10', dot: 'bg-orange-400 animate-pulse' }
    return { label: 'ACTIF', color: 'text-[#39FF14]', bg: 'bg-[#39FF14]/10', dot: 'bg-[#39FF14] animate-pulse' }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
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
      <div className="min-h-screen bg-[#0A0A0A] font-mono">
        <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-10">

          {/* ── Header ── */}
          <div className="flex items-center justify-between border-b border-white/5 pb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#39FF14]/10 border border-[#39FF14]/20">
                  <Brain className="w-4 h-4 text-[#39FF14]" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Agents Autoslash
                </h1>
              </div>
              <p className="text-[11px] font-mono text-white/30 uppercase tracking-widest pl-11">
                {agents.length} agents configurés — 1 cerveau, 3 contextes
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastSync && (
                <span className="text-[10px] font-mono text-white/20">
                  Sync {lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <button
                onClick={loadAgents}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/40 text-[11px] font-medium hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>
          </div>

          {/* ── Erreur ── */}
          {error && (
            <div className="flex items-center gap-3 px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-xs font-mono text-red-400">{error}</span>
            </div>
          )}

          {/* ── Loading ── */}
          {loading ? (
            <div className="flex items-center justify-center py-40">
              <Loader2 className="w-6 h-6 text-[#39FF14] animate-spin" />
            </div>
          ) : (
            <div className="space-y-8">

              {/* ── Compteurs globaux ── */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    label:    'Agents actifs',
                    value:    agents.filter(a => a.is_active && a.system_prompt).length,
                    total:    3,
                    color:    'text-[#39FF14]',
                    bg:       'bg-[#39FF14]/5',
                    border:   'border-[#39FF14]/10',
                    desc:     'System prompt configuré'
                  },
                  {
                    label:    'Config requise',
                    value:    agents.filter(a => !a.system_prompt).length,
                    total:    3,
                    color:    'text-orange-400',
                    bg:       'bg-orange-500/5',
                    border:   'border-orange-500/10',
                    desc:     'System prompt manquant'
                  },
                  {
                    label:    'Inactifs',
                    value:    agents.filter(a => !a.is_active).length,
                    total:    3,
                    color:    'text-white/30',
                    bg:       'bg-white/[0.02]',
                    border:   'border-white/5',
                    desc:     'Désactivés manuellement'
                  }
                ].map(stat => (
                  <div
                    key={stat.label}
                    className={`${stat.bg} border ${stat.border} rounded-2xl p-6 space-y-3`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                        <Brain className="w-3.5 h-3.5 text-white/30" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium text-white/40 uppercase tracking-widest">
                        {stat.label}
                      </p>
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-4xl font-bold tabular-nums leading-none tracking-tight ${stat.color}`}>
                          {stat.value}
                        </span>
                        <span className="text-[13px] text-white/20 font-mono">
                          / {stat.total}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/25 font-mono">
                        {stat.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── 3 Cartes agents ── */}
              <div className="space-y-3">
                <p className="text-[11px] font-medium text-white/30 uppercase tracking-widest px-1">
                  Contextes
                </p>
                <div className="space-y-3">
                  {AGENT_ORDER.map((agentId, idx) => {
                    const agent  = agents.find(a => a.agent_id === agentId)
                    const meta   = AGENT_META[agentId]
                    const status = agent ? getStatus(agent) : null

                    return (
                      <motion.div
                        key={agentId}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        onClick={() => router.push(`/admin/hq/agents/${agentId}`)}
                        className="group bg-[#0D0D0D] border border-white/5 hover:border-white/10 rounded-2xl p-6 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between">

                          {/* Gauche — identité */}
                          <div className="flex items-center gap-5">
                            <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                              agentId === 'axon'       ? 'border-[#39FF14]/20 bg-[#39FF14]/5'  :
                              agentId === 'business'   ? 'border-blue-500/20 bg-blue-500/5'    :
                              'border-violet-500/20 bg-violet-500/5'
                            }`}>
                              <span className="text-xl">{meta.icon}</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <h2 className={`text-[15px] font-bold tracking-tight ${
                                  agent ? meta.color : 'text-white/30'
                                }`}>
                                  {meta.label}
                                </h2>
                                {status && (
                                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${status.color}`}>
                                      {status.label}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <p className="text-[12px] text-white/40">
                                {meta.description}
                              </p>
                            </div>
                          </div>

                          {/* Droite — infos + flèche */}
                          <div className="flex items-center gap-8">
                            {agent && (
                              <div className="flex items-center gap-6 text-right">
                                <div className="space-y-0.5">
                                  <p className="text-[9px] font-medium text-white/20 uppercase tracking-widest">
                                    Modèle
                                  </p>
                                  <p className="text-[12px] font-mono text-white/60">
                                    {agent.model ?? '—'}
                                  </p>
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[9px] font-medium text-white/20 uppercase tracking-widest">
                                    Max tokens
                                  </p>
                                  <p className="text-[12px] font-mono text-white/60">
                                    {agent.max_tokens_per_session?.toLocaleString('fr-FR') ?? '—'}
                                  </p>
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[9px] font-medium text-white/20 uppercase tracking-widest">
                                    Req/jour
                                  </p>
                                  <p className="text-[12px] font-mono text-white/60">
                                    {agent.max_requests_per_day?.toLocaleString('fr-FR') ?? '—'}
                                  </p>
                                </div>
                              </div>
                            )}
                            <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white/40 group-hover:translate-x-1 transition-all" />
                          </div>

                        </div>

                        {/* Alerte system_prompt NULL */}
                        {agent && !agent.system_prompt && (
                          <div className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                            <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                            <span className="text-[10px] font-medium text-orange-400">
                              System prompt non configuré — cliquer pour configurer
                            </span>
                          </div>
                        )}

                        {/* Aperçu system_prompt si configuré */}
                        {agent && agent.system_prompt && (
                          <div className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-[#39FF14]/5 border border-[#39FF14]/10 rounded-xl">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#39FF14]/60 shrink-0" />
                            <span className="text-[10px] font-mono text-[#39FF14]/60 truncate">
                              {agent.system_prompt.substring(0, 80)}...
                            </span>
                          </div>
                        )}

                      </motion.div>
                    )
                  })}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </DoubleRibbonIntelligent>
  )
}
