"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Settings, Loader2, AlertTriangle,
  RotateCcw, ChevronLeft, Zap, Brain, Users,
  LayoutDashboard
} from 'lucide-react';
import { useUser } from '@/lib/contexts/user-context';
import DoubleRibbonIntelligent, { NavItem } from '@/components/DoubleRibbonIntelligent';

interface Message {
  id:        string;
  role:      'user' | 'assistant';
  content:   string;
  timestamp: Date;
  loading?:  boolean;
}

interface AgentConfig {
  agent_id:               string;
  provider:               string | null;
  model:                  string | null;
  max_tokens_per_session: number | null;
  max_requests_per_day:   number | null;
  system_prompt:          string | null;
  is_active:              boolean;
}

const SUGGESTIONS = [
  "Analyse le pipeline prospects de cette semaine",
  "Quels sont les patterns détectés sur la vitrine ?",
  "Donne-moi un rapport sur les prospects chauds",
  "Que recommandes-tu pour améliorer le taux de conversion ?",
]

export default function AgentPage() {
  const params            = useParams()
  const router            = useRouter()
  const { user, profile } = useUser()
  const agentId           = params?.agent_id as string

  const [messages,     setMessages]     = useState<Message[]>([])
  const [input,        setInput]        = useState('')
  const [sending,      setSending]      = useState(false)
  const [agent,        setAgent]        = useState<AgentConfig | null>(null)
  const [loadingAgent, setLoadingAgent] = useState(true)
  const [error,        setError]        = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)

  // Rediriger BUSINESS et COMMERCIAL vers settings
  useEffect(() => {
    if (agentId && agentId !== 'axon') {
      router.replace(`/admin/hq/agents/axon/settings?tab=${agentId}`)
    }
  }, [agentId, router])

  // Charger config agent
  useEffect(() => {
    if (agentId !== 'axon') return
    const load = async () => {
      try {
        const res  = await fetch('/api/admin/hq/agents')
        const json = await res.json()
        const found = (json.data ?? []).find(
          (a: AgentConfig) => a.agent_id === 'axon'
        )
        setAgent(found ?? null)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoadingAgent(false)
      }
    }
    load()
  }, [agentId])

  // Scroll au dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  const resizeTextarea = () => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }

  // Envoyer message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || sending) return

    const userMsg: Message = {
      id:        crypto.randomUUID(),
      role:      'user',
      content:   content.trim(),
      timestamp: new Date()
    }
    const loadingMsg: Message = {
      id:        crypto.randomUUID(),
      role:      'assistant',
      content:   '',
      timestamp: new Date(),
      loading:   true
    }

    setMessages(prev => [...prev, userMsg, loadingMsg])
    setInput('')
    setSending(true)
    setError(null)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const history = messages
        .filter(m => !m.loading)
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/admin/hq/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          agent_id: 'axon',
          messages: [...history, { role: 'user', content: content.trim() }]
        })
      })

      const json = await res.json()
      if (json.error) throw new Error(json.error)

      setMessages(prev => prev.map(m =>
        m.loading
          ? { ...m, content: json.reply, loading: false }
          : m
      ))
    } catch (err: any) {
      setMessages(prev => prev.filter(m => !m.loading))
      setError(err.message)
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }, [messages, sending])

  const primaryItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, onClick: () => router.push('/admin') },
    { id: 'prospects', label: 'Prospects', icon: Users,           path:    '/admin/prospects' },
    { id: 'hq-agents', label: 'Agents HQ', icon: Brain,           path:    '/admin/hq/agents' }
  ]

  // Bloquer le rendu si pas AXON
  if (agentId !== 'axon') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#39FF14] animate-spin" />
      </div>
    )
  }

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
      <div className="flex flex-col h-screen bg-[#0A0A0A] font-mono overflow-hidden">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/hq/agents')}
              className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-[11px] font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Agents
            </button>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[14px] font-bold tracking-tight text-[#39FF14]">
                AXON
              </span>
              <span className="text-[10px] text-white/30">
                Analyste stratégique — vitrine & pipeline
              </span>
            </div>
            {agent && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  agent.is_active && agent.system_prompt
                    ? 'bg-[#39FF14] animate-pulse'
                    : 'bg-orange-400 animate-pulse'
                }`} />
                <span className="text-[9px] font-medium text-white/50">
                  {agent.model ?? 'gemini-2.0-flash'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-white/30 text-[11px] hover:text-white hover:border-white/20 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Réinitialiser
              </button>
            )}
            <button
              onClick={() => router.push('/admin/hq/agents/axon/settings')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-white/30 text-[11px] hover:text-white hover:border-white/20 transition-all"
            >
              <Settings className="w-3.5 h-3.5" />
              Paramètres
            </button>
          </div>
        </div>

        {/* ── ERREUR ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-6 mt-4 flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl shrink-0"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-[11px] font-mono text-red-400 flex-1">{error}</span>
              <button onClick={() => setError(null)} className="text-red-400/50 hover:text-red-400">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ZONE MESSAGES ── */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* État vide */}
          {messages.length === 0 && !loadingAgent && (
            <div className="flex flex-col items-center justify-center h-full space-y-8 max-w-[600px] mx-auto">
              <div className="space-y-2 text-center">
                <h2 className="text-[22px] font-bold tracking-tight text-[#39FF14]">
                  AXON
                </h2>
                <p className="text-[13px] text-white/40">
                  Pose-moi une question sur ta plateforme
                </p>
              </div>
              <div className="w-full space-y-2">
                <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest text-center">
                  Suggestions
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="px-4 py-3 text-left rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15 transition-all text-[12px] text-white/50 hover:text-white/80"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex gap-3 max-w-[75%]">
                  <div className="shrink-0 w-7 h-7 rounded-lg border border-[#39FF14]/20 bg-[#39FF14]/5 flex items-center justify-center mt-0.5">
                    <span className="text-[10px] font-bold text-[#39FF14]">A</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-medium text-white/25 ml-1">AXON</span>
                    <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#141414] border border-white/[0.06]">
                      {msg.loading ? (
                        <div className="flex items-center gap-1.5">
                          {[0, 1, 2].map(i => (
                            <motion.span
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-white/30"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      )}
                    </div>
                    <span className="text-[9px] text-white/15 ml-1">
                      {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}

              {msg.role === 'user' && (
                <div className="flex gap-3 max-w-[75%]">
                  <div className="space-y-1 items-end flex flex-col">
                    <span className="text-[10px] font-medium text-white/25 mr-1">Amadou</span>
                    <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-white/[0.06] border border-white/10">
                      <p className="text-[13px] text-white/90 leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                    <span className="text-[9px] text-white/15 mr-1">
                      {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="shrink-0 w-7 h-7 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center mt-0.5">
                    <span className="text-[10px] font-bold text-white/40">Am</span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* ── INPUT ── */}
        <div className="shrink-0 px-6 py-4 border-t border-white/[0.06]">
          <div className="max-w-[800px] mx-auto">
            <div className="flex items-end gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-[#111111] focus-within:border-white/20 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => { setInput(e.target.value); resizeTextarea() }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(input)
                  }
                }}
                placeholder="Message AXON..."
                rows={1}
                disabled={sending || loadingAgent}
                className="flex-1 bg-transparent resize-none text-[13px] text-white placeholder:text-white/20 focus:outline-none leading-relaxed max-h-[200px] disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || sending || loadingAgent}
                className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {sending
                  ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                  : <Send className="w-4 h-4 text-white" />
                }
              </button>
            </div>
            <p className="text-[9px] text-white/15 text-center mt-2">
              Entrée pour envoyer · Maj+Entrée pour saut de ligne
            </p>
          </div>
        </div>

      </div>
    </DoubleRibbonIntelligent>
  )
}
