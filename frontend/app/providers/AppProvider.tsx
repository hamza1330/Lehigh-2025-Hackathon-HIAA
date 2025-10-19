import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Profile } from "../lib/api";
import {
  clearAuthToken,
  getAuthToken,
  getProfile as fetchProfile,
  setAuthToken,
} from "../lib/api";

type AppContextValue = {
  profile: Profile | null;
  loadingProfile: boolean;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
  setProfile: (profile: Profile) => void;
  logout: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!getAuthToken()) {
      setProfileState(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchProfile();
      setProfileState(result);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load profile.";
      setError(message);
      if (typeof err === "object" && err && "status" in err && (err as { status?: number }).status === 401) {
        clearAuthToken();
        await AsyncStorage.removeItem("authToken");
        setProfileState(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("authToken");
        if (stored) {
          setAuthToken(stored);
          await refreshProfile();
        } else {
          setLoading(false);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to restore session.";
        setError(message);
        setLoading(false);
      }
    })();
  }, [refreshProfile]);

  const logout = useCallback(async () => {
    clearAuthToken();
    setProfileState(null);
    setError(null);
    await AsyncStorage.removeItem("authToken");
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      profile,
      loadingProfile: loading,
      profileError: error,
      refreshProfile,
      setProfile: setProfileState,
      logout,
    }),
    [profile, loading, error, refreshProfile, logout],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
