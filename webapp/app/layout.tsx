import type { ReactNode } from "react";
import "./globals.css";
import Sidebar from "@/components/organisms/sidebar";
import { MarketTicker } from "@/components/organisms/MarketTicker";
import { auth } from "@/auth";
import { COLORS } from "@/lib/colors";

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
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
