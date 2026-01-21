import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const parseBrowser = (userAgent: string | null): string => {
  if (!userAgent) return 'Unknown';
  
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
  
  return 'Other';
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all subscriptions
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("created_at, user_agent");

    if (error) {
      console.error("Error fetching subscriptions:", error);
      throw error;
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate stats
    const total = subscriptions?.length || 0;
    const last24h = subscriptions?.filter(s => new Date(s.created_at) > oneDayAgo).length || 0;
    const last7d = subscriptions?.filter(s => new Date(s.created_at) > sevenDaysAgo).length || 0;
    const last30d = subscriptions?.filter(s => new Date(s.created_at) > thirtyDaysAgo).length || 0;

    // Group by browser
    const browserCounts: Record<string, number> = {};
    subscriptions?.forEach(s => {
      const browser = parseBrowser(s.user_agent);
      browserCounts[browser] = (browserCounts[browser] || 0) + 1;
    });

    const byBrowser = Object.entries(browserCounts)
      .map(([browser, count]) => ({ browser, count }))
      .sort((a, b) => b.count - a.count);

    console.log(`Subscription stats: ${total} total, ${last24h} last 24h`);

    return new Response(
      JSON.stringify({
        total,
        last24h,
        last7d,
        last30d,
        byBrowser,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Get subscription stats error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
