import { NextResponse } from "next/server";
import { sendEmail, getSupportEmailHTML } from "@/lib/email";

const SUPPORT_EMAIL = "marketminuteapp@gmail.com";

interface SupportRequest {
  category: "support" | "feedback";
  email: string;
  subject: string;
  message: string;
}

// Rate limiting: Track submissions per email
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3; // Max 3 submissions
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of rateLimitMap.entries()) {
    if (now > data.resetAt) {
      rateLimitMap.delete(email);
    }
  }
}, 10 * 60 * 1000);

function checkRateLimit(email: string): {
  allowed: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  const record = rateLimitMap.get(email);

  if (!record || now > record.resetAt) {
    // First request or window expired - allow and set new window
    rateLimitMap.set(email, { count: 1, resetAt: now + RATE_WINDOW });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment count
  record.count++;
  return { allowed: true };
}

export async function POST(request: Request) {
  try {
    const body: SupportRequest = await request.json();
    const { category, email, subject, message } = body;

    // Validate required fields
    if (!category || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Check rate limit
    const rateCheck = checkRateLimit(email);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many requests. Please try again in ${Math.ceil(
            (rateCheck.retryAfter || 0) / 60
          )} minutes.`,
          retryAfter: rateCheck.retryAfter,
        },
        { status: 429 }
      );
    }

    // Generate email HTML
    const html = getSupportEmailHTML(email, subject, message);

    // Send email to support inbox with category in subject
    const categoryLabel = category === "support" ? "Support" : "Feedback";
    await sendEmail({
      to: SUPPORT_EMAIL,
      subject: `[${categoryLabel}] ${subject}`,
      html,
    });

    return NextResponse.json({
      success: true,
      message: "Support request sent successfully",
    });
  } catch (error) {
    console.error("[Support] Error sending support email:", error);
    return NextResponse.json(
      { error: "Failed to send support request" },
      { status: 500 }
    );
  }
}
