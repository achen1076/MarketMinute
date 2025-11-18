"use client";

import { handleSignOut } from "@/app/actions/auth";

export default function SignOutButton() {
  return (
    <button
      onClick={() => handleSignOut()}
      className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 cursor-pointer"
    >
      Sign Out
    </button>
  );
}
