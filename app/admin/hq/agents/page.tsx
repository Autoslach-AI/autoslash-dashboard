"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Zap, LayoutDashboard, Users, Paperclip, ChevronDown, ArrowRight, Sparkles } from 'lucide-react';
import { useUser } from '@/lib/contexts/user-context';
import DoubleRibbonIntelligent, { NavItem } from '@/components/DoubleRibbonIntelligent';

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
      <div className="h-[85vh] bg-[#0A0A0A] flex flex-col items-center justify-end pb-24 px-4 font-mono">
        
        {/* Chat Input Card */}
        <div className="w-full max-w-[550px] bg-[#141414] border border-white/[0.06] rounded-[20px] p-4 flex flex-col gap-3 shadow-2xl">
          
          {/* Top: Placeholder Text */}
          <div className="text-[14px] text-white/50 px-1 py-1 select-none pointer-events-none font-sans">
            What can I do for you?
          </div>

          {/* Bottom: Action bar */}
          <div className="flex items-center justify-between mt-1">
            
            {/* Left Actions */}
            <div className="flex items-center gap-2">
              
              {/* Model Selector Pill */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] font-sans text-white/70 hover:bg-white/[0.08] transition-all cursor-pointer">
                <Sparkles className="w-3.5 h-3.5 text-white/60" />
                <span className="font-semibold tracking-tight text-[12px]">GPT-4-1 Mini</span>
                <ChevronDown className="w-3.5 h-3.5 text-white/40" />
              </div>

              {/* Vertical Separator */}
              <div className="w-[1px] h-4 bg-white/10 mx-1" />

              {/* Attachment Button */}
              <button className="flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer">
                <Paperclip className="w-3.5 h-3.5" />
              </button>

            </div>

            {/* Right Action: Send Button */}
            <button className="flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.08] border border-white/[0.06] text-white/30 hover:text-white/80 transition-all cursor-pointer">
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>

        </div>

      </div>
    </DoubleRibbonIntelligent>
  )
}
