import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";

export type ThemeColors = {
  background: string;
  backgroundAlt: string;
  settingBackground: string;
  card: string;
  cardElevated: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentPrimary: string;
  accentOnPrimary: string;
  accentSecondary: string;
  accentOnSecondary: string;
  navBackground: string;
  navActive: string;
  navInactive: string;
  navShadow: string;
  border: string;
  divider: string;
  chipBackground: string;
  chipText: string;
  success: string;
  warning: string;
  destructive: string;
  destructiveBg: string;
  inputBackground: string;
  inputText: string;
  placeholder: string;
  progressTrack: string;
  progressFill: string;
  shadowColor: string;
  heroBackground: string;
  heroAccent: string;
  heroTextSecondary: string;
};

const lightColors: ThemeColors = {
  background: "#E9F5F0",
  backgroundAlt: "#F5FAFF",
  settingBackground: "#FDF8EE",
  card: "#FFFFFF",
  cardElevated: "#FFFFFF",
  cardBorder: "#D7E2F3",
  textPrimary: "#1B2F58",
  textSecondary: "#4F5D73",
  textMuted: "#7A8AA2",
  accentPrimary: "#1B6CF5",
  accentOnPrimary: "#FFFFFF",
  accentSecondary: "#FFC640",
  accentOnSecondary: "#0D2149",
  navBackground: "#FFFFFF",
  navActive: "#1B6CF5",
  navInactive: "#42536D",
  navShadow: "#0F1E3D",
  border: "#D7E2F3",
  divider: "#E5ECF6",
  chipBackground: "rgba(27,108,245,0.14)",
  chipText: "#1B6CF5",
  success: "#0EA58B",
  warning: "#F5A21B",
  destructive: "#D64545",
  destructiveBg: "rgba(214,69,69,0.12)",
  inputBackground: "#FFFFFF",
  inputText: "#1B2F58",
  placeholder: "#7C8192",
  progressTrack: "#E2ECF4",
  progressFill: "#0EA58B",
  shadowColor: "#0F1E3D",
  heroBackground: "#FFFFFF",
  heroAccent: "rgba(27,108,245,0.12)",
  heroTextSecondary: "rgba(255,255,255,0.85)",
};

const darkColors: ThemeColors = {
  background: "#101522",
  backgroundAlt: "#0C1425",
  settingBackground: "#0C1425",
  card: "#161D2F",
  cardElevated: "#1F273C",
  cardBorder: "#222D45",
  textPrimary: "#F7F9FC",
  textSecondary: "#A7ADC6",
  textMuted: "#7C8192",
  accentPrimary: "#61E4A8",
  accentOnPrimary: "#0C1425",
  accentSecondary: "#FFC640",
  accentOnSecondary: "#0C1425",
  navBackground: "#161D2F",
  navActive: "#61E4A8",
  navInactive: "#8B98B1",
  navShadow: "#000000",
  border: "#23304C",
  divider: "#1F2942",
  chipBackground: "rgba(97,228,168,0.16)",
  chipText: "#61E4A8",
  success: "#61E4A8",
  warning: "#FFC640",
  destructive: "#FF6B6B",
  destructiveBg: "rgba(255,107,107,0.16)",
  inputBackground: "#1F273C",
  inputText: "#F0F3FA",
  placeholder: "#7C8192",
  progressTrack: "#23304C",
  progressFill: "#61E4A8",
  shadowColor: "#000000",
  heroBackground: "#161D2F",
  heroAccent: "rgba(97,228,168,0.16)",
  heroTextSecondary: "rgba(247,249,252,0.85)",
};

type ThemeContextValue = {
  isDark: boolean;
  colors: ThemeColors;
  setDarkMode: (value: boolean) => void;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemPreference = useColorScheme();
  const [manualMode, setManualMode] = useState<"light" | "dark" | null>(null);

  const mode =
    manualMode ?? (systemPreference === "dark" ? "dark" : ("light" as const));

  const colors = mode === "dark" ? darkColors : lightColors;

  const value = useMemo<ThemeContextValue>(
    () => ({
      isDark: mode === "dark",
      colors,
      setDarkMode: (isDarkMode) => setManualMode(isDarkMode ? "dark" : "light"),
      toggleDarkMode: () => {
        setManualMode((prev) => (prev === "dark" ? "light" : "dark"));
      },
    }),
    [colors, mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
