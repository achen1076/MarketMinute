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

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] =
    useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const fetchInitiated = useRef(false);

  useEffect(() => {
    if (fetchInitiated.current) return;
    fetchInitiated.current = true;

    const fetchPreferences = async () => {
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const setTickerColoring = (enabled: boolean) => {
    setPreferences((prev) => ({ ...prev, tickerColoring: enabled }));
    localStorage.setItem("tickerColoringEnabled", String(enabled));

    fetch("/api/user/ticker-coloring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickerColoring: enabled ? "on" : "off" }),
    }).catch(() => {});
  };

  const setAlertPreference = (enabled: boolean) => {
    setPreferences((prev) => ({ ...prev, alertPreference: enabled }));

    fetch("/api/user/alert-preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertPreference: enabled ? "on" : "off" }),
    }).catch(() => {});
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
