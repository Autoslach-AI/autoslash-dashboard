import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      name, email, phone, package_type,
      template_id, region, sector,
      message, source_contact,
      status, prospect_status
    } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Nom et email obligatoires' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('enterprises')
      .insert([{
        name,
        email,
        phone:           phone           || null,
        package_type:    package_type    || 'STARTUP',
        template_id:     template_id     || null,
        region:          region          || null,
        sector:          sector          || null,
        message:         message         || null,
        source_contact:  source_contact  || 'Saisie manuelle Amadou',
        status:          status          || 'PROSPECT',
        prospect_status: prospect_status || 'NEW',
        prospect_score:  0,
        is_test:         false,
        token_budget:    1000000,
        total_tokens_consumed: 0,
        monthly_cost:    0,
        valeur_estimee_fcfa: 0,
        warning_flag:    false,
        alert_threshold: 0.15
      }])
      .select()
      .single()

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
