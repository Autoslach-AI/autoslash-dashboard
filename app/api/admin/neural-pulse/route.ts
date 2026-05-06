import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const revalidate = 30

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Latest system log
  const { data: latestLog } = await supabase
    .from('system_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Community events
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: communityEvents } = await supabase
    .from('admin_intelligence_logs')
    .select('*')
    .eq('issue_type', 'COMMUNITY_EVENT')
    .gte('created_at', yesterday)

  return NextResponse.json({
    latestLog,
    community: {
      count: communityEvents?.length || 0,
      latest: communityEvents?.[0] || null
    }
  })
}
