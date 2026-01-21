const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type EmailTemplate = "welcome" | "announcement" | "reminder" | "achievement" | "weekly-digest";

interface EmailRequest {
  to: string;
  template: EmailTemplate;
  data: Record<string, string | number | undefined>;
}

const getEmailSubject = (template: EmailTemplate, data: Record<string, string | number | undefined>): string => {
  switch (template) {
    case "welcome":
      return "Welcome to StudyX! 🎉";
    case "announcement":
      return `📢 ${data.title || "New Announcement from StudyX"}`;
    case "reminder":
      return `⏰ Reminder: ${data.title || "Continue your learning journey"}`;
    case "achievement":
      return `🏆 Congratulations! You earned: ${data.achievementName || "New Achievement"}`;
    case "weekly-digest":
      return "📊 Your Weekly Study Summary";
    default:
      return "Message from StudyX";
  }
};

const getWelcomeTemplate = (data: Record<string, string | number | undefined>): string => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 24px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 32px; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px; }
    .content { padding: 32px 24px; }
    .greeting { font-size: 20px; color: #1f2937; margin-bottom: 16px; }
    .text { color: #4b5563; line-height: 1.6; margin-bottom: 24px; }
    .features { background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .feature { display: flex; align-items: center; margin-bottom: 12px; }
    .feature:last-child { margin-bottom: 0; }
    .feature-icon { width: 32px; height: 32px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 16px; }
    .feature-text { color: #065f46; font-weight: 500; }
    .cta { display: block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; text-align: center; font-weight: 600; font-size: 16px; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to StudyX! 🎓</h1>
      <p>Your learning journey starts here</p>
    </div>
    <div class="content">
      <p class="greeting">Hi ${data.userName || "there"},</p>
      <p class="text">We're thrilled to have you join the StudyX community! You've just taken the first step towards mastering your studies.</p>
      
      <div class="features">
        <div class="feature">
          <div class="feature-icon">📚</div>
          <span class="feature-text">Access video lectures anytime, anywhere</span>
        </div>
        <div class="feature">
          <div class="feature-icon">📝</div>
          <span class="feature-text">Take notes while watching lectures</span>
        </div>
        <div class="feature">
          <div class="feature-icon">🧠</div>
          <span class="feature-text">Test your knowledge with quizzes</span>
        </div>
        <div class="feature">
          <div class="feature-icon">📊</div>
          <span class="feature-text">Track your progress over time</span>
        </div>
      </div>
      
      <p class="text">Ready to start learning? Jump right in and explore our courses!</p>
      
      <a href="${data.appUrl || "https://mintgram.live"}" class="cta">Start Learning Now →</a>
    </div>
    <div class="footer">
      <p style="margin: 0;">© ${new Date().getFullYear()} StudyX. Happy Learning!</p>
    </div>
  </div>
</body>
</html>
`;

const getAnnouncementTemplate = (data: Record<string, string | number | undefined>): string => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
    .content { padding: 32px 24px; }
    .title { font-size: 24px; color: #1f2937; margin-bottom: 16px; font-weight: 700; }
    .message { color: #4b5563; line-height: 1.7; font-size: 16px; white-space: pre-wrap; }
    .cta { display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin-top: 24px; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">📢 ANNOUNCEMENT</div>
      <h1>${data.title || "Important Update"}</h1>
    </div>
    <div class="content">
      <div class="message">${data.message || ""}</div>
      ${data.ctaUrl ? `<a href="${data.ctaUrl}" class="cta">${data.ctaText || "Learn More"} →</a>` : ""}
    </div>
    <div class="footer">
      <p style="margin: 0;">© ${new Date().getFullYear()} StudyX</p>
    </div>
  </div>
</body>
</html>
`;

const getReminderTemplate = (data: Record<string, string | number | undefined>): string => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .clock { font-size: 48px; margin-bottom: 12px; }
    .content { padding: 32px 24px; }
    .greeting { font-size: 18px; color: #1f2937; margin-bottom: 16px; }
    .reminder-box { background: #fffbeb; border-radius: 12px; padding: 20px; border-left: 4px solid #f59e0b; margin-bottom: 24px; }
    .reminder-title { font-weight: 600; color: #92400e; font-size: 18px; margin-bottom: 8px; }
    .reminder-text { color: #78350f; line-height: 1.6; }
    .cta { display: block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; text-align: center; font-weight: 600; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="clock">⏰</div>
      <h1>Friendly Reminder</h1>
    </div>
    <div class="content">
      <p class="greeting">Hey ${data.userName || "there"}!</p>
      
      <div class="reminder-box">
        <div class="reminder-title">${data.title || "Don't forget!"}</div>
        <div class="reminder-text">${data.message || "It's been a while since your last study session. Jump back in and continue your learning journey!"}</div>
      </div>
      
      <a href="${data.appUrl || "https://mintgram.live"}" class="cta">Continue Learning →</a>
    </div>
    <div class="footer">
      <p style="margin: 0;">© ${new Date().getFullYear()} StudyX</p>
    </div>
  </div>
</body>
</html>
`;

const getAchievementTemplate = (data: Record<string, string | number | undefined>): string => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ea580c 100%); padding: 40px 24px; text-align: center; }
    .trophy { font-size: 64px; margin-bottom: 12px; }
    .header h1 { color: white; margin: 0; font-size: 28px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .content { padding: 32px 24px; text-align: center; }
    .congrats { font-size: 20px; color: #1f2937; margin-bottom: 24px; }
    .achievement-card { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 2px solid #f59e0b; }
    .achievement-name { font-size: 24px; font-weight: 700; color: #92400e; margin-bottom: 8px; }
    .achievement-desc { color: #78350f; font-size: 16px; }
    .stats { display: flex; justify-content: center; gap: 32px; margin-bottom: 24px; }
    .stat { text-align: center; }
    .stat-value { font-size: 28px; font-weight: 700; color: #10b981; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    .cta { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="trophy">🏆</div>
      <h1>Achievement Unlocked!</h1>
    </div>
    <div class="content">
      <p class="congrats">Congratulations, ${data.userName || "Champion"}!</p>
      
      <div class="achievement-card">
        <div class="achievement-name">${data.achievementName || "New Achievement"}</div>
        <div class="achievement-desc">${data.achievementDesc || "You've reached a new milestone!"}</div>
      </div>
      
      ${data.totalAchievements ? `
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${data.totalAchievements}</div>
          <div class="stat-label">Total Achievements</div>
        </div>
      </div>
      ` : ""}
      
      <a href="${data.appUrl || "https://mintgram.live"}" class="cta">View All Achievements →</a>
    </div>
    <div class="footer">
      <p style="margin: 0;">Keep up the amazing work! 🌟</p>
    </div>
  </div>
</body>
</html>
`;

const getWeeklyDigestTemplate = (data: Record<string, string | number | undefined>): string => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; }
    .content { padding: 32px 24px; }
    .greeting { font-size: 18px; color: #1f2937; margin-bottom: 24px; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: #f0f9ff; border-radius: 12px; padding: 20px; text-align: center; }
    .stat-icon { font-size: 28px; margin-bottom: 8px; }
    .stat-value { font-size: 32px; font-weight: 700; color: #1e40af; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-top: 4px; }
    .highlight { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center; }
    .highlight-text { color: #1e40af; font-size: 16px; font-weight: 500; }
    .cta { display: block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; text-align: center; font-weight: 600; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Your Weekly Summary</h1>
      <p>${data.weekRange || "This Week"}</p>
    </div>
    <div class="content">
      <p class="greeting">Hi ${data.userName || "there"}, here's how you did this week!</p>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-value">${data.studyMinutes || 0}</div>
          <div class="stat-label">Minutes Studied</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-value">${data.lecturesWatched || 0}</div>
          <div class="stat-label">Lectures Watched</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-value">${data.quizzesCompleted || 0}</div>
          <div class="stat-label">Quizzes Completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-value">${data.streakDays || 0}</div>
          <div class="stat-label">Day Streak</div>
        </div>
      </div>
      
      <div class="highlight">
        <div class="highlight-text">💪 ${data.motivationalMessage || "Keep up the great work! Consistency is key to success."}</div>
      </div>
      
      <a href="${data.appUrl || "https://mintgram.live"}" class="cta">Continue Learning →</a>
    </div>
    <div class="footer">
      <p style="margin: 0;">© ${new Date().getFullYear()} StudyX. See you next week!</p>
    </div>
  </div>
</body>
</html>
`;

const getEmailHtml = (template: EmailTemplate, data: Record<string, string | number | undefined>): string => {
  switch (template) {
    case "welcome":
      return getWelcomeTemplate(data);
    case "announcement":
      return getAnnouncementTemplate(data);
    case "reminder":
      return getReminderTemplate(data);
    case "achievement":
      return getAchievementTemplate(data);
    case "weekly-digest":
      return getWeeklyDigestTemplate(data);
    default:
      return getAnnouncementTemplate(data);
  }
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, template, data }: EmailRequest = await req.json();

    if (!to || !template) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, template" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending ${template} email to:`, to);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const subject = getEmailSubject(template, data);
    const html = getEmailHtml(template, data);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "StudyX <noreply@mintgram.live>",
        to: [to],
        subject,
        html,
      }),
    });

    const responseData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", responseData);
      throw new Error(responseData.message || "Failed to send email");
    }

    console.log(`${template} email sent successfully:`, responseData);

    return new Response(JSON.stringify({ success: true, id: responseData.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-email function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
