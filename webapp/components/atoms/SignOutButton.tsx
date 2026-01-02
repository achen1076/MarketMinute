"use client";

import { handleSignOut } from "@/app/actions/auth";

export default function SignOutButton() {
  return (
    <button
      onClick={() => handleSignOut()}
      className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
    >
      Sign Out
    </button>
  );
}
