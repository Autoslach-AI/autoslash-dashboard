"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Filter, Download, RefreshCw,
  LayoutGrid, List, X, AlertTriangle, Loader2,
  Calendar, ChevronDown
} from 'lucide-react';
import { useUser } from '@/lib/contexts/user-context';
import DoubleRibbonIntelligent, { NavItem } from '@/components/DoubleRibbonIntelligent';
import { LayoutDashboard, Zap } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Prospect {
  enterprise_id:       string;
  name:                string;
  contact_name:        string | null;
  email:               string | null;
  phone:               string | null;
  region:              string | null;
  sector:              string | null;
  package_type:        string | null;
  template_id:         string | null;
  monthly_cost:        number | null;
  message:             string | null;
  status:              string;
  prospect_status:     string | null;
  prospect_score:      number | null;
  rappel_at:           string | null;
  internal_notes:      string | null;
  verbatim:            string | null;
  source_contact:      string | null;
  next_action:         string | null;
  valeur_estimee_fcfa: number | null;
  created_at:          string;
  activated_at:        string | null;
  assets_urls:         any;
}

// ─── Constantes ─────────────────────────────────────────────────────────────

const PACKAGE_TYPES    = ['ALL', 'STARTUP', 'BUSINESS', 'ENTERPRISE', 'ELITE']
const PROSPECT_STATUTS = ['ALL', 'NEW', 'EN_CONTACT', 'NÉGOCIATION', 'EN_ATTENTE', 'RAPPELER', 'CONVERTI', 'PERDU', 'ANNULÉ']
const PERIODS          = [
  { label: 'Tout',    value: 'ALL'   },
  { label: 'Jour',    value: 'DAY'   },
  { label: 'Semaine', value: 'WEEK'  },
  { label: 'Mois',    value: 'MONTH' },
  { label: 'Année',   value: 'YEAR'  }
]

const STATUS_COLORS: Record<string, string> = {
  NEW:          'bg-white/5 text-white/40 border-white/10',
  EN_CONTACT:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  NÉGOCIATION:  'bg-violet-500/10 text-violet-400 border-violet-500/20',
  EN_ATTENTE:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  RAPPELER:     'bg-orange-500/10 text-orange-400 border-orange-500/20',
  CONVERTI:     'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/20',
  PERDU:        'bg-red-500/10 text-red-400 border-red-500/20',
  ANNULÉ:       'bg-white/5 text-white/20 border-white/10'
}

const PACKAGE_COLORS: Record<string, string> = {
  STARTUP:    'bg-white/5 text-white/40 border-white/10',
  BUSINESS:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ENTERPRISE: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  ELITE:      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
}

function getHeatBadge(score: number | null): { label: string; color: string } {
  if (!score || score < 30) return { label: 'COLD', color: 'text-white/30' }
  if (score < 60)           return { label: 'WARM', color: 'text-yellow-400' }
  return                           { label: 'HOT',  color: 'text-red-400'    }
}

const LIMIT = 50

// ─── Composant principal ─────────────────────────────────────────────────────

export default function ProspectsPage() {
  const router       = useRouter()
  const { user, profile } = useUser()

  // ── View state ───────────────────────────────────────────────────────────
  const [view, setView] = useState<'TABLE' | 'KANBAN'>('TABLE')

  // ── Filters ──────────────────────────────────────────────────────────────
  const [search,          setSearch]          = useState('')
  const [filterPackage,   setFilterPackage]   = useState('ALL')
  const [filterStatus,    setFilterStatus]    = useState('ALL')
  const [filterPeriod,    setFilterPeriod]    = useState('ALL')

  // ── Data ─────────────────────────────────────────────────────────────────
  const [prospects,    setProspects]    = useState<Prospect[]>([])
  const [total,        setTotal]        = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [loadingMore,  setLoadingMore]  = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [hasMore,      setHasMore]      = useState(true)
  const offsetRef = useRef(0)

  // ── Selected prospect (side panel) ───────────────────────────────────────
  const [selected, setSelected] = useState<Prospect | null>(null)

  // ── Load ─────────────────────────────────────────────────────────────────
  const loadProspects = useCallback(async (reset = false) => {
    if (reset) {
      offsetRef.current = 0
      setProspects([])
      setHasMore(true)
    }

    const currentOffset = offsetRef.current
    if (currentOffset === 0) setLoading(true)
    else setLoadingMore(true)

    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('offset', String(currentOffset))
      params.set('limit',  String(LIMIT))
      if (filterPackage !== 'ALL') params.set('package_type',    filterPackage)
      if (filterStatus  !== 'ALL') params.set('prospect_status', filterStatus)
      if (filterPeriod  !== 'ALL') params.set('period',          filterPeriod)
      if (search)                  params.set('search',          search)

      const res              = await fetch(`/api/admin/prospects?${params.toString()}`)
      const { data, total: t, error: err } = await res.json()
      if (err) throw new Error(err)

      setProspects(prev => reset ? (data ?? []) : [...prev, ...(data ?? [])])
      setTotal(t ?? 0)
      offsetRef.current = currentOffset + LIMIT
      setHasMore((data ?? []).length === LIMIT)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filterPackage, filterStatus, filterPeriod, search])

  // Reset on filter change
  useEffect(() => { loadProspects(true) }, [filterPackage, filterStatus, filterPeriod])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => loadProspects(true), 400)
    return () => clearTimeout(t)
  }, [search])

  // Infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        loadProspects(false)
      }
    }, { threshold: 0.1 })
    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, loadProspects])

  // ── Export CSV ────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['NOM', 'CONTACT', 'EMAIL', 'TÉLÉPHONE', 'RÉGION', 'SECTEUR', 'PLAN', 'STATUT', 'BUDGET_FCFA', 'RAPPEL', 'NEXT_ACTION', 'DATE']
    const rows = prospects.map(p => [
      p.name, p.contact_name, p.email, p.phone, p.region, p.sector,
      p.package_type, p.prospect_status, p.valeur_estimee_fcfa,
      p.rappel_at ? new Date(p.rappel_at).toLocaleDateString('fr-FR') : '',
      p.next_action,
      new Date(p.created_at).toLocaleDateString('fr-FR')
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `prospects_${new Date().toISOString().split('T')[0]}.csv`);
    link.click()
  }

  // ── Nav ──────────────────────────────────────────────────────────────────
  const primaryItems: NavItem[] = [
    { id: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard, onClick: () => router.push('/admin') },
    { id: 'prospects',  label: 'Prospects',  icon: Users,           path: '/admin/prospects' }
  ]

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <DoubleRibbonIntelligent
      primaryItems={primaryItems}
      secondaryItems={[]}
      brandName="AUTOSLASH"
      brandIcon={Zap}
      userProfile={{
        name:   profile?.full_name || 'Amadou',
        email:  user?.email        || 'admin@autoslash.ai',
      }}
    >
      <div className="min-h-screen bg-[#0A0A0A] font-mono">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-10 space-y-8">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-[#39FF14]" />
                <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90">
                  PIPELINE_PROSPECTS
                </h1>
                <span className="px-2 py-0.5 rounded bg-[#39FF14]/10 border border-[#39FF14]/20 text-[8px] font-black text-[#39FF14]">
                  {total} TOTAL
                </span>
              </div>
              <p className="text-[9px] font-mono text-white/20">
                Tous les prospects depuis la vitrine — scroll infini
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Toggle view */}
              <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
                <button
                  onClick={() => setView('TABLE')}
                  className={`p-2 rounded-lg transition-all ${view === 'TABLE' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white'}`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setView('KANBAN')}
                  className={`p-2 rounded-lg transition-all ${view === 'KANBAN' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white'}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => loadProspects(true)}
                className="p-2 rounded-xl border border-white/10 text-white/30 hover:text-[#39FF14] hover:border-[#39FF14]/20 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-widest hover:border-white/20 hover:text-white transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                EXPORT_CSV
              </button>
            </div>
          </div>

          {/* ── Filtres ─────────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher nom, email, contact..."
                className="bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#39FF14]/30 transition-all w-64"
              />
            </div>

            {/* Filtre plan */}
            <select
              value={filterPackage}
              onChange={e => setFilterPackage(e.target.value)}
              className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-[9px] font-black uppercase text-white/60 focus:outline-none focus:border-[#39FF14]/30 transition-all"
            >
              {PACKAGE_TYPES.map(p => (
                <option key={p} value={p}>{p === 'ALL' ? 'TOUS LES PLANS' : p}</option>
              ))}
            </select>

            {/* Filtre statut */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-[9px] font-black uppercase text-white/60 focus:outline-none focus:border-[#39FF14]/30 transition-all"
            >
              {PROSPECT_STATUTS.map(s => (
                <option key={s} value={s}>{s === 'ALL' ? 'TOUS LES STATUTS' : s}</option>
              ))}
            </select>

            {/* Filtre période */}
            <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/10 rounded-xl">
              {PERIODS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setFilterPeriod(p.value)}
                  className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                    filterPeriod === p.value
                      ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20'
                      : 'text-white/30 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Erreur ──────────────────────────────────────────────────── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-xs font-mono text-red-400">{error}</span>
                <button onClick={() => setError(null)} className="ml-auto">
                  <X className="w-4 h-4 text-red-400/50 hover:text-red-400" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Contenu principal ────────────────────────────────────────── */}
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-6 h-6 text-[#39FF14] animate-spin" />
            </div>
          ) : prospects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/10 rounded-3xl gap-4">
              <Users className="w-8 h-8 text-white/10" />
              <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                Aucun prospect trouvé
              </p>
            </div>
          ) : (
            <>
              {/* Placeholder — TABLE sera Étape 3 */}
              <div className="text-[9px] font-mono text-white/20 text-center py-8">
                {prospects.length} prospects chargés — TABLE et KANBAN arrivent à l'étape suivante
              </div>

              {/* Sentinel scroll infini */}
              <div ref={sentinelRef} className="h-4" />
              {loadingMore && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 text-[#39FF14] animate-spin" />
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </DoubleRibbonIntelligent>
  )
}
