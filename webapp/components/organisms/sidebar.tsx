"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import NavLink from "../molecules/NavLink";
import SignOutButton from "../atoms/SignOutButton";
import UserInfo from "../molecules/UserInfo";
import useWindowSize from "@/hooks/useWindowSize";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary";
  className?: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const Sidebar: React.FC<SidebarProps> = ({
  variant = "default",
  className,
  user,
  ...props
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isMobile, isTablet } = useWindowSize();

  const isSmallScreen = isMobile || isTablet;

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  return (
    <>
      {isSmallScreen && (
        <header className="fixed top-0 left-0 z-40 flex h-14 w-full items-center justify-between bg-[#222222] px-4 text-white">
          <Link href="/" className="text-lg font-bold">
            MarketMinute
          </Link>

          <button
            onClick={toggleMenu}
            className="text-white focus:outline-none"
            aria-label="Toggle sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </header>
      )}

      <aside
        className={cn(
          "fixed left-0 z-30 flex h-screen flex-col border-r border-slate-800 bg-[#222222] text-white transition-transform duration-300",
          isSmallScreen
            ? isMenuOpen
              ? "translate-x-0 w-64 pt-14"
              : "-translate-x-full w-64 pt-14"
            : "w-64 translate-x-0 pt-4",
          className
        )}
        {...props}
      >
        {!isSmallScreen && (
          <div className="mb-4 px-4 text-xl font-bold">
            <Link href="/">MarketMinute</Link>
          </div>
        )}

        {user && (
          <div className="mb-4 border-b border-slate-800 pb-4">
            <UserInfo name={user.name} email={user.email} image={user.image} />
          </div>
        )}

        <nav className="mt-2 flex flex-1 flex-col gap-4 px-3 text-md">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/watchlist">Watchlist</NavLink>
          <NavLink to="/explore">Explore</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>

        {user && (
          <div className="border-t border-slate-800 px-3 py-3">
            <SignOutButton />
          </div>
        )}

        <div className="border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
          Built for people who actually watch the market.
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
