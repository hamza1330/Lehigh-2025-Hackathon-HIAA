import { Link } from "expo-router";
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

export default function CreateAccount() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleCreateAccount = () => {
    Alert.alert(
      "Create Account",
      "We will wire this up to real auth once the backend is ready."
    );
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
          <Text style={styles.title}>Create your circle account</Text>
          <Text style={styles.subtitle}>
            Set your handle and join the crew that keeps you on track.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Display name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ali Khan"
              placeholderTextColor="#7C8192"
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="name@email.com"
              placeholderTextColor="#7C8192"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          <View style={styles.fieldRow}>
            <View style={[styles.fieldSplit, styles.fieldSplitLeft]}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Create password"
                placeholderTextColor="#7C8192"
                secureTextEntry
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldSplit}>
              <Text style={styles.label}>Confirm</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat password"
                placeholderTextColor="#7C8192"
                secureTextEntry
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.helperChip}>
            <Text style={styles.helperText}>
              Tip: Balanced circles split the optional goal by what each person can commit.
            </Text>
          </View>

          <Pressable style={styles.button} onPress={handleCreateAccount}>
            <Text style={styles.buttonText}>Create account</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/" style={styles.link}>
            Back to Log in
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
    paddingTop: 40,
    paddingBottom: 32,
    justifyContent: "center",
  },
  brandBlock: {
    marginBottom: 28,
  },
  badge: {
    fontSize: 14,
    letterSpacing: 3,
    color: "#61E4A8",
    fontWeight: "700",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#F7F9FC",
    marginBottom: 10,
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
  fieldGroup: {
    marginBottom: 18,
  },
  fieldRow: {
    flexDirection: "row",
  },
  fieldSplit: {
    flex: 1,
    marginBottom: 18,
  },
  fieldSplitLeft: {
    marginRight: 16,
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
  helperChip: {
    backgroundColor: "#1B253A",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  helperText: {
    color: "#7C8192",
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    backgroundColor: "#61E4A8",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0C1425",
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
