"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  List,
  TrendingUp,
  MessageSquare,
  Settings,
  LineChart,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobileMenu } from "@/lib/mobile-menu-context";

type NavItem = {
  href: string;
  icon: typeof Home;
  label: string;
};

type Props = {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
};

export default function MobileBottomNav({ user }: Props) {
  const pathname = usePathname();
  const { isMenuOpen } = useMobileMenu();

  const navItems: NavItem[] = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/watchlist", icon: List, label: "Watchlists" },
    { href: "/forecasts", icon: TrendingUp, label: "Forecasts" },
    { href: "/quant", icon: LineChart, label: "Quant" },
    { href: "/sentinel", icon: Shield, label: "Sentinel" },
    { href: "/chat", icon: MessageSquare, label: "Chat" },
  ];

  if (user) {
    navItems.push({ href: "/settings", icon: Settings, label: "Settings" });
  }

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // Hide bottom nav when sidebar menu is open
  if (isMenuOpen) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-sidebar-border md:hidden">
      <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0 flex-1",
                active
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-[10px] font-medium truncate max-w-full">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
