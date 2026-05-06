import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const revalidate = 30;

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('system_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ totalEvents: 0, lastEvent: null, lastEventType: null, lastEventColor: null, lastEnterpriseId: null, globalStatus: 'LIVE' })
  }

  const totalEvents = data?.length ?? 0
  const last = data?.[0] ?? null

  let globalStatus = 'LIVE'
  if (last?.status_color === 'red') globalStatus = 'ERROR'
  else if (last?.status_color === 'orange') globalStatus = 'SYNC'
  else if (last?.status_color === 'green') globalStatus = 'LIVE'

  return NextResponse.json({
    totalEvents,
    lastEvent: last?.raw_data ?? null,
    lastEventType: last?.event_type ?? null,
    lastEventColor: last?.status_color ?? null,
    lastEnterpriseId: last?.id_projet ?? null,
    globalStatus
  }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' }
  })
}
