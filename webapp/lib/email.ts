/**
 * Email Utility
 * Sends emails using Resend API
 *
 * Setup: Add RESEND_API_KEY to .env
 * Get free key at: https://resend.com
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("[Email] RESEND_API_KEY not configured");
    // In development, log email instead of failing
    if (process.env.NODE_ENV === "development") {
      console.log(`[Email] Would send to ${to}:`);
      console.log(`Subject: ${subject}`);
      console.log(`HTML: ${html}`);
      return { success: true, dev: true };
    }
    throw new Error("Email service not configured");
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "MarketMinute <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Email] Failed to send:", error);
      throw new Error(`Failed to send email: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[Email] Sent to ${to}: ${data.id}`);
    return { success: true, id: data.id };
  } catch (error) {
    console.error("[Email] Error:", error);
    throw error;
  }
}

export function getPasswordResetEmailHTML(resetUrl: string, userEmail: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #1e293b; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #14b8a6; font-size: 28px; font-weight: bold;">MarketMinute</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <h2 style="margin: 0 0 20px; color: #f1f5f9; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
              
              <p style="margin: 0 0 20px; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                We received a request to reset the password for your account associated with <strong style="color: #f1f5f9;">${userEmail}</strong>.
              </p>
              
              <p style="margin: 0 0 30px; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                Click the button below to reset your password. This link will expire in <strong>1 hour</strong>.
              </p>
              
              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0 0 30px;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #14b8a6; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 10px; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="margin: 0 0 30px; padding: 12px; background-color: #0f172a; border-radius: 4px; color: #64748b; font-size: 13px; word-break: break-all;">
                ${resetUrl}
              </p>
              
              <div style="padding: 20px 0; border-top: 1px solid #334155;">
                <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                  <strong>Didn't request this?</strong><br>
                  If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #0f172a; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                © ${new Date().getFullYear()} MarketMinute. Built for people who actually watch the market.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
