const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FeedbackReplyRequest {
  feedbackId: string;
  userName: string;
  userEmail: string;
  originalMessage: string;
  originalRating: number;
  replyMessage: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { feedbackId, userName, userEmail, originalMessage, originalRating, replyMessage }: FeedbackReplyRequest = await req.json();

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "User did not provide an email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Sending feedback reply to:", userEmail);

    const starRating = "★".repeat(originalRating) + "☆".repeat(5 - originalRating);

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
        from: "StudyX <onboarding@resend.dev>",
        to: [userEmail],
        subject: `Re: Your Feedback to StudyX`,
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
              .greeting { font-size: 18px; color: #1f2937; margin-bottom: 16px; }
              .reply-box { background: #ecfdf5; border-radius: 8px; padding: 16px; border-left: 4px solid #10b981; margin-bottom: 24px; }
              .original-section { border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px; }
              .label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
              .original-box { background: #f9fafb; border-radius: 8px; padding: 12px; font-size: 14px; color: #6b7280; }
              .rating { color: #f59e0b; }
              .footer { background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📩 Response to Your Feedback</h1>
              </div>
              <div class="content">
                <p class="greeting">Hi ${userName},</p>
                <p style="color: #4b5563; margin-bottom: 16px;">Thank you for your feedback! Here's our response:</p>
                
                <div class="reply-box">
                  <p style="margin: 0; white-space: pre-wrap; color: #065f46;">${replyMessage}</p>
                </div>
                
                <div class="original-section">
                  <div class="label">Your Original Feedback <span class="rating">${starRating}</span></div>
                  <div class="original-box">
                    <p style="margin: 0; white-space: pre-wrap;">${originalMessage}</p>
                  </div>
                </div>
              </div>
              <div class="footer">
                <p style="margin: 0;">Thank you for helping us improve StudyX!</p>
                <p style="margin: 8px 0 0;">— The StudyX Team</p>
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

    console.log("Feedback reply sent successfully:", responseData);

    return new Response(JSON.stringify({ success: true, id: responseData.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-feedback-reply function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
