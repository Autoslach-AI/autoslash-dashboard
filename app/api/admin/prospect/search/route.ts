import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';

  const { data: prospect } = await supabase
    .from('enterprises')
    .select('*')
    .or(`project_id.ilike.%${q}%,name.ilike.%${q}%,email.ilike.%${q}%`)
    .eq('status', 'PROSPECT')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!prospect) {
    return NextResponse.json({ prospect: null });
  }

  return NextResponse.json({ prospect });
}
