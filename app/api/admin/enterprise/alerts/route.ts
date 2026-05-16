import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const enterprise_id = searchParams.get('enterprise_id')
    if (!enterprise_id) {
      return NextResponse.json({ error: 'enterprise_id requis' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('admin_intelligence_logs')
      .select('id, issue_type, severity_level, raw_context, created_at, is_upsell_opportunity')
      .eq('client_id', enterprise_id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
