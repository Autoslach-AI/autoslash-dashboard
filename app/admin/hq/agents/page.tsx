"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Zap, LayoutDashboard, Users } from 'lucide-react';
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
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center font-mono">
        <span className="text-white/40 text-[13px] tracking-widest uppercase">
          en attente
        </span>
      </div>
    </DoubleRibbonIntelligent>
  )
}
