import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('id, title, package_type, price_fcfa')
      .eq('is_published', true)
      .order('package_type')
      .order('price_fcfa')

    if (error) return NextResponse.json(
      { error: error.message }, { status: 400 }
    )

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message }, { status: 500 }
    )
  }
}
