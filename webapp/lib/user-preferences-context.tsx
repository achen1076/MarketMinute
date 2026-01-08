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
  refreshPreferences: () => Promise<void>;
  isLoading: boolean;
}

const defaultPreferences: UserPreferences = {
  tickerColoring: true,
  alertPreference: true,
};

const UserPreferencesContext = createContext<
  UserPreferencesContextType | undefined
>(undefined);

interface UserPreferencesProviderProps {
  children: ReactNode;
  isLoggedIn?: boolean;
}

export function UserPreferencesProvider({
  children,
  isLoggedIn = false,
}: UserPreferencesProviderProps) {
  const [preferences, setPreferences] =
    useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const fetchInitiated = useRef(false);

  useEffect(() => {
    if (fetchInitiated.current) return;
    fetchInitiated.current = true;

    const fetchPreferences = async () => {
      // Only fetch from API if user is logged in
      if (isLoggedIn) {
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

  // Re-fetch preferences when user logs in
  useEffect(() => {
    if (isLoggedIn && !fetchInitiated.current) {
      const fetchPrefs = async () => {
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
          // Silently fail
        }
      };
      fetchPrefs();
    }
  }, [isLoggedIn]);

  const refreshPreferences = async () => {
    if (!isLoggedIn) return;

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
      // Silent fail
    }
  };

  const setTickerColoring = (enabled: boolean) => {
    setPreferences((prev) => ({ ...prev, tickerColoring: enabled }));
    localStorage.setItem("tickerColoringEnabled", String(enabled));

    // Only save to database if user is logged in
    if (isLoggedIn) {
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
    if (isLoggedIn) {
      fetch("/api/user/alert-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertPreference: enabled ? "on" : "off" }),
      }).catch(() => {});
    }
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        setTickerColoring,
        setAlertPreference,
        refreshPreferences,
        isLoading,
      }}
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
