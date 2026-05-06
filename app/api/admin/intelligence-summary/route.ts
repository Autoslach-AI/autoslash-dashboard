import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const revalidate = 30

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: alerts } = await supabase
    .from('admin_intelligence_logs')
    .select('*')
    .in('issue_type', ['AGENT_ERROR', 'SECURITY', 'CHURN_RISK', 'FEEDBACK_NEGATIF'])
    .order('created_at', { ascending: false })

  const totalActive = alerts?.length || 0
  const latestAlert = alerts?.[0] || null

  return NextResponse.json({
    totalActive,
    latestAlert,
    isOptimal: totalActive === 0
  })
}
