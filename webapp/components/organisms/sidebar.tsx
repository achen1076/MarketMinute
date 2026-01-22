"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@shared/lib/utils";
import NavLink from "../molecules/NavLink";
import SignOutButton from "../atoms/SignOutButton";
import UserInfo from "../molecules/UserInfo";
import useWindowSize from "@/hooks/useWindowSize";
import { useMobileMenu } from "@shared/lib/mobile-menu-context";
import Image from "next/image";

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
  const { isMenuOpen, toggleMenu, closeMenu } = useMobileMenu();
  const { isMobile } = useWindowSize();

  return (
    <>
      {/* Mobile overlay - click outside to close */}
      {isMobile && isMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {isMobile && (
        <header className="fixed top-[30px] left-0 z-40 flex h-14 w-full items-center justify-between px-4 bg-sidebar text-sidebar-foreground">
          <div className="flex items-center">
            <Link href="/">
              <Image
                src="/favicon.svg"
                alt="Mintalyze"
                width={32}
                height={32}
              />
            </Link>
            <Link href="/" className="text-xl font-bold -ms-0.5">
              intalyze
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMenu}
              className="text-sidebar-foreground focus:outline-none"
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
          </div>
        </header>
      )}

      <aside
        className={cn(
          "fixed left-0 z-30 flex h-screen flex-col border-r border-sidebar-border transition-transform duration-300 bg-sidebar text-sidebar-foreground",
          isMobile
            ? isMenuOpen
              ? "translate-x-0 w-64 pt-[97px]"
              : "-translate-x-full w-64 pt-[97px]"
            : "w-64 translate-x-0 pt-[49px]",
          className
        )}
        {...props}
      >
        {!isMobile && (
          <div
            className={cn(
              "mb-4 px-4",
              user ? "" : "border-b-2 border-sidebar-border pb-4"
            )}
          >
            <div className="flex items-center">
              <Link href="/">
                <Image
                  src="/favicon.svg"
                  alt="Mintalyze"
                  width={32}
                  height={32}
                />
              </Link>
              <Link href="/" className="text-xl font-bold -ms-0.5">
                intalyze
              </Link>
            </div>
          </div>
        )}

        {user && (
          <div className="mb-4 border-b border-sidebar-border pb-4">
            <UserInfo name={user.name} email={user.email} image={user.image} />
          </div>
        )}

        <nav className="mt-2 flex flex-1 flex-col gap-4 px-3 text-md">
          <NavLink to="/" onClick={closeMenu}>
            Home
          </NavLink>

          <NavLink to="/forecasts" onClick={closeMenu}>
            Market Forecasts
          </NavLink>
          <NavLink to="/quant" onClick={closeMenu}>
            Quant Lab
          </NavLink>
          <NavLink to="/sentinel" onClick={closeMenu}>
            Sentinel Dashboard
          </NavLink>
          <NavLink to="/chat" onClick={closeMenu}>
            Mintalyze Chat
          </NavLink>
          {user && (
            <>
              <NavLink to="/stock" onClick={closeMenu}>
                Stock Search
              </NavLink>
              <NavLink to="/watchlist" onClick={closeMenu}>
                Watchlists
              </NavLink>
              <NavLink to="/settings" onClick={closeMenu}>
                Settings
              </NavLink>
            </>
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
        <div className="border-t border-sidebar-border px-3 py-3">
          {user ? (
            <SignOutButton size="full" />
          ) : (
            <NavLink to="/signin" onClick={closeMenu}>
              Sign In / Sign Up
            </NavLink>
          )}
        </div>

        <div className="border-t border-sidebar-border px-4 py-3 text-xs text-muted-foreground">
          Built for people who want to watch the market, but dont have the time.
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
