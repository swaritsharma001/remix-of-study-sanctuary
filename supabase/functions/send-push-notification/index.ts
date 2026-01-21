import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReqBody = {
  title?: string;
  body?: string;
  icon?: string;
  url?: string;
  endpoint?: string;
};

function base64UrlToBytes(input: string): Uint8Array {
  const padding = "=".repeat((4 - (input.length % 4)) % 4);
  const base64 = (input + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  const b64 = btoa(String.fromCharCode(...bytes));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function importVapidSigningKey(vapidPublicKeyB64Url: string, vapidPrivateKeyB64Url: string) {
  // VAPID public key is the uncompressed P-256 point: 65 bytes => 0x04 || X(32) || Y(32)
  const pub = base64UrlToBytes(vapidPublicKeyB64Url);
  if (pub.length !== 65 || pub[0] !== 0x04) {
    throw new Error("Invalid VAPID public key format");
  }

  const x = pub.slice(1, 33);
  const y = pub.slice(33, 65);

  const jwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x: bytesToBase64Url(x),
    y: bytesToBase64Url(y),
    d: vapidPrivateKeyB64Url,
    key_ops: ["sign"],
    ext: true,
  };

  return await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
}

function encodeJwtPart(obj: unknown): string {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(obj)));
}

async function forgeVapidJwt(params: {
  endpoint: string;
  subject: string;
  signingKey: CryptoKey;
}) {
  const header = { alg: "ES256", typ: "JWT" };
  const aud = new URL(params.endpoint).origin;

  const payload = {
    aud,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: params.subject,
  };

  const unsigned = `${encodeJwtPart(header)}.${encodeJwtPart(payload)}`;
  const sigBuf = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    params.signingKey,
    new TextEncoder().encode(unsigned),
  );

  return `${unsigned}.${bytesToBase64Url(new Uint8Array(sigBuf))}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, body, icon, url, endpoint }: ReqBody = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID keys not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Save the notification content to database for service worker to fetch
    const notificationData = {
      title: title || "StudyX",
      body: body || "New content available",
      icon: icon || "/notification-icon.png",
      url: url || "/",
      updated_at: new Date().toISOString(),
    };

    console.log("[PUSH] Saving notification to database:", notificationData);

    const { error: upsertError } = await supabase
      .from("latest_notification")
      .upsert({ id: 1, ...notificationData });

    if (upsertError) {
      console.error("Error saving notification:", upsertError);
      // Continue anyway - service worker will use fallback
    } else {
      console.log("[PUSH] ✅ Notification saved to database");
    }

    // NOTE: Lovable Cloud edge runtime does not support WebCrypto ECDH,
    // so payload encryption (RFC8291) isn't available. We send an *empty* push.
    // The service worker will still fire the `push` event and fetch the saved message.

    const baseQuery = supabase
      .from("push_subscriptions")
      .select("endpoint");

    const { data: subscriptions, error: subErr } = endpoint
      ? await baseQuery.eq("endpoint", endpoint)
      : await baseQuery;

    if (subErr) {
      console.error("Error fetching subscriptions:", subErr);
      throw subErr;
    }

    console.log(`Sending push ping to ${subscriptions?.length || 0} subscribers`);

    const signingKey = await importVapidSigningKey(vapidPublicKey, vapidPrivateKey);

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions || []) {
      try {
        console.log(`[PUSH] Sending to endpoint: ${sub.endpoint.substring(0, 80)}...`);
        
        const jwt = await forgeVapidJwt({
          endpoint: sub.endpoint,
          subject: "mailto:admin@studyx.app",
          signingKey,
        });

        // IMPORTANT: Empty body => no encryption needed.
        // FCM requires specific header format for VAPID
        const headers: Record<string, string> = {
          TTL: "86400",
          Urgency: "high",
        };

        // FCM uses different auth header format than other push services
        if (sub.endpoint.includes("fcm.googleapis.com") || sub.endpoint.includes("firebase")) {
          // FCM format: Authorization: vapid t=<jwt>, k=<publicKey>
          headers["Authorization"] = `vapid t=${jwt}, k=${vapidPublicKey}`;
        } else {
          // Standard WebPush format for other services
          headers["Authorization"] = `WebPush ${jwt}`;
          headers["Crypto-Key"] = `p256ecdsa=${vapidPublicKey}`;
        }

        console.log(`[PUSH] Using auth format: ${sub.endpoint.includes("fcm") ? "FCM vapid" : "WebPush"}`);

        const res = await fetch(sub.endpoint, {
          method: "POST",
          headers,
        });

        const responseText = await res.text();
        console.log(`[PUSH] Response: ${res.status} ${res.statusText} - Body: ${responseText.substring(0, 200)}`);

        if (res.ok) {
          sent++;
          console.log(`[PUSH] ✅ Successfully sent to endpoint`);
        } else {
          failed++;
          console.error(`[PUSH] ❌ Push service rejected: ${res.status} ${res.statusText}`);
          console.error(`[PUSH] Response headers:`, Object.fromEntries(res.headers.entries()));
          
          // 404/410 => subscription is gone, clean up
          if (res.status === 404 || res.status === 410) {
            console.log(`[PUSH] Removing stale subscription`);
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          }
        }
      } catch (e) {
        failed++;
        console.error("[PUSH] Error sending push:", e);
      }
    }

    console.log(`Push results: ${sent} sent, ${failed} failed`);

    // Return the message we *intended* to send (for UI debugging)
    return new Response(
      JSON.stringify({
        success: true,
        sent,
        failed,
        total: subscriptions?.length || 0,
        debug_message: { title, body, icon, url },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Send push error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

