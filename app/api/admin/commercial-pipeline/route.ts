import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const revalidate = 30

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Prospects en attente
  const { count: prospectsCount } = await supabase
    .from('admin_intelligence_logs')
    .select('*', { count: 'exact', head: true })
    .eq('issue_type', 'NEW_PROSPECT')

  // Upsell opportunities
  const { count: upsellCount } = await supabase
    .from('admin_intelligence_logs')
    .select('*', { count: 'exact', head: true })
    .eq('issue_type', 'UPSELL')

  // Churn risks
  const { count: churnCount } = await supabase
    .from('enterprises')
    .select('*', { count: 'exact', head: true })
    .in('status', ['WARNING', 'CRITICAL'])
    .eq('is_test', false)

  // Derniers prospects pour détail
  const { data: recentProspects } = await supabase
    .from('admin_intelligence_logs')
    .select('id, raw_context, created_at, client_id')
    .eq('issue_type', 'NEW_PROSPECT')
    .order('created_at', { ascending: false })
    .limit(3)

  return NextResponse.json({
    total: (prospectsCount || 0) + (upsellCount || 0) + (churnCount || 0),
    prospects: { count: prospectsCount || 0, items: recentProspects || [] },
    upsell: { count: upsellCount || 0 },
    churn: { count: churnCount || 0 },
    isPipelineOptimal: (prospectsCount || 0) + (upsellCount || 0) + (churnCount || 0) === 0
  })
}
