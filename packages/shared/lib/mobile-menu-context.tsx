"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type MobileMenuContextType = {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  toggleMenu: () => void;
  closeMenu: () => void;
};

const MobileMenuContext = createContext<MobileMenuContextType | undefined>(
  undefined
);

export function MobileMenuProvider({ children }: { children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <MobileMenuContext.Provider
      value={{ isMenuOpen, setIsMenuOpen, toggleMenu, closeMenu }}
    >
      {children}
    </MobileMenuContext.Provider>
  );
}

export function useMobileMenu() {
  const context = useContext(MobileMenuContext);
  if (!context) {
    throw new Error("useMobileMenu must be used within MobileMenuProvider");
  }
  return context;
}
