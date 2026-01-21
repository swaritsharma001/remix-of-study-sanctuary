import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
      .from("latest_notification")
      .select("title, body, icon, url")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching notification:", error);
      throw error;
    }

    return new Response(
      JSON.stringify(data || { title: "StudyX", body: "New content available", icon: "/notification-icon.png", url: "/" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Latest notification error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ title: "StudyX", body: "New content available", icon: "/notification-icon.png", url: "/" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
