import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const agent_id = searchParams.get('agent_id')

    if (!agent_id) {
      return NextResponse.json(
        { error: 'agent_id requis' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('hq_agent_skills')
      .select(`
        id,
        is_active,
        agent_id,
        skill_id,
        skills_library (
          name,
          category,
          content
        )
      `)
      .eq('agent_id', agent_id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    const mapped = (data || []).map((row: any) => ({
      id: row.id,
      is_active: row.is_active,
      agent_id: row.agent_id,
      skill_id: row.skill_id,
      name: row.skills_library?.name,
      category: row.skills_library?.category,
      content: row.skills_library?.content
    }))

    return NextResponse.json({ data: mapped })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { agent_id, name, category, content } = body

    if (!agent_id || !name || !content) {
      return NextResponse.json(
        { error: 'agent_id, name et content sont requis' },
        { status: 400 }
      )
    }

    const { data: skillData, error: skillError } = await supabase
      .from('skills_library')
      .insert({
        name,
        category: category || null,
        content,
        is_global: false
      })
      .select()
      .single()

    if (skillError) {
      return NextResponse.json(
        { error: skillError.message },
        { status: 400 }
      )
    }

    const { data: junctionData, error: junctionError } = await supabase
      .from('hq_agent_skills')
      .insert({
        agent_id,
        skill_id: skillData.id,
        is_active: true
      })
      .select()
      .single()

    if (junctionError) {
      return NextResponse.json(
        { error: junctionError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      data: {
        id: junctionData.id,
        is_active: junctionData.is_active,
        agent_id: junctionData.agent_id,
        skill_id: junctionData.skill_id,
        name: skillData.name,
        category: skillData.category,
        content: skillData.content
      }
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, is_active } = body

    if (!id || is_active === undefined) {
      return NextResponse.json(
        { error: 'id et is_active sont requis' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('hq_agent_skills')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id requis' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('hq_agent_skills')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
