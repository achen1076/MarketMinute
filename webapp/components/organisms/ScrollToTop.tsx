"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll to absolute top (0, 0) on route change
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
