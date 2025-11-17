// app/layout.tsx
import type { ReactNode } from "react";
import "./globals.css";
import Sidebar from "@/components/organisms/sidebar";
import { auth } from "@/auth";

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
      <body className="min-h-screen bg-slate-950 text-slate-100">
        {/* Sidebar handles its own responsive behavior */}
        <Sidebar user={session?.user} />

        {/* Main content area */}
        <div className="min-h-screen bg-slate-950 text-slate-100">
          {/* 
            On desktop we need left padding (because sidebar is 64px wide),
            on mobile we need top padding (because of the fixed top bar).
          */}
          <main className="mx-auto max-w-[1800px] px-4 py-6 pt-20 md:ml-64 md:pt-8 md:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
