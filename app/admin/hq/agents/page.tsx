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
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-10 space-y-8">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/5 border border-white/10 rounded-xl">
                <Brain className="w-5 h-5 text-[#39FF14]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  AGENTS_HQ
                </h1>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">
                  {agents.length} AGENTS CONFIGURÉS — AUTOSLASH AI
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {lastSync && (
                <span className="text-[9px] font-mono text-white/20 uppercase">
                  Sync {lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <button
                onClick={loadAgents}
                disabled={loading}
                className="p-2 rounded-xl border border-white/10 text-white/30 hover:text-[#39FF14] hover:border-[#39FF14]/20 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* ── Erreur ──────────────────────────────────────────────────── */}
          {error && (
            <div className="flex items-center gap-3 px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-xs font-mono text-red-400">{error}</span>
            </div>
          )}

          {/* ── Loading ─────────────────────────────────────────────────── */}
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-6 h-6 text-[#39FF14] animate-spin" />
            </div>
          ) : (
            <>
              {/* ── 3 Cartes agents ─────────────────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {AGENT_ORDER.map((agentId, idx) => {
                  const agent = agents.find(a => a.agent_id === agentId)
                  const meta  = AGENT_META[agentId]
                  const status = agent ? getStatus(agent) : null

                  return (
                    <motion.div
                      key={agentId}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      onClick={() => router.push(`/admin/hq/agents/${agentId}`)}
                      className={`group relative bg-[#0D0D0D] border ${
                        agent ? meta.border : 'border-white/5'
                      } rounded-2xl p-6 cursor-pointer hover:bg-[#111111] transition-all space-y-5`}
                    >
                      {/* Header carte */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{meta.icon}</span>
                          <div>
                            <h2 className={`text-[13px] font-black uppercase tracking-widest ${
                              agent ? meta.color : 'text-white/30'
                            }`}>
                              {meta.label}
                            </h2>
                            <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
                              {meta.role}
                            </p>
                          </div>
                        </div>
                        {status && (
                          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${status.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            <span className={`text-[8px] font-black uppercase tracking-widest ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                        )}
                        {!agent && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5">
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/20">
                              NON TROUVÉ
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-[11px] font-mono text-white/50 leading-relaxed">
                        {meta.description}
                      </p>

                      {/* Infos config */}
                      {agent && (
                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-0.5">
                              <span className="text-[7px] font-black uppercase tracking-widest text-white/20">
                                PROVIDER
                              </span>
                              <p className="text-[10px] font-mono text-white/60">
                                {agent.provider ?? '—'}
                              </p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[7px] font-black uppercase tracking-widest text-white/20">
                                MODÈLE
                              </span>
                              <p className="text-[10px] font-mono text-white/60 truncate">
                                {agent.model ?? '—'}
                              </p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[7px] font-black uppercase tracking-widest text-white/20">
                                MAX TOKENS
                              </span>
                              <p className="text-[10px] font-mono text-white/60">
                                {agent.max_tokens_per_session?.toLocaleString('fr-FR') ?? '—'}
                              </p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[7px] font-black uppercase tracking-widest text-white/20">
                                REQ/JOUR
                              </span>
                              <p className="text-[10px] font-mono text-white/60">
                                {agent.max_requests_per_day?.toLocaleString('fr-FR') ?? '—'}
                              </p>
                            </div>
                          </div>

                          {/* Alerte system_prompt NULL */}
                          {!agent.system_prompt && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl mt-2">
                              <AlertTriangle className="w-3 h-3 text-orange-400 shrink-0" />
                              <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest">
                                SYSTEM PROMPT NON CONFIGURÉ
                              </span>
                            </div>
                          )}

                          {agent.system_prompt && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-[#39FF14]/5 border border-[#39FF14]/10 rounded-xl mt-2">
                              <CheckCircle2 className="w-3 h-3 text-[#39FF14]/60 shrink-0" />
                              <span className="text-[8px] font-mono text-[#39FF14]/60 truncate">
                                {agent.system_prompt.substring(0, 50)}...
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Footer carte */}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[8px] font-mono text-white/20 uppercase">
                          Cliquer pour configurer
                        </span>
                        <ChevronRight className={`w-4 h-4 text-white/10 group-hover:${
                          agent ? meta.color : 'text-white/30'
                        } group-hover:translate-x-1 transition-all`} />
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* ── Résumé global ───────────────────────────────────────── */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    label: 'AGENTS ACTIFS',
                    value: agents.filter(a => a.is_active && a.system_prompt).length,
                    total: 3,
                    color: 'text-[#39FF14]'
                  },
                  {
                    label: 'CONFIG REQUISE',
                    value: agents.filter(a => !a.system_prompt).length,
                    total: 3,
                    color: 'text-orange-400'
                  },
                  {
                    label: 'INACTIFS',
                    value: agents.filter(a => !a.is_active).length,
                    total: 3,
                    color: 'text-white/30'
                  }
                ].map(stat => (
                  <div
                    key={stat.label}
                    className="bg-[#0D0D0D] border border-white/5 rounded-2xl px-6 py-5 flex items-center justify-between"
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30">
                      {stat.label}
                    </span>
                    <span className={`text-[24px] font-black font-mono ${stat.color}`}>
                      {stat.value}
                      <span className="text-[14px] text-white/20">/{stat.total}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </DoubleRibbonIntelligent>
  )
}
