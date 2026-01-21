const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FeedbackNotificationRequest {
  name: string;
  email: string | null;
  message: string;
  rating: number;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, message, rating }: FeedbackNotificationRequest = await req.json();

    console.log("Sending feedback notification for:", { name, rating });

    // Generate star rating display
    const starRating = "★".repeat(rating) + "☆".repeat(5 - rating);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "StudyX <noreply@mintgram.live>",
        to: ["admin@mintgram.live"],
        subject: `New Feedback from ${name} - ${starRating}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #10b981 0%, #8b5cf6 100%); padding: 24px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 24px; }
              .content { padding: 24px; }
              .rating { font-size: 28px; color: #f59e0b; text-align: center; margin: 16px 0; letter-spacing: 4px; }
              .label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
              .value { font-size: 16px; color: #1f2937; margin-bottom: 16px; }
              .message-box { background: #f9fafb; border-radius: 8px; padding: 16px; border-left: 4px solid #8b5cf6; }
              .footer { background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📬 New Feedback Received</h1>
              </div>
              <div class="content">
                <div class="rating">${starRating}</div>
                
                <div class="label">From</div>
                <div class="value">${name}</div>
                
                <div class="label">Email</div>
                <div class="value">${email || "Not provided"}</div>
                
                <div class="label">Message</div>
                <div class="message-box">
                  <p style="margin: 0; white-space: pre-wrap;">${message}</p>
                </div>
              </div>
              <div class="footer">
                This feedback was submitted on StudyX at ${new Date().toLocaleString()}
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const responseData = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Resend API error:", responseData);
      throw new Error(responseData.message || "Failed to send email");
    }

    console.log("Feedback notification sent successfully:", responseData);

    return new Response(JSON.stringify({ success: true, id: responseData.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-feedback-notification function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
