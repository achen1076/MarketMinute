"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";

interface UserPreferences {
  tickerColoring: boolean;
  alertPreference: boolean;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  setTickerColoring: (enabled: boolean) => void;
  setAlertPreference: (enabled: boolean) => void;
  isLoading: boolean;
}

const defaultPreferences: UserPreferences = {
  tickerColoring: true,
  alertPreference: true,
};

const UserPreferencesContext = createContext<
  UserPreferencesContextType | undefined
>(undefined);

function hasSession(): boolean {
  if (typeof document === "undefined") return false;
  // Check for NextAuth session cookie
  return (
    document.cookie.includes("next-auth.session-token") ||
    document.cookie.includes("__Secure-next-auth.session-token")
  );
}

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] =
    useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const fetchInitiated = useRef(false);

  useEffect(() => {
    if (fetchInitiated.current) return;
    fetchInitiated.current = true;

    const fetchPreferences = async () => {
      // Only fetch from API if user is logged in
      if (hasSession()) {
        try {
          const res = await fetch("/api/user/preferences");
          if (res.ok) {
            const data = await res.json();
            setPreferences({
              tickerColoring: data.tickerColoring === "on",
              alertPreference: data.alertPreference !== "off",
            });
          }
        } catch {
          // Use defaults if fetch fails
        }
      }
      setIsLoading(false);
    };

    fetchPreferences();
  }, []);

  const setTickerColoring = (enabled: boolean) => {
    setPreferences((prev) => ({ ...prev, tickerColoring: enabled }));
    localStorage.setItem("tickerColoringEnabled", String(enabled));

    // Only save to database if user is logged in
    if (hasSession()) {
      fetch("/api/user/ticker-coloring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickerColoring: enabled ? "on" : "off" }),
      }).catch(() => {});
    }
  };

  const setAlertPreference = (enabled: boolean) => {
    setPreferences((prev) => ({ ...prev, alertPreference: enabled }));

    // Only save to database if user is logged in
    if (hasSession()) {
      fetch("/api/user/alert-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertPreference: enabled ? "on" : "off" }),
      }).catch(() => {});
    }
  };

  return (
    <UserPreferencesContext.Provider
      value={{ preferences, setTickerColoring, setAlertPreference, isLoading }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error(
      "useUserPreferences must be used within a UserPreferencesProvider"
    );
  }
  return context;
}
