import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const revalidate = 30;

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Fetch all tasks from last 30 days
  const { data: tasks, error } = await supabase
    .from('agent_tasks')
    .select('api_used, started_at')
    .gte('started_at', thirtyDaysAgo.toISOString())

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 1. Get dynamic API keys
  const apiKeys = Array.from(new Set(tasks.map(t => t.api_used).filter(Boolean))) as string[]

  // 2. Prepare daily data
  const dailyMap: { [date: string]: any } = {}
  const totals: { [api: string]: number } = {}

  // Initialize totals
  apiKeys.forEach(k => totals[k] = 0)

  tasks.forEach(task => {
    if (!task.api_used || !task.started_at) return
    
    const date = task.started_at.split('T')[0]
    if (!dailyMap[date]) {
      dailyMap[date] = { date } as any
      apiKeys.forEach(k => dailyMap[date][k] = 0)
    }
    
    dailyMap[date][task.api_used] = (dailyMap[date][task.api_used] || 0) + 1
    totals[task.api_used] = (totals[task.api_used] || 0) + 1
  })

  // Sort daily data by date
  const dailyData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))

  // Find most used
  let mostUsed = ''
  let maxCount = -1
  apiKeys.forEach(k => {
    if (totals[k] > maxCount) {
      maxCount = totals[k]
      mostUsed = k
    }
  })

  return NextResponse.json({
    apiKeys,
    dailyData,
    totals,
    mostUsed
  })
}
