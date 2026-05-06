import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const revalidate = 30

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Tokens count and calls
  const { data: globalStats } = await supabase
    .from('agent_tasks')
    .select('tokens_total, primary_api')
    .gte('created_at', firstDayOfMonth)

  const { data: clientStats } = await supabase
    .from('client_agent_tasks')
    .select('tokens_total, primary_api')
    .gte('created_at', firstDayOfMonth)

  const allStats = [...(globalStats || []), ...(clientStats || [])]
  
  const totalTokens = allStats.reduce((sum, s) => sum + (s.tokens_total || 0), 0)
  const totalCalls = allStats.length
  
  const apis = Array.from(new Set(allStats.map(s => s.primary_api))).filter(Boolean)

  return NextResponse.json({
    totalTokens,
    totalCalls,
    apis,
    hasAgents: totalCalls > 0
  })
}
