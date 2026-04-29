import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const revalidate = 30;

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Fetch enterprises
    const { data: enterprises, error: entError } = await supabaseAdmin
      .from('enterprises')
      .select(`
        id, 
        name, 
        sector, 
        package_type, 
        token_budget, 
        total_tokens_consumed, 
        status, 
        comm_mode, 
        last_event_text, 
        last_event_at, 
        region, 
        monthly_cost
      `);

    if (entError) throw entError;

    // 2. Fetch extra data for intelligence computing
    // Last log system_logs for each
    const { data: systemLogs } = await supabaseAdmin
      .from('system_logs')
      .select('enterprise_id, status_color, created_at')
      .order('created_at', { ascending: false });

    // Last log admin_intelligence_logs for each
    const { data: intelLogs } = await supabaseAdmin
      .from('admin_intelligence_logs')
      .select('enterprise_id, message, severity_level, created_at')
      .order('created_at', { ascending: false });

    // Unread messages count
    const { data: unreadCounts } = await supabaseAdmin
      .from('client_messages')
      .select('enterprise_id, is_read')
      .eq('is_read', false);

    const processedClients = (enterprises || []).map(ent => {
      const id = ent.id;
      
      // Get last system log
      const lastSystemLog = systemLogs?.find(l => l.enterprise_id === id);
      
      // Get unread messages count
      const unreadCount = unreadCounts?.filter(m => m.enterprise_id === id).length || 0;
      
      // Calculate token usage percent
      const tokenUsagePercent = ent.token_budget > 0 
        ? Math.round((ent.total_tokens_consumed / ent.token_budget) * 100) 
        : 0;

      // Compute Intelligence
      let intelligenceType = 'STABLE';
      let intelligenceSeverity = null;
      let intelligenceMessage = 'Système optimal';
      let intelligenceSourceUrl = `/admin/system/${id}`;
      let intelligenceCreatedAt = ent.last_event_at;

      if (lastSystemLog?.status_color === 'red') {
        intelligenceType = 'SYSTEM_ERROR';
        intelligenceSeverity = 'CRITICAL';
        intelligenceMessage = 'Erreur système critique détectée';
        intelligenceSourceUrl = `/admin/system/${id}/agents`;
        intelligenceCreatedAt = lastSystemLog.created_at;
      } else if (tokenUsagePercent > 80) {
        intelligenceType = 'TOKEN_WARNING';
        intelligenceSeverity = 'WARNING';
        intelligenceMessage = `Client à ${tokenUsagePercent}% de son budget tokens`;
        intelligenceSourceUrl = `/admin/system/${id}/settings`;
        intelligenceCreatedAt = new Date().toISOString(); // Default to now if no specific log
      } else if (unreadCount > 0) {
        intelligenceType = 'MESSAGE';
        intelligenceSeverity = 'INFO';
        intelligenceMessage = `${unreadCount} message(s) non lu(s)`;
        intelligenceSourceUrl = `/admin/system/${id}/messages`;
        intelligenceCreatedAt = new Date().toISOString(); 
      }

      return {
        ...ent,
        token_usage_percent: tokenUsagePercent,
        unread_messages: unreadCount,
        intelligence: {
          type: intelligenceType,
          severity: intelligenceSeverity,
          message: intelligenceMessage,
          source_url: intelligenceSourceUrl,
          created_at: intelligenceCreatedAt
        }
      };
    });

    // Sort by severity: CRITICAL -> WARNING -> STABLE
    const severityOrder: Record<string, number> = {
      'CRITICAL': 0,
      'WARNING': 1,
      'INFO': 2,
      null: 3
    };

    processedClients.sort((a, b) => {
      const sevA = a.intelligence.severity as string | null;
      const sevB = b.intelligence.severity as string | null;
      return (severityOrder[sevA as any] ?? 3) - (severityOrder[sevB as any] ?? 3);
    });

    // Dynamically generate regions and plans
    const regions = Array.from(new Set(enterprises?.map(e => e.region).filter(Boolean)));
    const plans = ["STARTUP", "BUSINESS", "ENTERPRISE", "ELITE"];

    return NextResponse.json({
      clients: processedClients,
      availablePlans: plans,
      availableRegions: regions,
      total: processedClients.length
    });

  } catch (error: any) {
    console.error("FLEET_API_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
