"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "marketminute-theme";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

interface ThemeProviderProps {
  children: ReactNode;
  isLoggedIn?: boolean;
}

export function ThemeProvider({
  children,
  isLoggedIn = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");
  const [mounted, setMounted] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);

  const fetchTheme = async () => {
    // Only fetch from API if user is logged in
    if (isLoggedIn) {
      try {
        const res = await fetch("/api/user/theme");
        if (res.ok) {
          const data = await res.json();
          if (data.theme && ["light", "dark", "system"].includes(data.theme)) {
            setThemeState(data.theme);
            return;
          }
        }
      } catch {
        // Fall through to localStorage
      }
    }
    // Fall back to localStorage if not logged in or fetch fails
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored && ["light", "dark", "system"].includes(stored)) {
      setThemeState(stored);
    }
  };

  // Function to refresh theme (call after login)
  const refreshTheme = async () => {
    await fetchTheme();
  };

  useEffect(() => {
    setMounted(true);
    fetchTheme().finally(() => setThemeLoaded(true));
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const resolved = theme === "system" ? getSystemTheme() : theme;
    setResolvedTheme(resolved);

    // Apply theme class to document
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);

    // Listen for system theme changes
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? "dark" : "light";
        setResolvedTheme(newTheme);
        root.classList.remove("light", "dark");
        root.classList.add(newTheme);
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);

    // Only save to database if user is logged in
    if (isLoggedIn) {
      fetch("/api/user/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newTheme }),
      }).catch((error) => {
        // Silently fail if error occurs
        console.debug("Failed to save theme to database:", error);
      });
    }
  };

  // Block rendering until theme is loaded to prevent flash
  if (!mounted || !themeLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, setTheme, refreshTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
