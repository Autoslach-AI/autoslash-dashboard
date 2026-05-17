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
  const [savingAction, setSavingAction]     = useState(false)
  const [panelForm, setPanelForm]           = useState({
    prospect_status:     '',
    rappel_at:           '',
    internal_notes:      '',
    verbatim:            '',
    next_action:         '',
    valeur_estimee_fcfa: '',
    source_contact:      ''
  })
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null)

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

  useEffect(() => {
    if (selected) {
      setPanelForm({
        prospect_status:     selected.prospect_status     ?? 'NEW',
        rappel_at:           selected.rappel_at
                               ? new Date(selected.rappel_at).toISOString().slice(0, 16)
                               : '',
        internal_notes:      selected.internal_notes      ?? '',
        verbatim:            selected.verbatim             ?? '',
        next_action:         selected.next_action          ?? '',
        valeur_estimee_fcfa: selected.valeur_estimee_fcfa?.toString() ?? '',
        source_contact:      selected.source_contact       ?? ''
      })
    }
  }, [selected])

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

  const handleSavePanel = async (fields: Partial<typeof panelForm>) => {
    if (!selected) return
    setSavingAction(true)
    try {
      const payload: any = { enterprise_id: selected.enterprise_id }
      if (fields.prospect_status !== undefined)     payload.prospect_status     = fields.prospect_status
      if (fields.rappel_at !== undefined)           payload.rappel_at           = fields.rappel_at || null
      if (fields.internal_notes !== undefined)      payload.internal_notes      = fields.internal_notes
      if (fields.verbatim !== undefined)            payload.verbatim            = fields.verbatim
      if (fields.next_action !== undefined)         payload.next_action         = fields.next_action
      if (fields.source_contact !== undefined)      payload.source_contact      = fields.source_contact
      if (fields.valeur_estimee_fcfa !== undefined) payload.valeur_estimee_fcfa = parseInt(fields.valeur_estimee_fcfa) || 0

      const res = await fetch('/api/admin/prospects', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      })
      const { data, error: saveError } = await res.json()
      if (saveError) throw new Error(saveError)

      setProspects(prev => prev.map(p =>
        p.enterprise_id === selected.enterprise_id ? { ...p, ...data } : p
      ))
      setSelected(prev => prev ? { ...prev, ...data } : null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingAction(false)
    }
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
          <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/5 border border-white/10 rounded-xl">
                  <Users className="w-5 h-5 text-[#39FF14]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">PIPELINE_PROSPECTS</h1>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">
                    {total} ENTITÉS DÉTECTÉES — SYNC_OFF_CHAIN
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => loadProspects(true)}
                  className="p-2 rounded-xl border border-white/10 text-white/30 hover:text-[#39FF14] hover:border-[#39FF14]/20 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-white/60 text-[11px] font-medium hover:bg-white/5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  EXPORT_CSV
                </button>
              </div>
            </div>

            {/* Filters Row - Restoring Logic */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="RECHERCHER NOM, CONTACT, EMAIL..."
                    className="bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-[10px] font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#39FF14]/30 transition-all w-64"
                  />
                </div>

                {/* Filtre plan */}
                <div className="relative group">
                  <select
                    value={filterPackage}
                    onChange={e => setFilterPackage(e.target.value)}
                    className="appearance-none bg-white/[0.03] border border-white/10 rounded-xl pl-4 pr-10 py-2 text-[9px] font-black uppercase text-white/60 focus:outline-none focus:border-[#39FF14]/30 transition-all"
                  >
                    {PACKAGE_TYPES.map(p => (
                      <option key={p} value={p}>{p === 'ALL' ? 'TOUS LES PLANS' : p}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none" />
                </div>

                {/* Filtre statut */}
                <div className="relative group">
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="appearance-none bg-white/[0.03] border border-white/10 rounded-xl pl-4 pr-10 py-2 text-[9px] font-black uppercase text-white/60 focus:outline-none focus:border-[#39FF14]/30 transition-all"
                  >
                    {PROSPECT_STATUTS.map(s => (
                      <option key={s} value={s}>{s === 'ALL' ? 'TOUS LES STATUTS' : s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none" />
                </div>

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

              <div className="flex items-center gap-3">
                {/* View Toggles */}
                <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
                  <button onClick={() => setView('TABLE')} className={`p-2 rounded-lg transition-all ${view === 'TABLE' ? 'bg-[#39FF14]/10 text-[#39FF14]' : 'text-white/30 hover:text-white'}`}>
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setView('KANBAN')} className={`p-2 rounded-lg transition-all ${view === 'KANBAN' ? 'bg-[#39FF14]/10 text-[#39FF14]' : 'text-white/30 hover:text-white'}`}>
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
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
              {view === 'TABLE' && (
                <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0B]">
                  <table className="w-full text-left border-collapse table-auto">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.01]">
                        <th className="px-4 py-4 w-10">
                          <input type="checkbox" className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-[#39FF14] focus:ring-0 cursor-pointer" />
                        </th>
                        {[
                          { label: 'NOM / CONTACT',  width: '220px' },
                          { label: 'PLAN',           width: '140px' },
                          { label: 'STATUT',         width: '140px' },
                          { label: 'RÉGION',         width: '140px' },
                          { label: 'CHALEUR',        width: '80px'  },
                          { label: 'BUDGET FCFA',    width: '140px' },
                          { label: 'RAPPEL',         width: '140px' },
                          { label: 'NEXT_ACTION',    width: '160px' },
                          { label: 'DATE',           width: '100px' }
                        ].map((col) => (
                          <th key={col.label} style={{ width: col.width }} className="px-4 py-3 text-[9px] font-black text-white/30 tracking-[0.2em] uppercase">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                      {prospects.map((p, idx) => {
                        const heat      = getHeatBadge(p.prospect_score)
                        const rappelDue = p.rappel_at && new Date(p.rappel_at) <= new Date()
                        return (
                          <motion.tr
                            key={p.enterprise_id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(idx * 0.01, 0.4) }}
                            onClick={() => setSelected(p)}
                            className={`group hover:bg-white/[0.02] cursor-pointer transition-colors ${rappelDue ? 'bg-orange-500/5' : ''}`}
                          >
                            {/* Checkbox */}
                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                              <input type="checkbox" className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-[#39FF14] focus:ring-0 cursor-pointer" />
                            </td>

                            {/* Nom / Contact */}
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                  <span className="text-[10px] font-black text-white/40">{p.name[0].toUpperCase()}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-black text-white uppercase tracking-wider truncate max-w-[150px]">{p.name}</span>
                                  {p.contact_name && (
                                    <span className="text-[9px] font-mono text-white/40 truncate max-w-[150px]">{p.contact_name}</span>
                                  )}
                                  {p.email && (
                                    <span className="text-[8px] font-mono text-white/20 truncate max-w-[150px]">{p.email}</span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Plan */}
                            <td className="px-4 py-4">
                              <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border ${
                                PACKAGE_COLORS[p.package_type ?? ''] ?? 'bg-white/5 text-white/40 border-white/10'
                              }`}>
                                {p.package_type ?? '—'}
                              </span>
                            </td>

                            {/* Statut — dropdown inline */}
                            <td className="px-4 py-4 relative" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setEditingStatusId(
                                  editingStatusId === p.enterprise_id ? null : p.enterprise_id
                                )}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border transition-all hover:opacity-80 ${
                                  STATUS_COLORS[p.prospect_status ?? 'NEW'] ?? 'bg-white/5 text-white/40 border-white/10'
                                }`}
                              >
                                {p.prospect_status ?? 'NEW'}
                                <ChevronDown className="w-2.5 h-2.5 shrink-0" />
                              </button>

                              <AnimatePresence>
                                {editingStatusId === p.enterprise_id && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="absolute top-full left-0 mt-1 z-[50] bg-[#111111] border border-white/10 rounded-xl overflow-hidden shadow-2xl min-w-[160px]"
                                  >
                                    {['NEW', 'EN_CONTACT', 'NÉGOCIATION', 'EN_ATTENTE', 'RAPPELER', 'CONVERTI', 'PERDU', 'ANNULÉ'].map(s => (
                                      <button
                                        key={s}
                                        onClick={async () => {
                                          setEditingStatusId(null)
                                          try {
                                            const res = await fetch('/api/admin/prospects', {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                enterprise_id:   p.enterprise_id,
                                                prospect_status: s
                                              })
                                            })
                                            const { data, error: saveError } = await res.json()
                                            if (saveError) throw new Error(saveError)
                                            setProspects(prev => prev.map(pr =>
                                              pr.enterprise_id === p.enterprise_id
                                                ? { ...pr, prospect_status: s }
                                                : pr
                                            ))
                                            if (selected?.enterprise_id === p.enterprise_id) {
                                              setSelected(prev => prev ? { ...prev, prospect_status: s } : null)
                                            }
                                          } catch (err: any) {
                                            setError(err.message)
                                          }
                                        }}
                                        className={`w-full flex items-center px-4 py-2.5 text-[8px] font-black uppercase tracking-widest transition-all hover:bg-white/5 ${
                                          p.prospect_status === s ? STATUS_COLORS[s] : 'text-white/40'
                                        }`}
                                      >
                                        {p.prospect_status === s && (
                                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 shrink-0" />
                                        )}
                                        {s}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </td>

                            {/* Région */}
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="text-[9px] font-mono text-white/60">{p.region ?? '—'}</span>
                                {p.sector && (
                                  <span className="text-[8px] font-mono text-white/20">{p.sector}</span>
                                )}
                              </div>
                            </td>

                            {/* Chaleur */}
                            <td className="px-4 py-4">
                              <span className={`text-[8px] font-black uppercase ${heat.color}`}>
                                {heat.label}
                              </span>
                            </td>

                            {/* Budget */}
                            <td className="px-4 py-4">
                              <span className="text-[11px] font-black font-mono text-[#39FF14]/90">
                                {p.valeur_estimee_fcfa ? `${p.valeur_estimee_fcfa.toLocaleString()} F` : '—'}
                              </span>
                            </td>

                            {/* Rappel */}
                            <td className="px-4 py-4">
                              {p.rappel_at ? (
                                <span className={`text-[8px] font-mono ${rappelDue ? 'text-orange-400 font-black' : 'text-white/40'}`}>
                                  {new Date(p.rappel_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                  {rappelDue && ' ⚡'}
                                </span>
                              ) : (
                                <span className="text-[8px] font-mono text-white/20">—</span>
                              )}
                            </td>

                            {/* Next action */}
                            <td className="px-4 py-4">
                              <span className="text-[8px] font-mono text-white/40 truncate block max-w-[140px]">
                                {p.next_action ?? '—'}
                              </span>
                            </td>

                            {/* Date */}
                            <td className="px-4 py-4">
                              <span className="text-[8px] font-mono text-white/30">
                                {new Date(p.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                              </span>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}


              {view === 'KANBAN' && (
                <div className="text-[9px] font-mono text-white/20 text-center py-8">
                  KANBAN — Étape suivante
                </div>
              )}

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

      {/* ── Side Panel ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-[520px] bg-[#0A0A0A] border-l border-white/10 z-[101] flex flex-col font-mono overflow-hidden"
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-white/5">
                <div className="space-y-1">
                  <h2 className="text-sm font-black uppercase tracking-widest text-white">
                    {selected.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className={`text-[7px] font-black px-2 py-0.5 rounded border uppercase ${
                      PACKAGE_COLORS[selected.package_type ?? ''] ?? 'bg-white/5 text-white/30 border-white/10'
                    }`}>
                      {selected.package_type ?? '—'}
                    </span>
                    <span className={`text-[7px] font-black px-2 py-0.5 rounded border uppercase ${
                      STATUS_COLORS[selected.prospect_status ?? 'NEW'] ?? 'bg-white/5 text-white/30 border-white/10'
                    }`}>
                      {selected.prospect_status ?? 'NEW'}
                    </span>
                    <span className={`text-[7px] font-black uppercase ${getHeatBadge(selected.prospect_score).color}`}>
                      {getHeatBadge(selected.prospect_score).label}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-xl border border-white/10 text-white/30 hover:text-white hover:border-white/20 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Panel Content — scrollable */}
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 no-scrollbar">

                {/* Infos formulaire */}
                <div className="space-y-3">
                  <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30">INFOS_FORMULAIRE</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'CONTACT',   value: selected.contact_name },
                      { label: 'EMAIL',     value: selected.email        },
                      { label: 'TÉLÉPHONE', value: selected.phone        },
                      { label: 'RÉGION',    value: selected.region       },
                      { label: 'SECTEUR',   value: selected.sector       },
                      { label: 'DATE',      value: new Date(selected.created_at).toLocaleDateString('fr-FR') }
                    ].map(({ label, value }) => (
                      <div key={label} className="space-y-1">
                        <div className="text-[7px] font-black uppercase tracking-widest text-white/20">{label}</div>
                        <div className="text-[10px] font-mono text-white/70">{value ?? '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Message complet */}
                {selected.message && (
                  <div className="space-y-2">
                    <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30">MESSAGE_ORIGINAL</h3>
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <p className="text-[10px] font-mono text-white/60 leading-relaxed whitespace-pre-wrap">
                        {selected.message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Template info */}
                {selected.assets_urls?.meta?.slogan && (
                  <div className="space-y-2">
                    <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30">TEMPLATE_DEMANDÉ</h3>
                    <div className="text-[10px] font-mono text-white/60">
                      {selected.template_id ?? '—'} · {selected.monthly_cost ? `${selected.monthly_cost.toLocaleString()} FCFA/mois` : '—'}
                    </div>
                  </div>
                )}

                {/* Actions statut rapides */}
                <div className="space-y-3">
                  <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30">CHANGER_STATUT</h3>
                  <div className="flex flex-wrap gap-2">
                    {['NEW', 'EN_CONTACT', 'NÉGOCIATION', 'EN_ATTENTE', 'RAPPELER', 'CONVERTI', 'PERDU', 'ANNULÉ'].map(s => (
                      <button
                        key={s}
                        onClick={() => {
                          setPanelForm(f => ({ ...f, prospect_status: s }))
                          handleSavePanel({ prospect_status: s })
                        }}
                        disabled={savingAction}
                        className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                          (panelForm.prospect_status || selected.prospect_status) === s
                            ? STATUS_COLORS[s]
                            : 'border-white/5 text-white/20 hover:border-white/20 hover:text-white/60'
                        } disabled:opacity-50`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date rappel */}
                <div className="space-y-2">
                  <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30">DATE_RAPPEL</h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="datetime-local"
                      value={panelForm.rappel_at}
                      onChange={e => setPanelForm(f => ({ ...f, rappel_at: e.target.value }))}
                      className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#39FF14]/30 transition-all"
                    />
                    <button
                      onClick={() => handleSavePanel({ rappel_at: panelForm.rappel_at })}
                      disabled={savingAction}
                      className="px-4 py-2.5 rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/20 text-[#39FF14] text-[8px] font-black uppercase tracking-widest hover:bg-[#39FF14]/20 transition-all disabled:opacity-50"
                    >
                      {savingAction ? '...' : 'OK'}
                    </button>
                  </div>
                </div>

                {/* Valeur estimée */}
                <div className="space-y-2">
                  <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30">VALEUR_ESTIMÉE_FCFA</h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={panelForm.valeur_estimee_fcfa}
                      onChange={e => setPanelForm(f => ({ ...f, valeur_estimee_fcfa: e.target.value }))}
                      placeholder="0"
                      className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#39FF14]/30 transition-all"
                    />
                    <button
                      onClick={() => handleSavePanel({ valeur_estimee_fcfa: panelForm.valeur_estimee_fcfa })}
                      disabled={savingAction}
                      className="px-4 py-2.5 rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/20 text-[#39FF14] text-[8px] font-black uppercase tracking-widest hover:bg-[#39FF14]/20 transition-all disabled:opacity-50"
                    >
                      {savingAction ? '...' : 'OK'}
                    </button>
                  </div>
                </div>

                {/* Next action */}
                <div className="space-y-2">
                  <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30">NEXT_ACTION</h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={panelForm.next_action}
                      onChange={e => setPanelForm(f => ({ ...f, next_action: e.target.value }))}
                      placeholder="Ex: Envoyer devis, Rappeler lundi..."
                      className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#39FF14]/30 transition-all"
                    />
                    <button
                      onClick={() => handleSavePanel({ next_action: panelForm.next_action })}
                      disabled={savingAction}
                      className="px-4 py-2.5 rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/20 text-[#39FF14] text-[8px] font-black uppercase tracking-widest hover:bg-[#39FF14]/20 transition-all disabled:opacity-50"
                    >
                      {savingAction ? '...' : 'OK'}
                    </button>
                  </div>
                </div>

                {/* Source contact */}
                <div className="space-y-2">
                  <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30">SOURCE_CONTACT</h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={panelForm.source_contact}
                      onChange={e => setPanelForm(f => ({ ...f, source_contact: e.target.value }))}
                      placeholder="Ex: Formulaire vitrine, LinkedIn, Recommandation..."
                      className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#39FF14]/30 transition-all"
                    />
                    <button
                      onClick={() => handleSavePanel({ source_contact: panelForm.source_contact })}
                      disabled={savingAction}
                      className="px-4 py-2.5 rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/20 text-[#39FF14] text-[8px] font-black uppercase tracking-widest hover:bg-[#39FF14]/20 transition-all disabled:opacity-50"
                    >
                      {savingAction ? '...' : 'OK'}
                    </button>
                  </div>
                </div>

                {/* Verbatim prospect */}
                <div className="space-y-2">
                  <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30">VERBATIM_PROSPECT</h3>
                  <textarea
                    value={panelForm.verbatim}
                    onChange={e => setPanelForm(f => ({ ...f, verbatim: e.target.value }))}
                    placeholder="Ce que le prospect a dit exactement..."
                    rows={3}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-[#39FF14]/30 transition-all resize-none"
                  />
                  <button
                    onClick={() => handleSavePanel({ verbatim: panelForm.verbatim })}
                    disabled={savingAction}
                    className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 text-[8px] font-black uppercase tracking-widest hover:border-white/20 hover:text-white transition-all disabled:opacity-50"
                  >
                    {savingAction ? 'SAVING...' : 'SAVE_VERBATIM'}
                  </button>
                </div>

                {/* Note interne */}
                <div className="space-y-2">
                  <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30">NOTE_INTERNE_AMADOU</h3>
                  <textarea
                    value={panelForm.internal_notes}
                    onChange={e => setPanelForm(f => ({ ...f, internal_notes: e.target.value }))}
                    placeholder="Mes observations personnelles sur ce prospect..."
                    rows={4}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-[#39FF14]/30 transition-all resize-none"
                  />
                  <button
                    onClick={() => handleSavePanel({ internal_notes: panelForm.internal_notes })}
                    disabled={savingAction}
                    className="w-full py-2.5 rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/20 text-[#39FF14] text-[8px] font-black uppercase tracking-widest hover:bg-[#39FF14]/20 transition-all disabled:opacity-50"
                  >
                    {savingAction ? 'SAVING...' : 'SAVE_NOTE_INTERNE'}
                  </button>
                </div>

              </div>

              {/* Panel Footer */}
              <div className="px-8 py-4 border-t border-white/5">
                <p className="text-[7px] font-mono text-white/20 text-center uppercase tracking-widest">
                  CONVERTI ≠ ACTIF — Activation depuis Dashboard 2 → Profile
                </p>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DoubleRibbonIntelligent>
  )
}
