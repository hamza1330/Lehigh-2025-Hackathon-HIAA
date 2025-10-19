import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { ThemeColors, useTheme } from "../../theme/ThemeProvider";
import { useRouter } from "expo-router";
import { useAppContext } from "../providers/AppProvider";
import { archiveExpiredGroups, updateProfile } from "../lib/api";

type SettingsAction = {
  id: string;
  label: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  accentColor?: string;
  onPress: () => void;
};

export default function Settings() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [focusReminders, setFocusReminders] = useState(true);
  const { colors, isDark, setDarkMode: setThemeDarkMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { profile, setProfile, logout } = useAppContext();

  const displayName = profile?.display_name ?? "LockIN member";
  const email = profile?.email ?? "anonymous@lockin.demo";
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(displayName);

  useEffect(() => {
    setNameDraft(displayName);
  }, [displayName]);

  const handleSaveDisplayName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      Alert.alert("Display name", "Please enter a valid name.");
      return;
    }
    try {
      const updated = await updateProfile({ display_name: trimmed });
      setProfile(updated);
      Alert.alert("Profile updated", "Your display name has been saved.");
      setIsEditingName(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to update profile.";
      Alert.alert("Profile", message);
    }
  };

  const handleCancelEdit = () => {
    setNameDraft(displayName);
    setIsEditingName(false);
  };

  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  const handleArchiveExpired = useCallback(async () => {
    if (maintenanceLoading) {
      return;
    }
    setMaintenanceLoading(true);
    try {
      const result = await archiveExpiredGroups();
      Alert.alert(
        "Maintenance complete",
        result.archived === 0
          ? "No circles needed archiving."
          : `${result.archived} circle(s) archived.`,
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to run maintenance right now.";
      Alert.alert("Maintenance", message);
    } finally {
      setMaintenanceLoading(false);
    }
  }, [maintenanceLoading]);

  const handleSignOut = useCallback(() => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          logout().finally(() => {
            router.replace("/");
          });
        },
      },
    ]);
  }, [logout, router]);

  const actions = useMemo<SettingsAction[]>(
    () => [
      {
        id: "language",
        label: "Language",
        description: "English",
        icon: "globe-outline",
        onPress: () => Alert.alert("Language", "Open language selector soon."),
      },
      {
        id: "manage-circles",
        label: "Manage Circles",
        description: "Edit or archive active circles",
        icon: "people-outline",
        onPress: () =>
          Alert.alert("Manage Circles", "Hook this up to circle management."),
      },
      {
        id: "change-password",
        label: "Change Password",
        icon: "lock-closed-outline",
        onPress: () => Alert.alert("Change Password", "Link to auth flow later."),
      },
      {
        id: "subscriptions",
        label: "Subscription & Billing",
        description: "View plan and invoices",
        icon: "card-outline",
        onPress: () =>
          Alert.alert("Subscription", "Connect to billing details soon."),
      },
      {
        id: "help",
        label: "Help & Support",
        icon: "chatbubbles-outline",
        onPress: () =>
          Alert.alert("Support", "Route to FAQs or support chat next."),
      },
      {
        id: "feedback",
        label: "Send Feedback",
        icon: "megaphone-outline",
        onPress: () => Alert.alert("Feedback", "Open feedback form later."),
      },
      {
        id: "archive-expired",
        label: maintenanceLoading ? "Archiving…" : "Archive Expired Groups",
        description: "Move ended circles to the archive",
        icon: "archive-outline",
        accentColor: colors.accentPrimary,
        onPress: handleArchiveExpired,
      },
      {
        id: "sign-out",
        label: "Sign Out",
        icon: "log-out-outline",
        accentColor: colors.accentPrimary,
        onPress: handleSignOut,
      },
      {
        id: "delete-account",
        label: "Delete Account",
        icon: "trash-outline",
        destructive: true,
        onPress: () =>
          Alert.alert(
            "Delete Account",
            "Confirm deletion when backend hook is ready."
          ),
      },
    ],
    [colors.accentPrimary, handleArchiveExpired, handleSignOut, maintenanceLoading],
  );

  const darkModeStatus = isDark ? "Dark theme active" : "Light theme active";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Settings</Text>
          <View style={styles.hourglass}>
            <Ionicons
              name="hourglass-outline"
              size={38}
              color={colors.accentPrimary}
            />
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Ionicons
              name="person-circle"
              size={64}
              color={colors.accentPrimary}
            />
          </View>
          <View style={styles.profileText}>
            {isEditingName ? (
              <>
                <TextInput
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  style={styles.editInput}
                  placeholder="Display name"
                  placeholderTextColor={colors.textSecondary}
                />
                <View style={styles.editActions}>
                  <Pressable
                    style={styles.editActionButton}
                    onPress={handleCancelEdit}
                  >
                    <Text style={styles.editActionText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.editActionButton,
                      styles.editActionPrimary,
                    ]}
                    onPress={handleSaveDisplayName}
                  >
                    <Text style={styles.editActionPrimaryText}>Save</Text>
                  </Pressable>
                </View>
                <Text style={styles.profileEmail}>{email}</Text>
              </>
            ) : (
              <>
                <Text style={styles.profileName}>{displayName}</Text>
                <Text style={styles.profileEmail}>{email}</Text>
              </>
            )}
          </View>
          {!isEditingName ? (
            <Pressable
              style={styles.editButton}
              onPress={() => setIsEditingName(true)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.toggleGroup}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabel}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={colors.accentPrimary}
              />
              <View style={styles.toggleLabelText}>
                <Text style={styles.toggleTitle}>Push Notifications</Text>
                <Text style={styles.toggleSubtitle}>
                  Updates about goals, invites, and streaks
                </Text>
              </View>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              thumbColor={pushEnabled ? "#FFFFFF" : "#F4F5F7"}
              trackColor={{ false: colors.divider, true: colors.accentPrimary }}
            />
          </View>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabel}>
              <Ionicons
                name="alarm-outline"
                size={24}
                color={colors.warning}
              />
              <View style={styles.toggleLabelText}>
                <Text style={styles.toggleTitle}>Focus Reminders</Text>
                <Text style={styles.toggleSubtitle}>
                  Nudges before scheduled sessions
                </Text>
              </View>
            </View>
            <Switch
              value={focusReminders}
              onValueChange={setFocusReminders}
              thumbColor={focusReminders ? "#FFFFFF" : "#F4F5F7"}
              trackColor={{ false: colors.divider, true: colors.warning }}
            />
          </View>
          <View style={[styles.toggleRow, styles.toggleRowLast]}>
            <View style={styles.toggleLabel}>
              <Ionicons
                name="moon-outline"
                size={24}
                color={colors.textSecondary}
              />
              <View style={styles.toggleLabelText}>
                <Text style={styles.toggleTitle}>Dark Mode</Text>
                <Text style={styles.toggleSubtitle}>{darkModeStatus}</Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={setThemeDarkMode}
              thumbColor={isDark ? "#FFFFFF" : "#F4F5F7"}
              trackColor={{ false: colors.divider, true: colors.textPrimary }}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          {actions.map((action, index) => {
            const isLast = index === actions.length - 1;
            return (
              <Pressable
                key={action.id}
                onPress={action.onPress}
                style={[
                  styles.actionRow,
                  !isLast && styles.actionRowDivider,
                ]}
              >
                <View style={styles.actionLeft}>
                  <View
                    style={[
                      styles.actionIconWrap,
                      action.destructive && styles.actionIconDestructive,
                    ]}
                  >
                    <Ionicons
                      name={action.icon}
                      size={22}
                      color={
                        action.destructive
                          ? colors.destructive
                          : action.accentColor ?? colors.textPrimary
                      }
                    />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text
                      style={[
                        styles.actionLabel,
                        action.destructive && styles.actionLabelDestructive,
                        action.accentColor && { color: action.accentColor },
                      ]}
                    >
                      {action.label}
                    </Text>
                    {action.description && (
                      <Text style={styles.actionDescription}>
                        {action.description}
                      </Text>
                    )}
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={action.destructive ? "#D64545" : "#8B98B1"}
                />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.settingBackground,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 36,
      paddingBottom: 160,
      backgroundColor: colors.settingBackground,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 28,
    },
    heading: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    hourglass: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: colors.heroAccent,
      alignItems: "center",
      justifyContent: "center",
    },
    profileCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 20,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.06,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    profileAvatar: {
      marginRight: 14,
    },
    profileText: {
      flex: 1,
    },
    profileName: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    profileEmail: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    editInput: {
      width: "100%",
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.textPrimary,
      marginBottom: 10,
      backgroundColor: colors.background,
    },
    editActions: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 8,
    },
    editActionButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: colors.chipBackground,
    },
    editActionPrimary: {
      backgroundColor: colors.accentPrimary,
    },
    editActionText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: "600",
    },
    editActionPrimaryText: {
      color: colors.accentOnPrimary,
      fontSize: 13,
      fontWeight: "700",
    },
    editButton: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: colors.accentPrimary,
    },
    editButtonText: {
      color: colors.accentOnPrimary,
      fontSize: 14,
      fontWeight: "700",
    },
    toggleGroup: {
      backgroundColor: colors.card,
      borderRadius: 24,
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 24,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.04,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 5,
    },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      gap: 16,
    },
    toggleRowLast: {
      borderBottomWidth: 0,
    },
    toggleLabel: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 12,
    },
    toggleLabelText: {
      flex: 1,
    },
    toggleTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    toggleSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.04,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 5,
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 18,
    },
    actionRowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    actionLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      flex: 1,
    },
    actionIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: colors.chipBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    actionIconDestructive: {
      backgroundColor: colors.destructiveBg,
    },
    actionTextWrap: {
      flex: 1,
    },
    actionLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    actionLabelDestructive: {
      color: colors.destructive,
    },
    actionDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
  });
