import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Security Middleware
 *
 * Provides CSRF protection and origin validation for API routes
 */
export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Skip for safe HTTP methods (GET, HEAD, OPTIONS)
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(request.method)) {
    return NextResponse.next();
  }

  // Skip CSRF check for cron endpoints (they use Bearer token auth)
  if (request.nextUrl.pathname.startsWith("/api/cron/")) {
    return NextResponse.next();
  }

  // CSRF Protection: Verify origin header matches host
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin) {
    // Allow requests without origin (e.g., from server-side, Postman, curl)
    // In production, you might want to be stricter
    return NextResponse.next();
  }

  // Extract hostname from origin (remove protocol and port)
  const originHost = new URL(origin).host;

  if (originHost !== host) {
    console.warn(
      `[Security] CSRF attempt blocked: origin=${origin}, host=${host}`
    );
    return new NextResponse(
      JSON.stringify({
        error: "Invalid origin",
        message: "Cross-site request blocked for security",
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Additional security headers
  const response = NextResponse.next();

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Enable browser XSS protection
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
