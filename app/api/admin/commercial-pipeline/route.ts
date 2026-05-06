import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const revalidate = 30

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Prospects en attente (via v_prospects_all)
  const { data: prospectLogs, count: prospectsCount } = await supabase
    .from('v_prospects_all')
    .select('id, name, package_type, region, raw_context, created_at, client_id', { count: 'exact' })
    .order('created_at', { ascending: false });

  // Upsell opportunities (via admin_intelligence_logs + enterprises join)
  const { data: upsells } = await supabase
    .from('admin_intelligence_logs')
    .select('id, raw_context, client_id, enterprises!inner(name, is_test)')
    .eq('issue_type', 'UPSELL')
    .eq('enterprises.is_test', false)
    .order('created_at', { ascending: false });

  // Churn risks (via v_clients_all)
  const { data: churnLogs } = await supabase
    .from('v_clients_all')
    .select('id, name, status, is_test')
    .in('status', ['WARNING', 'CRITICAL'])
    .eq('is_test', false)
    .order('created_at', { ascending: false });

  const total = (prospectsCount || 0) + (upsells?.length || 0) + (churnLogs?.length || 0);

  return NextResponse.json({
    total,
    prospects: { 
      count: prospectsCount || 0, 
      latest: prospectLogs?.[0] || null 
    },
    upsell: { 
      count: upsells?.length || 0,
      latest: upsells?.[0] || null
    },
    churn: { 
      count: churnLogs?.length || 0,
      latest: churnLogs?.[0] || null
    },
    isPipelineOptimal: total === 0
  })
}
