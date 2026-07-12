"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Zap, LayoutDashboard, Users, ArrowRight,
  Sparkles, Loader2, AlertCircle, Settings,
  Pencil, Copy, RotateCw, Mic, PhoneOff, Paperclip,
  Plus, Phone, Camera, Check, X, FileText
} from 'lucide-react';
import { useUser } from '@/lib/contexts/user-context';
import DoubleRibbonIntelligent, { NavItem } from '@/components/DoubleRibbonIntelligent';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AttachedFileRef {
  name:    string;
  url:     string;
  isImage: boolean;
}

interface PastedAttachment {
  id:      string;
  name:    string;
  content: string;
}

interface Message {
  id:          string;
  role:        'user' | 'assistant';
  content:     string;
  timestamp:   Date;
  loading?:    boolean;
  attachments?: AttachedFileRef[];
  pastedTexts?: PastedAttachment[];
}

// Longueur au-delà de laquelle un message user est tronqué visuellement
const TRUNCATE_THRESHOLD = 300;

// Longueur au-delà de laquelle un COLLAGE dans l'input se transforme
// automatiquement en pièce jointe texte (comme Claude.ai)
const PASTE_TO_FILE_THRESHOLD = 800;

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
  const [attachedFiles, setAttachedFiles] = useState<AttachedFileRef[]>([]);

  // Plus menu popup state
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);

  // Texte collé transformé automatiquement en pièce jointe (façon Claude.ai)
  const [pastedAttachments, setPastedAttachments] = useState<PastedAttachment[]>([]);
  const [previewingPaste, setPreviewingPaste] = useState<PastedAttachment | null>(null);

  // Prévisualisation des fichiers attachés (image en zoom, texte en cadre défilant)
  const [previewingAttachedFile, setPreviewingAttachedFile] = useState<AttachedFileRef | null>(null);
  const [attachedPreviewContent, setAttachedPreviewContent] = useState<string | null>(null);
  const [attachedPreviewLoading, setAttachedPreviewLoading] = useState(false);

  const openAttachedPreview = async (file: AttachedFileRef) => {
    setPreviewingAttachedFile(file);
    setAttachedPreviewContent(null);
    if (!file.isImage) {
      setAttachedPreviewLoading(true);
      try {
        const res = await fetch(file.url);
        const text = await res.text();
        setAttachedPreviewContent(text);
      } catch (err) {
        setAttachedPreviewContent("Impossible de charger le contenu de ce fichier.");
      } finally {
        setAttachedPreviewLoading(false);
      }
    }
  };

  const closeAttachedPreview = () => {
    setPreviewingAttachedFile(null);
    setAttachedPreviewContent(null);
  };

  // ── Édition en place ──────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Auto-resize textarea de la zone d'édition inline
  useEffect(() => {
    if (editingId && editTextareaRef.current) {
      const ta = editTextareaRef.current;
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 400) + 'px';
      ta.focus();
    }
  }, [editingId, editValue]);

  // Auto-resize input textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
    }
  };

  // Collage d'un texte long → transformation automatique en pièce jointe
  // (reproduit le comportement de Claude.ai)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.length > PASTE_TO_FILE_THRESHOLD) {
      e.preventDefault();
      const firstLine = pastedText.split('\n')[0].trim().slice(0, 40);
      const name = firstLine
        ? `${firstLine}${firstLine.length >= 40 ? '…' : ''}.txt`
        : 'Texte collé.txt';

      setPastedAttachments(prev => [...prev, {
        id: crypto.randomUUID(),
        name,
        content: pastedText
      }]);
    }
    // Sinon, comportement de collage normal (texte inséré dans l'input)
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
          url: json.url,
          isImage: file.type.startsWith('image/')
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

  // Envoi générique — accepte un contenu et un historique explicites,
  // pour être réutilisable à la fois par l'input du bas et par l'édition en place.
  const dispatchMessage = useCallback(async (
    content: string,
    historyBase: Message[],
    attachments: AttachedFileRef[],
    pastedTexts: PastedAttachment[] = []
  ) => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? attachments : undefined,
      pastedTexts: pastedTexts.length > 0 ? pastedTexts : undefined
    };

    const loadingMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true
    };

    setMessages([...historyBase, userMsg, loadingMsg]);
    setSending(true);
    setError(null);

    try {
      const historyPayload = historyBase
        .filter(m => !m.loading)
        .map(m => {
          let historyContent = m.content;
          if (m.attachments && m.attachments.length > 0) {
            historyContent += `\n\n[Fichiers attachés : \n` + m.attachments.map(f => `- ${f.name} (URL : ${f.url})`).join('\n') + `]`;
          }
          if (m.pastedTexts && m.pastedTexts.length > 0) {
            historyContent += m.pastedTexts.map(p => `\n\n[Texte collé — ${p.name}] :\n${p.content}`).join('');
          }
          return { role: m.role, content: historyContent };
        });

      let apiPrompt = trimmed;
      if (attachments.length > 0) {
        apiPrompt += `\n\n[Fichiers attachés : \n` + attachments.map(f => `- ${f.name} (URL : ${f.url})`).join('\n') + `]`;
      }
      if (pastedTexts.length > 0) {
        apiPrompt += pastedTexts.map(p => `\n\n[Texte collé — ${p.name}] :\n${p.content}`).join('');
      }

      const res = await fetch('/api/admin/hq/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: 'axon',
          messages: [...historyPayload, { role: 'user', content: apiPrompt }]
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
  }, [sending]);

  // Send message (depuis l'input du bas)
  // Note : le texte du message reste obligatoire même si des pièces jointes
  // sont présentes — le bouton d'envoi est déjà désactivé tant que l'input est vide.
  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const currentAttachments = attachedFiles;
    const currentPastedTexts = pastedAttachments;
    setInput('');
    setAttachedFiles([]);
    setPastedAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await dispatchMessage(trimmed, messages, currentAttachments, currentPastedTexts);
    setTimeout(() => textareaRef.current?.focus(), 10);
  }, [input, sending, messages, attachedFiles, pastedAttachments, dispatchMessage]);

  // Regenerate last response
  const regenerateResponse = useCallback(async () => {
    if (sending) return;

    const userMsgs = messages.filter(m => m.role === 'user');
    if (userMsgs.length === 0) return;

    const lastUserMsg = userMsgs[userMsgs.length - 1];
    const index = messages.findLastIndex(m => m.id === lastUserMsg.id);
    if (index === -1) return;

    const historyUntilLastUser = messages.slice(0, index);

    await dispatchMessage(
      lastUserMsg.content,
      historyUntilLastUser,
      lastUserMsg.attachments ?? [],
      lastUserMsg.pastedTexts ?? []
    );
  }, [messages, sending, dispatchMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Édition en place ──────────────────────────────────────────────────────
  const startEditing = (msg: Message) => {
    if (editingId !== null) return; // un seul message éditable à la fois
    setEditingId(msg.id);
    setEditValue(msg.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEditing = async (msgId: string) => {
    const idx = messages.findIndex(m => m.id === msgId);
    if (idx === -1) return;

    const originalMsg = messages[idx];
    const truncatedHistory = messages.slice(0, idx);
    const contentToSend = editValue;

    setEditingId(null);
    setEditValue('');

    await dispatchMessage(
      contentToSend,
      truncatedHistory,
      originalMsg.attachments ?? [],
      originalMsg.pastedTexts ?? []
    );
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
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                const isEditing = editingId === msg.id;
                const isTruncated = isUser && !isEditing && msg.content.length > TRUNCATE_THRESHOLD;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex w-full group relative ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`${isEditing ? 'w-full max-w-[520px]' : 'max-w-[85%]'} flex flex-col relative ${isUser ? 'items-end' : 'items-start'}`}>

                      {/* Sender Name */}
                      <span className="text-[10px] text-white/30 mb-1 px-1">
                        {isUser ? (profile?.full_name?.split(' ')[0] || 'Amadou') : 'AXON'}
                      </span>

                      {/* ── Mode édition en place ─────────────────────────── */}
                      {isEditing ? (
                        <div className="w-full flex flex-col gap-2">
                          <textarea
                            ref={editTextareaRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full bg-[#141414] border border-[#39FF14]/30 rounded-2xl px-4 py-3 text-[13px] text-white/90 leading-relaxed font-sans resize-none focus:outline-none focus:border-[#39FF14]/50 max-h-[400px] overflow-y-auto"
                            rows={3}
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={cancelEditing}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-all text-[11px] cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              Annuler
                            </button>
                            <button
                              onClick={() => saveEditing(msg.id)}
                              disabled={!editValue.trim() || sending}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] hover:bg-[#39FF14]/20 transition-all text-[11px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Enregistrer
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Pièces jointes du message (fichiers + textes collés), cliquables, restent intactes après envoi */}
                          {isUser && ((msg.attachments && msg.attachments.length > 0) || (msg.pastedTexts && msg.pastedTexts.length > 0)) && (
                            <div className="grid grid-cols-5 gap-2 mb-1.5 justify-end w-full">
                              {msg.attachments?.map((file, fIdx) => (
                                <div
                                  key={`att-${fIdx}`}
                                  onClick={() => openAttachedPreview(file)}
                                  className="relative w-20 h-20 rounded-xl border border-white/10 bg-[#1A1A1A] group/thumb shrink-0 cursor-pointer hover:border-[#39FF14]/40 transition-colors flex flex-col justify-between p-2 text-left"
                                  title={file.name}
                                >
                                  {file.isImage ? (
                                    <div className="w-full h-full rounded-lg overflow-hidden relative -m-2">
                                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                      <div className="absolute bottom-1 left-1 text-[7px] font-sans font-bold tracking-wider text-white/50 bg-black/60 border border-white/10 px-1 py-0.5 rounded uppercase">
                                        IMG
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <span className="text-[9px] text-white/80 font-sans leading-snug font-medium line-clamp-3 break-all text-left block">
                                        {file.name}
                                      </span>
                                      <div className="text-[7px] font-sans font-bold tracking-wider text-white/50 bg-white/5 border border-white/10 px-1 py-0.5 rounded uppercase self-start">
                                        {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}
                              {msg.pastedTexts?.map((paste) => (
                                <div
                                  key={paste.id}
                                  onClick={() => setPreviewingPaste(paste)}
                                  className="relative w-20 h-20 rounded-xl border border-white/10 bg-[#1A1A1A] group/thumb shrink-0 cursor-pointer hover:border-[#39FF14]/40 transition-colors flex flex-col justify-between p-2 text-left"
                                  title={paste.name}
                                >
                                  <span className="text-[9px] text-white/80 font-sans leading-snug font-medium line-clamp-3 break-all text-left block">
                                    {paste.name}
                                  </span>
                                  <div className="text-[7px] font-sans font-bold tracking-wider text-white/50 bg-white/5 border border-white/10 px-1 py-0.5 rounded uppercase self-start">
                                    TXT
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Message Bubble (avec troncature visuelle si trop longue) */}
                          <div className={`relative px-4 py-3 rounded-2xl text-[13px] leading-relaxed border ${
                            isUser
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
                              <span className={`whitespace-pre-wrap ${isTruncated ? 'line-clamp-4 block' : ''}`}>
                                {msg.content}
                              </span>
                            )}

                            {isTruncated && (
                              <div className={`absolute bottom-0 left-0 right-0 h-8 rounded-b-2xl bg-gradient-to-t ${
                                isUser ? 'from-white/[0.10] to-transparent' : 'from-[#141414] to-transparent'
                              } pointer-events-none`} />
                            )}
                          </div>

                          {isTruncated && (
                            <button
                              onClick={() => startEditing(msg)}
                              disabled={editingId !== null}
                              className="text-[10px] text-[#39FF14]/70 hover:text-[#39FF14] mt-1 px-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              Voir le message complet
                            </button>
                          )}
                        </>
                      )}

                      {/* Timestamp + Actions (sous la bulle, façon Claude) */}
                      {!isEditing && (
                        <div className={`flex items-center gap-1.5 mt-1 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className="text-[9px] text-white/20">
                            {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          {!msg.loading && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              {isUser ? (
                                <button
                                  onClick={() => startEditing(msg)}
                                  disabled={editingId !== null}
                                  title="Modifier"
                                  className={`p-1 rounded-md text-white/40 transition-all ${
                                    editingId !== null
                                      ? 'opacity-30 pointer-events-none'
                                      : 'hover:bg-white/10 hover:text-white cursor-pointer'
                                  }`}
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => navigator.clipboard.writeText(msg.content)}
                                    title="Copier"
                                    className="p-1 rounded-md text-white/40 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={regenerateResponse}
                                    title="Régénérer"
                                    className="p-1 rounded-md text-white/40 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                                  >
                                    <RotateCw className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </motion.div>
                );
              })
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
              className="mx-auto max-w-[580px] w-full px-4 mb-2 shrink-0 animate-pulse"
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
          <div className="w-full max-w-[580px] bg-[#141414] border border-white/[0.06] rounded-[20px] p-4 flex flex-col gap-3 shadow-2xl relative">

            {/* Attachment Thumbnails (vignettes carrées, grille fixe 5 colonnes) */}
            {attachedFiles.length > 0 && (
              <div className="grid grid-cols-5 gap-2.5 w-full mb-1">
                {attachedFiles.map((file, fileIdx) => {
                  const extension = file.name.split('.').pop()?.toUpperCase() || 'FILE';
                  return (
                    <div
                      key={fileIdx}
                      onClick={() => openAttachedPreview(file)}
                      className="relative w-28 h-28 rounded-xl border border-white/10 bg-[#1A1A1A] group/thumb shrink-0 cursor-pointer hover:border-[#39FF14]/40 transition-colors flex flex-col justify-between p-2.5 text-left"
                      title={file.name}
                    >
                      {file.isImage ? (
                        <div className="w-full h-full rounded-lg overflow-hidden relative">
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 left-1 text-[8px] font-sans font-bold tracking-wider text-white/50 bg-black/60 border border-white/10 px-1.5 py-0.5 rounded uppercase">
                            IMG
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="text-[10px] text-white/80 font-sans leading-snug font-medium line-clamp-3 break-all text-left block">
                            {file.name}
                          </span>
                          <div className="text-[8px] font-sans font-bold tracking-wider text-white/50 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded uppercase self-start">
                            {extension}
                          </div>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAttachedFiles(prev => prev.filter((_, idx) => idx !== fileIdx));
                        }}
                        className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/75 hover:bg-black/95 text-white/80 hover:text-white flex items-center justify-center text-[10px] leading-none cursor-pointer opacity-0 group-hover/thumb:opacity-100 transition-opacity z-10"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pasted Text Attachment Badges (vignette carrée, grille fixe 5 colonnes) */}
            {pastedAttachments.length > 0 && (
              <div className="grid grid-cols-5 gap-2.5 w-full mb-1">
                {pastedAttachments.map((paste) => (
                  <div
                    key={paste.id}
                    onClick={() => setPreviewingPaste(paste)}
                    className="relative w-28 h-28 rounded-xl border border-white/10 bg-[#1A1A1A] group/thumb shrink-0 cursor-pointer hover:border-[#39FF14]/40 transition-colors flex flex-col justify-between p-2.5 text-left"
                    title={paste.name}
                  >
                    <span className="text-[10px] text-white/80 font-sans leading-snug font-medium line-clamp-3 break-all text-left block">
                      {paste.name}
                    </span>
                    <div className="flex items-center justify-between">
                      <div className="text-[8px] font-sans font-bold tracking-wider text-white/50 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded uppercase">
                        TXT
                      </div>
                      <span className="text-[8px] text-white/30 font-sans">
                        {paste.content.length}c
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPastedAttachments(prev => prev.filter(p => p.id !== paste.id));
                      }}
                      className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/75 hover:bg-black/95 text-white/80 hover:text-white flex items-center justify-center text-[10px] leading-none cursor-pointer opacity-0 group-hover/thumb:opacity-100 transition-opacity z-10"
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
              onPaste={handlePaste}
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

      {/* Attached File Preview Modal (zoom image / cadre texte défilant) */}
      <AnimatePresence>
        {previewingAttachedFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={closeAttachedPreview}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className={`${
                previewingAttachedFile.isImage
                  ? 'max-w-[90vw] max-h-[90vh]'
                  : 'w-full max-w-2xl max-h-[80vh] bg-[#121212] border border-white/10 rounded-2xl flex flex-col overflow-hidden font-mono'
              } shadow-2xl`}
            >
              {previewingAttachedFile.isImage ? (
                <div className="relative">
                  <img
                    src={previewingAttachedFile.url}
                    alt={previewingAttachedFile.name}
                    className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={closeAttachedPreview}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white/80 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2 text-white/80 text-sm truncate">
                      <Paperclip className="w-4 h-4 text-[#39FF14] shrink-0" />
                      <span className="truncate">{previewingAttachedFile.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={closeAttachedPreview}
                      className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="overflow-y-auto px-5 py-4">
                    {attachedPreviewLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-5 h-5 text-[#39FF14] animate-spin" />
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap text-[12px] text-white/70 leading-relaxed font-sans">
                        {attachedPreviewContent}
                      </pre>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pasted Text Preview Modal */}
      <AnimatePresence>
        {previewingPaste && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setPreviewingPaste(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[80vh] bg-[#121212] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-mono"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2 text-white/80 text-sm truncate">
                  <FileText className="w-4 h-4 text-[#39FF14] shrink-0" />
                  <span className="truncate">{previewingPaste.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewingPaste(null)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto px-5 py-4">
                <pre className="whitespace-pre-wrap text-[12px] text-white/70 leading-relaxed font-sans">
                  {previewingPaste.content}
                </pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
