import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { ThemeColors, useTheme } from "../theme/ThemeProvider";

export default function CreateGroupScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [goalName, setGoalName] = useState("");
  const [members, setMembers] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");

  const handleSubmit = () => {
    Alert.alert(
      "Create Group",
      "This will call the FastAPI backend later and persist to Amazon RDS."
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.safeArea}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Create Group</Text>
          <Text style={styles.subtitle}>
            Define the shared goal, invite members, and set the weekly duration.
            We will connect this form to the backend soon.
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Goal Name</Text>
            <TextInput
              value={goalName}
              onChangeText={setGoalName}
              placeholder="Enter the goal: (e.g. Exercise More)"
              placeholderTextColor={colors.placeholder}
              style={styles.input}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Members</Text>
            <TextInput
              value={members}
              onChangeText={setMembers}
              placeholder="Add people by email (comma separated)"
              placeholderTextColor={colors.placeholder}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Set Duration</Text>
            <View style={styles.durationRow}>
              <View style={styles.durationField}>
                <TextInput
                  value={durationDays}
                  onChangeText={(text) => setDurationDays(text.replace(/[^0-9]/g, ""))}
                  placeholder="Days"
                  placeholderTextColor={colors.placeholder}
                  style={styles.durationInput}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              <View style={styles.durationField}>
                <TextInput
                  value={durationHours}
                  onChangeText={(text) =>
                    setDurationHours(text.replace(/[^0-9]/g, ""))
                  }
                  placeholder="Hours"
                  placeholderTextColor={colors.placeholder}
                  style={styles.durationInput}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              <View style={styles.durationField}>
                <TextInput
                  value={durationMinutes}
                  onChangeText={(text) =>
                    setDurationMinutes(text.replace(/[^0-9]/g, ""))
                  }
                  placeholder="Minutes"
                  placeholderTextColor={colors.placeholder}
                  style={styles.durationInput}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            </View>
          </View>

          <View style={styles.helper}>
            <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
            <Text style={styles.helperText}>
              Duration will help Lockin split the goal across your circle once the backend
              logic is hooked up.
            </Text>
          </View>

          <Pressable style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Create Group</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 36,
      paddingBottom: 160,
      backgroundColor: colors.background,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      alignSelf: "flex-start",
      marginBottom: 12,
    },
    backLabel: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "600",
    },
    header: {
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    formCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.08,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
      elevation: 10,
    },
    fieldBlock: {
      marginBottom: 20,
    },
    label: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 10,
    },
    input: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.inputBackground,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      color: colors.inputText,
    },
    durationRow: {
      flexDirection: "row",
      gap: 12,
    },
    durationField: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.inputBackground,
    },
    durationInput: {
      paddingVertical: 14,
      paddingHorizontal: 12,
      fontSize: 15,
      color: colors.inputText,
      textAlign: "center",
    },
    helper: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      backgroundColor: colors.chipBackground,
      borderRadius: 14,
      padding: 12,
      marginBottom: 24,
    },
    helperText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
    },
    submitButton: {
      backgroundColor: colors.accentPrimary,
      borderRadius: 18,
      paddingVertical: 18,
      alignItems: "center",
    },
    submitButtonText: {
      color: colors.accentOnPrimary,
      fontSize: 17,
      fontWeight: "700",
    },
  });
