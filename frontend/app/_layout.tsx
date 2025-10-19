import "react-native-get-random-values";
import { Stack } from "expo-router";
import { AppProvider } from "./providers/AppProvider";
import { ThemeProvider, useTheme } from "../theme/ThemeProvider";

function RootStack() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.backgroundAlt },
        headerTitleStyle: { color: colors.textPrimary, fontSize: 20 },
        headerTintColor: colors.accentPrimary,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="create-account"
        options={{ title: "Create Account" }}
      />
      <Stack.Screen name="confirm-account" options={{ title: "Confirm Account" }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="create-group"
        options={{ headerShown: false, presentation: "card" }}
      />
      <Stack.Screen name="group/[id]" options={{ headerShown: false }} />
      <Stack.Screen
        name="notification/[id]"
        options={{ title: "Notification" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppProvider>
        <RootStack />
      </AppProvider>
    </ThemeProvider>
  );
}
