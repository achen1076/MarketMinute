"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import NavLink from "../molecules/NavLink";
import SignOutButton from "../atoms/SignOutButton";
import UserInfo from "../molecules/UserInfo";
import useWindowSize from "@/hooks/useWindowSize";
import { COLORS } from "@/lib/colors";

const SIDEBAR_BG_COLOR = COLORS.bg.elevated;

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
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      {/* Mobile overlay - click outside to close */}
      {isSmallScreen && isMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {isSmallScreen && (
        <header
          className="fixed top-0 left-0 z-40 flex h-14 w-full items-center justify-between px-4"
          style={{ backgroundColor: SIDEBAR_BG_COLOR, color: COLORS.text.main }}
        >
          <Link href="/" className="text-lg font-bold" onClick={closeMenu}>
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
          "fixed left-0 z-30 flex h-screen flex-col border-r transition-transform duration-300",
          isSmallScreen
            ? isMenuOpen
              ? "translate-x-0 w-64 pt-14"
              : "-translate-x-full w-64 pt-14"
            : "w-64 translate-x-0 pt-4",
          className
        )}
        style={{
          backgroundColor: SIDEBAR_BG_COLOR,
          borderColor: COLORS.border.subtle,
          color: COLORS.text.main,
        }}
        {...props}
      >
        {!isSmallScreen && (
          <div className="mb-4 px-4 text-xl font-bold">
            <Link href="/">MarketMinute</Link>
          </div>
        )}

        {user && (
          <div
            className="mb-4 border-b pb-4"
            style={{ borderColor: COLORS.border.subtle }}
          >
            <UserInfo name={user.name} email={user.email} image={user.image} />
          </div>
        )}

        <nav className="mt-2 flex flex-1 flex-col gap-4 px-3 text-md">
          <NavLink to="/" onClick={closeMenu}>
            Home
          </NavLink>
          <NavLink to="/watchlist" onClick={closeMenu}>
            Watchlist
          </NavLink>
          <NavLink to="/quant" onClick={closeMenu}>
            Quant Lab
          </NavLink>
          <NavLink to="/forecasts" onClick={closeMenu}>
            Market Forecasts
          </NavLink>
          <NavLink to="/sentinel" onClick={closeMenu}>
            Sentinel Dashboard
          </NavLink>
          <NavLink to="/history" onClick={closeMenu}>
            History
          </NavLink>
          <NavLink to="/about" onClick={closeMenu}>
            About
          </NavLink>
          {user && (
            <NavLink to="/settings" onClick={closeMenu}>
              Settings
            </NavLink>
          )}
          {user &&
            process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",").includes(
              user.email || ""
            ) && (
              <NavLink to="/admin" onClick={closeMenu}>
                Admin
              </NavLink>
            )}
        </nav>
        <div
          className="border-t px-3 py-3"
          style={{ borderColor: COLORS.border.subtle }}
        >
          {user ? (
            <SignOutButton />
          ) : (
            <NavLink to="/signin" onClick={closeMenu}>
              Sign In
            </NavLink>
          )}
        </div>

        <div
          className="border-t px-4 py-3 text-xs"
          style={{ borderColor: COLORS.border.subtle, color: COLORS.text.soft }}
        >
          Built for people who actually watch the market.
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
