import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
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
import { CognitoUser } from "amazon-cognito-identity-js";

import { createUserPool } from "./lib/cognito";
import { emailToUsername } from "./lib/auth";

export default function ConfirmAccount() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const pool = createUserPool();

  const [verificationCode, setVerificationCode] = useState("");
  const [resending, setResending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedEmail = (email ?? "").toString();
  const username = emailToUsername(normalizedEmail);

  const getUser = () => {
    if (!pool) {
      throw new Error("Cognito configuration missing");
    }
    return new CognitoUser({ Username: username, Pool: pool });
  };

  const handleConfirm = async () => {
    if (!verificationCode.trim()) {
      setError("Enter the verification code from your email.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const user = getUser();
      await new Promise<void>((resolve, reject) => {
        user.confirmRegistration(verificationCode.trim(), true, (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
      Alert.alert("Account confirmed", "You can now sign in.", [
        {
          text: "Continue",
          onPress: () => router.replace("/"),
        },
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to confirm account.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      const user = getUser();
      await new Promise<void>((resolve, reject) => {
        user.resendConfirmationCode((err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
      Alert.alert("Code sent", "Check your email for the verification code.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to resend code.";
      setError(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Check your inbox</Text>
          <Text style={styles.subtitle}>
            Enter the code we sent to {normalizedEmail || "your email"} to
            activate your account.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Verification code</Text>
            <TextInput
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              placeholder="123456"
              placeholderTextColor="#7C8192"
              style={styles.input}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleConfirm}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>
              {submitting ? "Confirming..." : "Confirm account"}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.secondaryButton, resending && styles.buttonDisabled]}
            onPress={handleResend}
            disabled={resending}
          >
            <Text style={styles.secondaryText}>
              {resending ? "Sending..." : "Resend code"}
            </Text>
          </Pressable>
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
    paddingTop: 64,
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
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#F7F9FC",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "#A7ADC6",
    marginBottom: 24,
    lineHeight: 20,
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
  button: {
    backgroundColor: "#61E4A8",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  secondaryButton: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0C1425",
  },
  secondaryText: {
    color: "#61E4A8",
    fontWeight: "600",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 13,
    marginBottom: 12,
  },
});
