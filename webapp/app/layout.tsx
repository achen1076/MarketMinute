import type { ReactNode } from "react";
import "./globals.css";
import Sidebar from "@/components/organisms/sidebar";
import { MarketTicker } from "@/components/organisms/MarketTicker";
import { auth } from "@/auth";
import { COLORS } from "@/lib/colors";
import { Analytics } from "@vercel/analytics/next";
import EmailVerificationBanner from "@/components/organisms/EmailVerificationBanner";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "MarketMinute",
  description: "Your automated one-minute view of the markets.",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  // Check if user needs email verification
  let needsVerification = false;
  let userEmail = "";

  if (session?.user?.email) {
    // Always fetch fresh data from database to check verification status
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { emailVerified: true, email: true },
    });

    if (user && !user.emailVerified) {
      needsVerification = true;
      userEmail = user.email!;
    }
  }

  return (
    <html lang="en">
      <body
        className="min-h-screen"
        style={{ backgroundColor: COLORS.bg.body, color: COLORS.text.main }}
      >
        {/* Sidebar handles its own responsive behavior */}
        <Sidebar user={session?.user} />

        {/* Main content area */}
        <div className="min-h-screen">
          <div className="md:ml-64">
            <MarketTicker />
          </div>
          <main className="mx-auto max-w-[1800px] px-4 py-6 pt-20 md:ml-64 md:pt-8 md:px-8">
            {/* Email Verification Banner */}
            {needsVerification && (
              <div className="mb-6">
                <EmailVerificationBanner userEmail={userEmail} />
              </div>
            )}
            {children}
          </main>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
