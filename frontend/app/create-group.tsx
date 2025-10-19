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
  const [usernameInvite, setUsernameInvite] = useState("");
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);
  const [durationDays, setDurationDays] = useState("");
  const [targetCadence, setTargetCadence] = useState<"daily" | "weekly">("daily");
  const [targetHours, setTargetHours] = useState("");

  const limitTargetHours = (value: string, cadence: "daily" | "weekly") => {
    const sanitized = value.replace(/[^0-9]/g, "");
    if (!sanitized) return "";
    const numeric = Math.min(
      parseInt(sanitized, 10),
      cadence === "daily" ? 24 : 160
    );
    return Number.isNaN(numeric) ? "" : `${numeric}`;
  };

  const handleDaysChange = (value: string) => {
    const sanitized = value.replace(/[^0-9]/g, "");
    setDurationDays(sanitized.slice(0, 3));
  };

  const handleTargetChange = (value: string) => {
    setTargetHours(limitTargetHours(value, targetCadence));
  };

  const handleCadenceChange = (cadence: "daily" | "weekly") => {
    setTargetCadence(cadence);
    setTargetHours((prev) => limitTargetHours(prev, cadence));
  };

  const handleInvite = () => {
    if (!usernameInvite.trim()) {
      Alert.alert("Invite member", "Enter a username before inviting.");
      return;
    }
    if (invitedUsers.includes(usernameInvite.trim())) {
      Alert.alert("Invite member", "This user is already invited.");
      return;
    }

    setInvitedUsers((prev) => [...prev, usernameInvite.trim()]);
    setUsernameInvite("");
    Alert.alert(
      "Invite sent",
      "User invited successfully. They will receive a notification once backend is connected."
    );
  };

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
            <Text style={styles.helperInfo}>
              How many days should this circle stay active before auto-archiving?
            </Text>
            <View style={styles.durationField}>
              <TextInput
                value={durationDays}
                onChangeText={handleDaysChange}
                placeholder="Days active (e.g. 14)"
                placeholderTextColor={colors.placeholder}
                style={styles.durationInputSingle}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Target cadence</Text>
            <View style={styles.cadenceRow}>
              <Pressable
                style={[
                  styles.cadencePill,
                  targetCadence === "daily" && styles.cadencePillActive,
                ]}
                onPress={() => handleCadenceChange("daily")}
              >
                <Text
                  style={[
                    styles.cadenceText,
                    targetCadence === "daily" && styles.cadenceTextActive,
                  ]}
                >
                  Daily
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.cadencePill,
                  targetCadence === "weekly" && styles.cadencePillActive,
                ]}
                onPress={() => handleCadenceChange("weekly")}
              >
                <Text
                  style={[
                    styles.cadenceText,
                    targetCadence === "weekly" && styles.cadenceTextActive,
                  ]}
                >
                  Weekly
                </Text>
              </Pressable>
            </View>
            <View style={styles.durationField}>
              <TextInput
                value={targetHours}
                onChangeText={handleTargetChange}
                placeholder={
                  targetCadence === "daily"
                    ? "Daily hours per member (max 24)"
                    : "Weekly hours per member (max 160)"
                }
                placeholderTextColor={colors.placeholder}
                style={styles.durationInputSingle}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
            <Text style={styles.limitCaption}>
              {targetCadence === "daily"
                ? "Limit 24 hours per member per day."
                : "Limit 160 hours per member per week."}
            </Text>
          </View>

          <View style={styles.helper}>
            <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
            <Text style={styles.helperText}>
              Duration sets when the circle closes. Your selected cadence defines how much
              time each member should log within that window once the backend is online.
            </Text>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Invite by username</Text>
            <Text style={styles.helperInfo}>
              We’ll validate usernames against LockIn profiles once the backend hook is ready.
            </Text>
            <View style={styles.inviteRow}>
              <TextInput
                value={usernameInvite}
                onChangeText={setUsernameInvite}
                placeholder="Enter username"
                placeholderTextColor={colors.placeholder}
                style={[styles.input, styles.inviteInput]}
                autoCapitalize="none"
              />
              <Pressable style={styles.inviteButton} onPress={handleInvite}>
                <Ionicons name="send" size={18} color={colors.accentOnPrimary} />
                <Text style={styles.inviteButtonText}>Invite</Text>
              </Pressable>
            </View>
            {invitedUsers.length > 0 ? (
              <View style={styles.invitedList}>
                {invitedUsers.map((user) => (
                  <View key={user} style={styles.invitedChip}>
                    <Ionicons name="person-circle-outline" size={16} color={colors.textPrimary} />
                    <Text style={styles.invitedChipLabel}>{user}</Text>
                  </View>
                ))}
              </View>
            ) : null}
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
    durationField: {
      marginTop: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.inputBackground,
    },
    durationInputSingle: {
      paddingVertical: 14,
      paddingHorizontal: 12,
      fontSize: 15,
      color: colors.inputText,
      textAlign: "center",
    },
    helperInfo: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    cadenceRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 12,
    },
    cadencePill: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
    },
    cadencePillActive: {
      backgroundColor: colors.chipBackground,
      borderColor: "transparent",
    },
    cadenceText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    cadenceTextActive: {
      color: colors.textPrimary,
    },
    limitCaption: {
      marginTop: 8,
      fontSize: 12,
      color: colors.textSecondary,
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
    inviteRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 12,
    },
    inviteInput: {
      flex: 1,
    },
    inviteButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.accentPrimary,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    inviteButtonText: {
      color: colors.accentOnPrimary,
      fontSize: 14,
      fontWeight: "600",
    },
    invitedList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 12,
    },
    invitedChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.chipBackground,
    },
    invitedChipLabel: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: "600",
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
