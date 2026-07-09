"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Brain, Zap, LayoutDashboard, Users, Plus, Mic,
  PenLine, GraduationCap, Code2, Coffee, Lightbulb, ChevronDown
} from 'lucide-react';
import { useUser } from '@/lib/contexts/user-context';
import DoubleRibbonIntelligent, { NavItem } from '@/components/DoubleRibbonIntelligent';

// ─── Custom Icons ────────────────────────────────────────────────────────────

const ClaudeLogo = () => (
  <svg className="w-10 h-10 shrink-0" viewBox="0 0 100 100" fill="currentColor">
    <g transform="translate(50, 50)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <path
          key={i}
          d="M -4, -40 C -4, -10 -2, 0 0, 0 C 2, 0 4, -10 4, -40 C 4, -45 2, -48 0, -48 C -2, -48 -4, -45 -4, -40 Z"
          transform={`rotate(${angle})`}
          className="fill-[#D96B43]"
        />
      ))}
      <circle cx="0" cy="0" r="8" className="fill-[#D96B43]" />
    </g>
  </svg>
);

const AudioWavesIcon = () => (
  <svg className="w-4 h-4 text-[#191919]/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10v4M6 6v12M9 4v16M12 7v10M15 5v14M18 8v8M21 11v2" />
  </svg>
);

// ─── Composant principal ─────────────────────────────────────────────────────

export default function HQAgentsPage() {
  const router            = useRouter()
  const { user, profile } = useUser()

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
      <div className="flex flex-col h-screen bg-[#F9F8F6] text-[#191919] overflow-hidden select-none font-sans">
        
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-4 w-full shrink-0">
          <div /> {/* spacing */}
          
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAE8E4] text-[12px] font-medium text-[#191919]/70">
            <span>Forfait Free</span>
            <span className="text-[#191919]/30">•</span>
            <button className="underline hover:text-[#191919] transition-all">
              Mettre à niveau
            </button>
          </div>
          
          {/* User profile avatar or similar ghost circle */}
          <div className="w-8 h-8 rounded-full bg-[#EAE8E4] border border-[#E3E2DE] flex items-center justify-center text-xs font-semibold text-[#191919]/60">
            A
          </div>
        </div>

        {/* Centered main content area */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
          <div className="w-full max-w-[800px] flex flex-col items-center">
            
            {/* Title row with beautiful custom Claude logo */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <ClaudeLogo />
              <h1 className="text-4xl md:text-5xl font-serif text-[#191919] tracking-tight font-normal">
                Sur quoi allons-nous réfléchir ?
              </h1>
            </div>

            {/* Prompt Box */}
            <div className="w-full bg-white rounded-[24px] border border-[#E3E2DE] shadow-[0_4px_20px_rgba(0,0,0,0.03)] px-6 py-5 flex flex-col gap-4">
              <textarea
                placeholder="Comment puis-je vous aider ?"
                rows={2}
                className="w-full bg-transparent border-none text-[16px] text-[#191919] placeholder-[#191919]/40 focus:outline-none resize-none leading-relaxed font-sans min-h-[60px]"
              />
              
              <div className="flex items-center justify-between border-t border-black/[0.03] pt-3">
                {/* Left side attachment button */}
                <button className="w-8 h-8 rounded-full border border-[#E3E2DE] hover:bg-[#F3F2EE] flex items-center justify-center text-[#191919]/50 hover:text-[#191919] transition-all cursor-pointer">
                  <Plus className="w-4 h-4" />
                </button>
                
                {/* Right side controls */}
                <div className="flex items-center gap-2">
                  {/* Model Selector */}
                  <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E3E2DE] text-[12px] font-sans font-medium text-[#191919]/70 hover:bg-[#F3F2EE] transition-all cursor-pointer">
                    <span>Sonnet 5 Moyen</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </div>
                  
                  {/* Mic button */}
                  <button className="w-8 h-8 rounded-full hover:bg-[#F3F2EE] flex items-center justify-center text-[#191919]/50 hover:text-[#191919] transition-all cursor-pointer">
                    <Mic className="w-4 h-4" />
                  </button>
                  
                  {/* Audio waves button */}
                  <button className="w-8 h-8 rounded-full hover:bg-[#F3F2EE] flex items-center justify-center text-[#191919]/50 hover:text-[#191919] transition-all cursor-pointer">
                    <AudioWavesIcon />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Action Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
              {[
                { label: 'Écrire', icon: PenLine },
                { label: 'Apprendre', icon: GraduationCap },
                { label: 'Code', icon: Code2 },
                { label: 'Vie quotidienne', icon: Coffee },
                { label: 'Choix de Claude', icon: Lightbulb }
              ].map((pill, idx) => {
                const Icon = pill.icon;
                return (
                  <button
                    key={idx}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E3E2DE] bg-white hover:bg-[#F3F2EE] transition-all text-[13px] font-medium text-[#191919]/70 hover:text-[#191919] cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                    <Icon className="w-4 h-4 opacity-70" />
                    <span>{pill.label}</span>
                  </button>
                );
              })}
            </div>

          </div>
        </div>

      </div>
    </DoubleRibbonIntelligent>
  );
}
