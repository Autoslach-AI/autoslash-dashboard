"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Zap, LayoutDashboard, Users, Paperclip, ChevronDown, ArrowRight,
  Sparkles, Loader2, RefreshCw, Trash2, AlertCircle
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

interface ModelOption {
  id:      string;
  name:    string;
  agentId: string;
}

const MODELS: ModelOption[] = [
  { id: 'gpt4', name: 'GPT-4-1 Mini', agentId: 'axon' },
  { id: 'gemini', name: 'Gemini 2.0 Flash', agentId: 'axon' },
  { id: 'claude', name: 'Claude 3.5 Sonnet', agentId: 'axon' },
  { id: 'axon', name: 'AXON Oracle', agentId: 'axon' }
];

// ─── Composant principal ─────────────────────────────────────────────────────

export default function HQAgentsPage() {
  const router            = useRouter()
  const { user, profile } = useUser()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelOption>(MODELS[0])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize input textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'
    }
  }

  // Envoyer message
  const sendMessage = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || sending) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date()
    }

    const loadingMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: selectedModel.agentId,
          messages: [...history, { role: 'user', content: trimmed }]
        })
      })

      const json = await res.json()
      if (json.error) throw new Error(json.error)

      setMessages(prev => prev.map(m =>
        m.loading ? { ...m, content: json.reply, loading: false } : m
      ))
    } catch (err: any) {
      setMessages(prev => prev.filter(m => !m.loading))
      setError(err.message || 'Une erreur est survenue lors de la communication.')
    } finally {
      setSending(false)
      setTimeout(() => textareaRef.current?.focus(), 10)
    }
  }, [input, sending, messages, selectedModel])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

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
        
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6 flex flex-col items-center">
          <div className="w-full max-w-[480px] space-y-6 mt-auto">
            
            {/* If no messages, render a subtle empty state placeholder */}
            {messages.length === 0 && (
              <div className="h-[25vh]" />
            )}

            {/* Conversation list */}
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  
                  {/* Sender Name */}
                  <span className="text-[10px] text-white/30 mb-1 px-1">
                    {msg.role === 'user' ? 'Amadou' : selectedModel.name}
                  </span>

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
            ))}

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
              className="mx-auto max-w-[480px] w-full px-4 mb-2 shrink-0"
            >
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[11px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate">{error}</span>
                <button onClick={() => setError(null)} className="text-red-400/50 hover:text-red-400 font-bold ml-1">✕</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Input Area: Centered, compact, positioned lower */}
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
              placeholder="What can I do for you?"
              disabled={sending}
              className="w-full bg-transparent resize-none text-[13px] text-white placeholder:text-white/30 focus:outline-none leading-relaxed max-h-[140px] font-sans pr-8 disabled:opacity-50"
              style={{ height: 'auto' }}
            />

            {/* Bottom: Action bar */}
            <div className="flex items-center justify-between mt-1 relative">
              
              {/* Left Actions */}
              <div className="flex items-center gap-2" ref={dropdownRef}>
                
                {/* Model Selector Pill */}
                <div 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] font-sans text-white/70 hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer select-none"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white/60" />
                  <span className="font-semibold tracking-tight text-[12px]">{selectedModel.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                </div>

                {/* Dropdown Menu (Renders above the selector pill) */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full mb-2 left-0 w-48 bg-[#181818] border border-white/[0.08] rounded-xl shadow-xl overflow-hidden z-50 py-1"
                    >
                      {MODELS.map((model) => (
                        <div
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model);
                            setDropdownOpen(false);
                          }}
                          className={`px-4 py-2 text-[12px] text-white/70 hover:bg-white/[0.04] hover:text-white transition-colors cursor-pointer flex items-center justify-between font-sans ${
                            selectedModel.id === model.id ? 'bg-white/[0.02] text-[#39FF14] font-semibold' : ''
                          }`}
                        >
                          <span>{model.name}</span>
                          {selectedModel.id === model.id && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14]" />
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Vertical Separator */}
                <div className="w-[1px] h-4 bg-white/10 mx-1" />

                {/* Attachment Button */}
                <button className="flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer">
                  <Paperclip className="w-3.5 h-3.5" />
                </button>

                {/* Reset button if there are messages */}
                {messages.length > 0 && (
                  <button 
                    onClick={() => setMessages([])}
                    title="Effacer la conversation"
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 text-red-400/70 hover:text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

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
    </DoubleRibbonIntelligent>
  )
}

