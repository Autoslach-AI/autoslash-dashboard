"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Settings, Loader2, AlertTriangle,
  RotateCcw, ChevronLeft, Zap, Sparkles, Paperclip, ArrowRight
} from 'lucide-react';
import { useUser } from '@/lib/contexts/user-context';
import DoubleRibbonIntelligent, { NavItem } from '@/components/DoubleRibbonIntelligent';
import { LayoutDashboard, Users, Brain } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Constantes ──────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "Analyse le pipeline prospects de cette semaine",
  "Quels sont les patterns détectés sur la vitrine ?",
  "Donne-moi un rapport sur les prospects chauds",
  "Que recommandes-tu pour améliorer le taux de conversion ?",
];

// ─── Composant principal ─────────────────────────────────────────────────────

export default function AxonChatPage() {
  const router            = useRouter();
  const { user, profile } = useUser();

  // ── État ──────────────────────────────────────────────────────────────────
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState('');
  const [sending,   setSending]   = useState(false);
  const [agent,     setAgent]     = useState<AgentConfig | null>(null);
  const [loadingAgent, setLoadingAgent] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);

  // ── Charger config agent ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch('/api/admin/hq/agents');
        const json = await res.json();
        // Filtrer dynamiquement sur 'axon'
        const found = (json.data ?? []).find((a: AgentConfig) => a.agent_id === 'axon');
        setAgent(found ?? null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingAgent(false);
      }
    };
    load();
  }, []);

  // ── Scroll au dernier message ─────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Auto-resize textarea ──────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ── Envoyer message ───────────────────────────────────────────────────────
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || sending) return;

    const userMsg: Message = {
      id:        crypto.randomUUID(),
      role:      'user',
      content:   content.trim(),
      timestamp: new Date()
    };

    const loadingMsg: Message = {
      id:        crypto.randomUUID(),
      role:      'assistant',
      content:   '',
      timestamp: new Date(),
      loading:   true
    };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput('');
    setSending(true);
    setError(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const history = messages
        .filter(m => !m.loading)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/admin/hq/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          agent_id: 'axon',
          messages: [...history, { role: 'user', content: content.trim() }]
        })
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setMessages(prev => prev.map(m =>
        m.loading ? { ...m, content: json.reply, loading: false } : m
      ));
    } catch (err: any) {
      setMessages(prev => prev.filter(m => !m.loading));
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setSending(false);
      setTimeout(() => textareaRef.current?.focus(), 10);
    }
  }, [messages, sending]);

  // ── Nav ───────────────────────────────────────────────────────────────────
  const primaryItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, onClick: () => router.push('/admin') },
    { id: 'prospects', label: 'Prospects', icon: Users,           path:    '/admin/prospects' },
    { id: 'hq-agents', label: 'Agents HQ', icon: Brain,           path:    '/admin/hq/agents' }
  ];

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
      <div className="flex flex-col h-screen bg-[#0A0A0A] font-mono overflow-hidden">

        {/* ── HEADER ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#0A0A0A] shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/hq/agents')}
              className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-[11px] font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Agents
            </button>

            <div className="w-px h-4 bg-white/10" />

            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[14px] font-bold tracking-tight text-[#39FF14]">
                  AXON
                </span>
                <span className="text-[10px] text-white/30">
                  Analyste stratégique — contexte vitrine et pipeline
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
              <span className={`w-1.5 h-1.5 rounded-full ${
                loadingAgent
                  ? 'bg-white/30 animate-pulse'
                  : agent?.is_active
                    ? 'bg-[#39FF14] animate-pulse'
                    : 'bg-orange-400 animate-pulse'
              }`} />
              <span className={`text-[9px] font-medium uppercase ${
                !loadingAgent && (!agent || !agent.model) ? 'text-orange-400' : 'text-white/50'
              }`}>
                {loadingAgent 
                  ? "..." 
                  : (!agent || !agent.model) 
                    ? "Non configuré" 
                    : agent.model}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-white/30 text-[11px] hover:text-white hover:border-white/20 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Réinitialiser conversation
              </button>
            )}
            <button
              onClick={() => router.push('/admin/hq/agents/axon/settings')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-white/30 text-[11px] hover:text-white hover:border-white/20 transition-all cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              Paramètres
            </button>
          </div>
        </div>

        {/* ── ERREUR ───────────────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-6 mt-4 flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl shrink-0"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-[11px] text-red-400 flex-1 truncate">{error}</span>
              <button onClick={() => setError(null)} className="text-red-400/50 hover:text-red-400 text-[11px]">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ZONE MESSAGES ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* État vide */}
          {messages.length === 0 && !loadingAgent && (
            <div className="flex flex-col items-center justify-center h-full space-y-8 max-w-[600px] mx-auto">
              <div className="space-y-2 text-center select-none">
                <h2 className="text-[22px] font-bold tracking-tight text-[#39FF14]">
                  AXON
                </h2>
                <p className="text-[13px] text-white/40">
                  Analyste stratégique — contexte vitrine et pipeline
                </p>
              </div>

              <div className="w-full space-y-3">
                <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest text-center select-none">
                  Suggestions
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="px-4 py-3 text-left rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all text-[12px] text-white/50 hover:text-white/80 active:scale-[0.98] cursor-pointer"
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
                  <div className="shrink-0 w-7 h-7 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center mt-0.5 select-none">
                    <span className="text-[10px] font-bold text-[#39FF14]">
                      A
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-medium text-white/25 ml-1 select-none">
                      AXON
                    </span>
                    <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#141414] border border-white/[0.06]">
                      {msg.loading ? (
                        <div className="flex items-center gap-1.5 py-1">
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
                        <p className="text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap font-sans">
                          {msg.content}
                        </p>
                      )}
                    </div>
                    <span className="text-[9px] text-white/15 ml-1 select-none">
                      {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}

              {msg.role === 'user' && (
                <div className="flex gap-3 max-w-[75%]">
                  <div className="space-y-1 items-end flex flex-col">
                    <span className="text-[10px] font-medium text-white/25 mr-1 select-none">
                      Amadou
                    </span>
                    <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-white/[0.06] border border-white/10">
                      <p className="text-[13px] text-white/90 leading-relaxed whitespace-pre-wrap font-sans">
                        {msg.content}
                      </p>
                    </div>
                    <span className="text-[9px] text-white/15 mr-1 select-none">
                      {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="shrink-0 w-7 h-7 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center mt-0.5 select-none">
                    <span className="text-[10px] font-bold text-white/40">A</span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* ── INPUT ────────────────────────────────────────────────────── */}
        <div className="shrink-0 pb-12 pt-2 flex flex-col items-center justify-end px-6 bg-[#0A0A0A]">
          
          <div className="w-full max-w-[550px] bg-[#141414] border border-white/[0.06] rounded-[20px] p-4 flex flex-col gap-3 shadow-2xl relative">
            
            {/* Input textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="What can I do for you?"
              disabled={sending || loadingAgent}
              className="w-full bg-transparent resize-none text-[13px] text-white placeholder:text-white/30 focus:outline-none leading-relaxed max-h-[140px] font-sans pr-8 disabled:opacity-50"
              style={{ height: 'auto' }}
            />

            {/* Action bar */}
            <div className="flex items-center justify-between mt-1 relative">
              
              {/* Left Actions */}
              <div className="flex items-center gap-2">
                
                {/* Model Selector Pill (dynamic from DB) */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] font-sans text-white/70 select-none">
                  <Sparkles className={`w-3.5 h-3.5 ${!loadingAgent && (!agent || !agent.model) ? 'text-orange-400' : 'text-[#39FF14]'}`} />
                  <span className={`font-semibold tracking-tight text-[12px] ${
                    !loadingAgent && (!agent || !agent.model) ? 'text-orange-400' : 'text-white/80'
                  }`}>
                    {loadingAgent 
                      ? "..." 
                      : (!agent || !agent.model) 
                        ? "Non configuré" 
                        : agent.model}
                  </span>
                </div>

                {/* Vertical Separator */}
                <div className="w-[1px] h-4 bg-white/10 mx-1" />

                {/* Attachment Button */}
                <button className="flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer">
                  <Paperclip className="w-3.5 h-3.5" />
                </button>

              </div>

              {/* Right Action: Send Button */}
              <button 
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || sending || loadingAgent}
                className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all cursor-pointer ${
                  input.trim() && !sending && !loadingAgent
                    ? 'bg-white/[0.12] border-white/20 text-white hover:bg-white/[0.2]'
                    : 'bg-white/[0.04] border-white/[0.06] text-white/20 cursor-not-allowed'
                }`}
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>

            </div>

          </div>
          
        </div>

      </div>
    </DoubleRibbonIntelligent>
  );
}
