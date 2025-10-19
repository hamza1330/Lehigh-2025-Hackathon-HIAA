import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#101522" },
        headerTitleStyle: { color: "#F7F9FC", fontSize: 20 },
        headerTintColor: "#61E4A8",
        contentStyle: { backgroundColor: "#101522" },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="create-account" options={{ title: "Create Account" }} />
      <Stack.Screen
        name="home"
        options={{ headerShown: false, contentStyle: { backgroundColor: "#E9F5F0" } }}
      />
    </Stack>
  );
}
