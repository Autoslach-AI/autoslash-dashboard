"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Zap, LayoutDashboard, Users, ArrowRight,
  Sparkles, Loader2, AlertCircle, Settings,
  Pencil, Copy, RotateCw, Mic, PhoneOff, Paperclip,
  Plus, Phone, Camera
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

  // Voice dictation states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // File attachment states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<Array<{ name: string; url: string }>>([]);

  // Plus menu popup state
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);

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

  // Web Speech API - Voice Dictation Handler
  const toggleDictation = () => {
    const SpeechRecognition = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!SpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        const rec = new SpeechRecognition();
        rec.lang = 'fr-FR';
        rec.continuous = false;
        rec.interimResults = true;

        let baseText = input;

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const textToAdd = finalTranscript || interimTranscript;
          if (textToAdd) {
            setInput(baseText + (baseText ? ' ' : '') + textToAdd);
          }
        };

        rec.onerror = (err: any) => {
          console.error("Speech Recognition error:", err);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (err) {
        console.error(err);
        setIsListening(false);
      }
    }
  };

  const SpeechRecognitionSupported = typeof window !== 'undefined' && (!!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition);

  // Handle Multiple Files Upload sequentially
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    setError(null);

    try {
      const uploadedList = [...attachedFiles];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        const sanitizedName = file.name
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire accents
          .replace(/[^a-zA-Z0-9.\-_]/g, '_'); // remplace tout caractère non autorisé par _
        formData.append('path', `axon/files/${Date.now()}-${sanitizedName}`);

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData
        });

        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || `Erreur lors de l'envoi de ${file.name}`);
        }

        uploadedList.push({
          name: file.name,
          url: json.url
        });
      }
      setAttachedFiles(uploadedList);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'upload des fichiers.");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Send message
  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const currentAttachments = attachedFiles;

    let userMsgContent = trimmed;
    if (currentAttachments.length > 0) {
      userMsgContent += '\n' + currentAttachments.map(f => `📎 ${f.name}`).join('\n');
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMsgContent,
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
    setAttachedFiles([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const history = messages
        .filter(m => !m.loading)
        .map(m => ({ role: m.role, content: m.content }));

      let apiPrompt = trimmed;
      if (currentAttachments.length > 0) {
        apiPrompt += `\n\n[Fichiers attachés : \n` + currentAttachments.map(f => `- ${f.name} (URL : ${f.url})`).join('\n') + `]`;
      }

      const res = await fetch('/api/admin/hq/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: 'axon',
          messages: [...history, { role: 'user', content: apiPrompt }]
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
  }, [input, sending, messages, attachedFiles]);

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
            {/* Paramètres Button (Discrete Ghost Style) */}
            <button 
              onClick={() => router.push('/admin/hq/agents/axon/settings')}
              title="Paramètres"
              className="flex items-center justify-center p-2 text-white/30 hover:text-white transition-all cursor-pointer rounded-lg"
            >
              <Settings className="w-4 h-4" />
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
          
          {/* Hidden File Input */}
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={handleFileChange}
          />

          {/* Chat Input Card */}
          <div className="w-full max-w-[480px] bg-[#141414] border border-white/[0.06] rounded-[20px] p-4 flex flex-col gap-3 shadow-2xl relative">
            
            {/* Attachment Badges */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-col gap-1.5 self-start w-full">
                {attachedFiles.map((file, fileIdx) => (
                  <div 
                    key={fileIdx} 
                    className="flex items-center justify-between px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[11px] text-white/80 w-full"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="w-3.5 h-3.5 text-[#39FF14] shrink-0" />
                      <span className="truncate max-w-[300px]">{file.name}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== fileIdx))}
                      className="text-white/40 hover:text-white font-bold ml-1 cursor-pointer shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

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
                
                {/* Plus Button with Dropdown */}
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setPlusMenuOpen(!plusMenuOpen)}
                    title="Actions supplémentaires"
                    className={`flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer ${plusMenuOpen ? 'text-white bg-white/[0.08]' : ''}`}
                  >
                    {uploadingFile ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#39FF14]" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <AnimatePresence>
                    {plusMenuOpen && (
                      <>
                        {/* Transparent Backdrop to close menu */}
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setPlusMenuOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-10 left-0 z-20 w-52 bg-[#121212] border border-white/10 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 font-sans"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setPlusMenuOpen(false);
                              fileInputRef.current?.click();
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs text-white/70 hover:text-white hover:bg-white/5 transition-all w-full cursor-pointer"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-[#39FF14]" />
                            <span>Joindre des fichiers</span>
                          </button>
                          
                          <button
                            type="button"
                            disabled
                            title="Fonctionnalité à venir"
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs text-white/30 cursor-not-allowed w-full"
                          >
                            <div className="flex items-center gap-2">
                              <Camera className="w-3.5 h-3.5" />
                              <span>Capture d'écran</span>
                            </div>
                            <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-white/40 font-mono">Bientôt</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mic Button (Dictation) */}
                <button 
                  type="button"
                  onClick={toggleDictation}
                  disabled={!SpeechRecognitionSupported}
                  title={SpeechRecognitionSupported ? "Dictée vocale" : "Dictée vocale non supportée par ce navigateur"}
                  className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all cursor-pointer ${
                    !SpeechRecognitionSupported
                      ? 'opacity-30 cursor-not-allowed'
                      : isListening
                        ? 'bg-red-500/20 border-red-500/40 text-red-500 animate-pulse'
                        : 'bg-white/[0.04] border-white/[0.06] text-white/50 hover:text-[#39FF14] hover:bg-white/[0.08]'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>

                {/* Phone Button (Voice Call Overlay) */}
                <button 
                  type="button"
                  onClick={() => setVoiceCallActive(true)}
                  title="Appel vocal AXON Live"
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-[#39FF14] hover:bg-white/[0.08] hover:border-[#39FF14]/30 transition-all cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>

              </div>

              {/* Right Action: Send Button */}
              <button 
                type="button"
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
                type="button"
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
