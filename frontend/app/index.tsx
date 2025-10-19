import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { setAuthToken } from "./lib/api";
import { createUserPool, isCognitoConfigured, loginWithPassword } from "./lib/cognito";
import { useAppContext } from "./providers/AppProvider";

function useCognitoPool() {
  return useMemo(() => createUserPool(), []);
}

export default function Index() {
  const router = useRouter();
  const { refreshProfile, loadingProfile } = useAppContext();
  const userPool = useCognitoPool();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const missingConfig = !isCognitoConfigured();

  const handleLogin = async () => {
    if (missingConfig) {
      setError("Cognito environment variables are missing.");
      return;
    }
    if (!userPool) {
      setError("Unable to initialise Cognito user pool.");
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError("Enter your email and password to continue.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await loginWithPassword(email.trim().toLowerCase(), password);
      const idToken = result.IdToken;
      setAuthToken(idToken);
      await AsyncStorage.setItem("authToken", idToken);
      await refreshProfile();
      router.replace("/(tabs)/home");
    } catch (err) {
      if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "UserNotConfirmedException") {
        Alert.alert(
          "Email not verified",
          "Enter the verification code we emailed you.",
          [
            {
              text: "Go to verification",
              onPress: () =>
                router.replace({
                  pathname: "/confirm-account",
                  params: { email: email.trim().toLowerCase() },
                }),
            },
          ],
        );
      } else {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to authenticate. Please try again.";
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandBlock}>
          <Text style={styles.badge}>LOCKIN</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Stay accountable with your circle and keep the streak alive.
          </Text>
        </View>

        <View style={styles.card}>
          {missingConfig ? (
            <Text style={styles.configWarning}>
              Missing `EXPO_PUBLIC_COGNITO_USER_POOL_ID` or
              `EXPO_PUBLIC_COGNITO_APP_CLIENT_ID`. Update your Expo env vars and
              reload the app.
            </Text>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="name@email.com"
              placeholderTextColor="#7C8192"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#7C8192"
              secureTextEntry
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={[styles.button, (submitting || loadingProfile) && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={submitting || loadingProfile}
          >
            <Text style={styles.buttonText}>
              {submitting || loadingProfile ? "Signing in..." : "Log in"}
            </Text>
          </Pressable>

          <Text style={styles.finePrint}>
            Need an invite? Ask your circle admin for an access link.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to LockIN?</Text>
          <Link href="/create-account" style={styles.link}>
            Create an account
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101522",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 48,
    paddingBottom: 32,
    justifyContent: "center",
  },
  brandBlock: {
    marginBottom: 32,
  },
  badge: {
    fontSize: 14,
    letterSpacing: 3,
    color: "#61E4A8",
    fontWeight: "700",
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#F7F9FC",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: "#A7ADC6",
  },
  card: {
    backgroundColor: "#161D2F",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  configWarning: {
    backgroundColor: "rgba(255,107,107,0.12)",
    borderRadius: 12,
    padding: 12,
    color: "#FF6B6B",
    marginBottom: 16,
    fontSize: 13,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    color: "#C1C6D7",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#1F273C",
    color: "#F0F3FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 13,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#61E4A8",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0C1425",
  },
  finePrint: {
    textAlign: "center",
    color: "#7C8192",
    fontSize: 13,
    marginTop: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#A7ADC6",
    fontSize: 14,
  },
  link: {
    color: "#61E4A8",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
});
