"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Zap, LayoutDashboard, Users, ArrowRight,
  Sparkles, Loader2, Trash2, AlertCircle, Settings, ArrowLeft,
  Pencil, Copy, RotateCw, Mic, PhoneOff
} from 'lucide-react';
import { useUser } from '@/lib/contexts/user-context';
import DoubleRibbonIntelligent, { NavItem } from '@/components/DoubleRibbonIntelligent';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id:        string;
  role:      'user' | 'assistant';
  content:   string;
  timestamp: Date;
  loading?:  boolean;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function HQAgentsPage() {
  const router            = useRouter();
  const { user, profile } = useUser();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Agent dynamic state
  const [agent, setAgent] = useState<any>(null);
  const [loadingAgent, setLoadingAgent] = useState(true);

  // Voice session mock overlay
  const [voiceCallActive, setVoiceCallActive] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch agent details dynamically
  useEffect(() => {
    async function fetchAgent() {
      try {
        const res = await fetch('/api/admin/hq/agents');
        if (res.ok) {
          const json = await res.json();
          const axonAgent = (json.data ?? []).find((a: any) => a.agent_id === 'axon');
          setAgent(axonAgent || null);
        }
      } catch (err) {
        console.error("Error fetching agent:", err);
      } finally {
        setLoadingAgent(false);
      }
    }
    fetchAgent();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize input textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
    }
  };

  // Send message
  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date()
    };

    const loadingMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: 'axon',
          messages: [...history, { role: 'user', content: trimmed }]
        })
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setMessages(prev => prev.map(m =>
        m.loading ? { ...m, content: json.reply, loading: false } : m
      ));
    } catch (err: any) {
      setMessages(prev => prev.filter(m => !m.loading));
      setError(err.message || 'Une erreur est survenue lors de la communication.');
    } finally {
      setSending(false);
      setTimeout(() => textareaRef.current?.focus(), 10);
    }
  }, [input, sending, messages]);

  // Regenerate last response
  const regenerateResponse = useCallback(async () => {
    if (sending) return;
    
    // Find last user message
    const userMsgs = messages.filter(m => m.role === 'user');
    if (userMsgs.length === 0) return;

    const lastUserMsg = userMsgs[userMsgs.length - 1];

    // Get index of that user message
    const index = messages.findLastIndex(m => m.id === lastUserMsg.id);
    if (index === -1) return;

    // Slice up to (and including) that user message
    const historyUntilLastUser = messages.slice(0, index + 1);

    const loadingMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true
    };

    setMessages([...historyUntilLastUser, loadingMsg]);
    setSending(true);
    setError(null);

    try {
      const historyPayload = historyUntilLastUser
        .filter(m => m.id !== lastUserMsg.id)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/admin/hq/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: 'axon',
          messages: [...historyPayload, { role: 'user', content: lastUserMsg.content }]
        })
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setMessages(prev => prev.map(m =>
        m.loading ? { ...m, content: json.reply, loading: false } : m
      ));
    } catch (err: any) {
      setMessages(prev => prev.filter(m => !m.loading));
      setError(err.message || 'Une erreur est survenue lors de la communication.');
    } finally {
      setSending(false);
    }
  }, [messages, sending]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Clear conversation
  const clearConversation = () => {
    setMessages([]);
    setError(null);
  };

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
      <div className="h-screen bg-[#0A0A0A] flex flex-col justify-between font-mono overflow-hidden">
        
        {/* Header Top Bar */}
        <div className="w-full border-b border-white/10 bg-[#0F0F0F]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#39FF14]" />
              <span className="font-sans font-bold tracking-wider text-sm text-white uppercase">
                AXON <span className="text-[#39FF14]">ORACLE</span>
              </span>
            </div>
            
            {/* Model badge (read-only) */}
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
            {/* Paramètres Button */}
            <button 
              onClick={() => router.push('/admin/hq/agents/axon/settings')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Paramètres</span>
            </button>

            {/* Réinitialiser conversation Button */}
            <button 
              onClick={clearConversation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Réinitialiser</span>
            </button>

            {/* Retour Button */}
            <button 
              onClick={() => router.push('/admin')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tableau de bord</span>
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6 flex flex-col items-center">
          <div className="w-full max-w-[580px] space-y-6 mt-auto">
            
            {/* If no messages, render welcome message */}
            {messages.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="text-center space-y-3 max-w-[480px]">
                  <h3 className="text-lg font-sans font-medium text-white">Comment puis-je vous aider aujourd'hui ?</h3>
                  <p className="text-xs text-white/50 leading-relaxed font-sans">
                    Posez-moi une question sur votre pipeline, vos prospects, ou vos performances. Je suis là pour analyser et vous conseiller.
                  </p>
                </div>
              </div>
            ) : (
              /* Conversation list */
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex w-full group relative ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] flex flex-col relative ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    
                    {/* Sender Name */}
                    <span className="text-[10px] text-white/30 mb-1 px-1">
                      {msg.role === 'user' ? (profile?.full_name || 'Amadou') : 'AXON'}
                    </span>

                    {/* Hover Actions Bar (Claude Style) */}
                    {!msg.loading && (
                      <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 z-10 ${
                        msg.role === 'user' ? 'right-full mr-3' : 'left-full ml-3'
                      }`}>
                        {msg.role === 'user' ? (
                          <button
                            onClick={() => {
                              const idx = messages.findIndex(m => m.id === msg.id);
                              if (idx !== -1) {
                                setMessages(messages.slice(0, idx));
                              }
                              setInput(msg.content);
                              setTimeout(() => {
                                textareaRef.current?.focus();
                                if (textareaRef.current) {
                                  textareaRef.current.style.height = 'auto';
                                  textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
                                }
                              }, 10);
                            }}
                            title="Modifier"
                            className="p-1.5 rounded-lg bg-[#141414] border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(msg.content);
                              }}
                              title="Copier"
                              className="p-1.5 rounded-lg bg-[#141414] border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={regenerateResponse}
                              title="Régénérer"
                              className="p-1.5 rounded-lg bg-[#141414] border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed border ${
                      msg.role === 'user'
                        ? 'bg-white/[0.06] border-white/10 text-white/90 rounded-tr-sm'
                        : 'bg-[#141414] border-white/[0.06] text-white/80 rounded-tl-sm'
                    }`}>
                      {msg.loading ? (
                        <div className="flex items-center gap-1.5 py-1">
                          {[0, 1, 2].map(i => (
                            <motion.span
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-white/40"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-[9px] text-white/20 mt-1 px-1">
                      {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>

                  </div>
                </motion.div>
              ))
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Error Alert Overlay */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mx-auto max-w-[480px] w-full px-4 mb-2 shrink-0 animate-pulse"
            >
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[11px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate">{error}</span>
                <button onClick={() => setError(null)} className="text-red-400/50 hover:text-red-400 font-bold ml-1">✕</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Input Area: Centered, compact */}
        <div className="pb-16 pt-2 flex flex-col items-center justify-end px-4 shrink-0 relative">
          
          {/* Chat Input Card */}
          <div className="w-full max-w-[480px] bg-[#141414] border border-white/[0.06] rounded-[20px] p-4 flex flex-col gap-3 shadow-2xl relative">
            
            {/* Top: Actual interactive Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre message pour AXON..."
              disabled={sending}
              className="w-full bg-transparent resize-none text-[13px] text-white placeholder:text-white/30 focus:outline-none leading-relaxed max-h-[140px] font-sans pr-8 disabled:opacity-50"
              style={{ height: 'auto' }}
            />

            {/* Bottom: Action bar */}
            <div className="flex items-center justify-between mt-1 relative">
              
              {/* Left Actions */}
              <div className="flex items-center gap-2">
                
                {/* Micro Button (Voice Call Overlay) */}
                <button 
                  onClick={() => setVoiceCallActive(true)}
                  title="Appel vocal AXON Live"
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-[#39FF14] hover:bg-white/[0.08] hover:border-[#39FF14]/30 transition-all cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>

                {/* Paramètres de l'agent Button */}
                <button 
                  onClick={() => router.push('/admin/hq/agents/axon/settings')}
                  title="Paramètres de l'agent"
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>

              </div>

              {/* Right Action: Send Button */}
              <button 
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all cursor-pointer ${
                  input.trim() && !sending
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

      {/* Voice Session Overlay (Gemini Live Style) */}
      <AnimatePresence>
        {voiceCallActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between py-16 px-6 font-mono"
          >
            {/* Header */}
            <div className="flex flex-col items-center gap-2 mt-4 text-center">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/20 text-[10px] text-[#39FF14] uppercase tracking-widest animate-pulse">
                ● Session vocale active
              </div>
              <h2 className="text-xl font-sans font-bold tracking-wider text-white uppercase mt-4">AXON Voice Link</h2>
              <p className="text-xs text-white/40 max-w-xs">Bientôt disponible — En attente de connexion vocale...</p>
            </div>

            {/* Center Pulsing Circle */}
            <div className="relative flex items-center justify-center">
              <motion.div
                className="absolute w-48 h-48 rounded-full border border-[#39FF14]/20 bg-[#39FF14]/5"
                animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.4, 0.1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute w-36 h-36 rounded-full border border-[#39FF14]/30 bg-[#39FF14]/10"
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              />
              <motion.div
                className="absolute w-24 h-24 rounded-full border border-[#39FF14]/40 bg-[#39FF14]/20"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />
              <div className="relative w-16 h-16 rounded-full bg-[#39FF14] flex items-center justify-center text-black shadow-[0_0_30px_rgba(57,255,20,0.4)]">
                <Mic className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            {/* Footer Hang up */}
            <div className="flex flex-col items-center gap-6 mb-4">
              <button
                onClick={() => setVoiceCallActive(false)}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.4)] cursor-pointer"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <span className="text-[10px] text-white/30 uppercase tracking-wider">Raccrocher</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </DoubleRibbonIntelligent>
  );
}
