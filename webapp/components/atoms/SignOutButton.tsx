"use client";

import { handleSignOut } from "@/app/actions/auth";
import cn from "clsx";

type SignOutButtonProps = {
  variant?: "default" | "red";
  size?: "sm" | "md" | "lg" | "full";
  className?: string;
};

export default function SignOutButton({
  variant = "default",
  size = "md",
  className,
}: SignOutButtonProps) {
  return (
    <button
      onClick={() => handleSignOut()}
      className={cn(
        "rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer",
        size === "sm" && "px-2 py-1 text-xs",
        size === "md" && "px-5 py-2 text-sm",
        size === "lg" && "px-15 py-3 text-base",
        size === "full" && "w-full",
        variant === "red"
          ? "bg-red-600 text-white hover:bg-red-700"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
    >
      Sign Out
    </button>
  );
}
