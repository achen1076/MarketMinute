"use client";

import type { MouseEvent, HTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavLinkProps extends HTMLAttributes<HTMLAnchorElement> {
  to: string;
  variant?: "web" | "mobile";
  children: ReactNode;
}

const NavLink = ({
  className,
  children,
  to,
  variant = "web",
  ...props
}: NavLinkProps) => {
  const pathname = usePathname();
  const isHashLink = to.startsWith("#");

  const isActive = !isHashLink && pathname === to;

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (isHashLink) {
      e.preventDefault();
      const element = document.querySelector(to);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }

    if (props.onClick) {
      props.onClick(e);
    }
  };

  const commonClasses = cn(
    "px-2 py-1 font-semibold transition-all duration-300 ease-in-out inline-block",
    isActive ? "text-amber-400" : "text-foreground/50 hover:text-amber-400",
    className
  );

  const underlineClasses = cn(
    "relative inline-block after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-amber-400 after:transition-all after:duration-300 after:ease-in-out hover:after:w-full",
    isActive && "after:w-full"
  );

  return (
    <>
      {isHashLink ? (
        <a href={to} className={commonClasses} onClick={handleClick} {...props}>
          <span className={underlineClasses}>{children}</span>
        </a>
      ) : (
        <Link href={to} className={commonClasses} {...props}>
          <span className={underlineClasses}>{children}</span>
        </Link>
      )}
    </>
  );
};

export default NavLink;
