import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const revalidate = 30

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: clients } = await supabase
    .from('v_clients_all')
    .select('id, status, is_test')
    .eq('is_test', false)

  const stable = clients?.filter(c => c.status === 'STABLE') || []
  const warning = clients?.filter(c => c.status === 'WARNING') || []
  const critical = clients?.filter(c => c.status === 'CRITICAL') || []

  const total = clients?.length || 0
  const score = total > 0 
    ? Math.round(((stable.length * 100) + (warning.length * 50) + (critical.length * 0)) / total)
    : 100

  return NextResponse.json({
    score,
    counts: {
      STABLE: stable.length,
      WARNING: warning.length,
      CRITICAL: critical.length
    },
    firstIds: {
      STABLE: stable[0]?.id || null,
      WARNING: warning[0]?.id || null,
      CRITICAL: critical[0]?.id || null
    }
  })
}
