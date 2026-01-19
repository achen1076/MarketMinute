"use client";

import Image from "next/image";

type UserInfoProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export default function UserInfo({ name, email, image }: UserInfoProps) {
  const displayName = name || email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="relative h-8 w-8 shrink-0">
        {image ? (
          <Image
            src={image}
            alt={displayName}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-foreground/50">
            {initials}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm font-medium text-foreground">
          {displayName}
        </p>
        {email && (
          <p className="truncate text-xs text-foreground/50">{email}</p>
        )}
      </div>
    </div>
  );
}
