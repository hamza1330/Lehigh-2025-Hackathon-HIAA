import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ThemeColors, useTheme } from "../../theme/ThemeProvider";
import {
  acceptInvite,
  declineInvite,
  getNotificationDetail,
  markNotificationAsRead,
  type NotificationRead,
} from "../lib/api";

const formatRelativeTime = (timestamp: string) => {
  const now = Date.now();
  const created = new Date(timestamp).getTime();
  const diffSeconds = Math.max(0, Math.floor((now - created) / 1000));
  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
};

export default function NotificationDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [notification, setNotification] = useState<NotificationRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const getMeta = useCallback(
    (item: NotificationRead) => {
      switch (item.kind) {
        case "group_invite":
          return {
            iconName: "person-add-outline" as const,
            iconColor: "#1B6CF5",
            iconBackground: "rgba(27,108,245,0.12)",
            badge: item.group?.name ?? "Group invite",
          };
        case "milestone_member":
          return {
            iconName: "trophy-outline" as const,
            iconColor: "#29B583",
            iconBackground: "rgba(41,181,131,0.14)",
            badge: item.group?.name ?? "Milestone reached",
          };
        case "milestone_group":
          return {
            iconName: "people-circle-outline" as const,
            iconColor: "#8B5CF6",
            iconBackground: "rgba(139,92,246,0.14)",
            badge: item.group?.name ?? "Group milestone",
          };
        case "session_reminder":
          return {
            iconName: "alarm-outline" as const,
            iconColor: "#F5A21B",
            iconBackground: "rgba(245,162,27,0.16)",
            badge: item.group?.name ?? "Session reminder",
          };
        default:
          return {
            iconName: "notifications-outline" as const,
            iconColor: colors.accentPrimary,
            iconBackground: colors.chipBackground,
            badge: item.group?.name ?? "Update",
          };
      }
    },
    [colors.accentPrimary, colors.chipBackground],
  );

  const loadNotification = useCallback(async () => {
    if (!id) {
      setError("Missing notification id.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const detail = await getNotificationDetail(id);
      setNotification(detail);
      setError(null);
      if (detail.status === "pending") {
        const updated = await markNotificationAsRead(id);
        setNotification(updated);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load this notification.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadNotification();
  }, [loadNotification]);

  const handleOpenContext = useCallback(() => {
    if (!notification) {
      router.replace("/(tabs)/inbox");
      return;
    }
    if (notification.group_id) {
      router.replace({
        pathname: "/group/[id]",
        params: { id: notification.group_id },
      });
    } else {
      router.replace("/(tabs)/home");
    }
  }, [notification, router]);

  const handleAcceptInvite = async () => {
    if (!notification) {
      return;
    }
    setSaving(true);
    try {
      const updated = await acceptInvite(notification.id);
      setNotification(updated);
      Alert.alert("Invite accepted", "Welcome to the circle!");
      if (updated.group_id) {
        router.replace({
          pathname: "/group/[id]",
          params: { id: updated.group_id },
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to accept invite.";
      Alert.alert("Accept invite", message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeclineInvite = async () => {
    if (!notification) {
      return;
    }
    setSaving(true);
    try {
      const updated = await declineInvite(notification.id);
      setNotification(updated);
      Alert.alert("Invite declined", "No worries, maybe next time!");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to decline invite.";
      Alert.alert("Decline invite", message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.accentPrimary} />
          <Text style={styles.loadingText}>Loading notification…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !notification) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            {error ?? "Notification not found"}
          </Text>
          <Text style={styles.emptySubtitle}>
            This update might have been cleared. Head back to your inbox to see
            the latest.
          </Text>
          <Pressable
            style={styles.emptyButton}
            onPress={() => router.replace("/(tabs)/inbox")}
          >
            <Text style={styles.emptyButtonText}>Back to Inbox</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const meta = getMeta(notification);
  const canRespondInvite =
    notification.kind === "group_invite" &&
    (notification.status === "pending" || notification.status === "read");

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View
              style={[styles.iconWrap, { backgroundColor: meta.iconBackground }]}
            >
              <Ionicons name={meta.iconName} size={34} color={meta.iconColor} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.cardSubtitle}>{meta.badge}</Text>
              <Text style={styles.cardMeta}>
                {formatRelativeTime(notification.created_at)}
              </Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>
            {notification.title ?? "Notification"}
          </Text>
          <Text style={styles.cardDescription}>
            {notification.body ?? "No additional context provided."}
          </Text>

          {canRespondInvite ? (
            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.secondaryButton, styles.button]}
                onPress={handleDeclineInvite}
                disabled={saving}
              >
                <Text style={styles.secondaryButtonText}>
                  {saving ? "Saving…" : "Decline"}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, styles.button]}
                onPress={handleAcceptInvite}
                disabled={saving}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? "Saving…" : "Accept"}
                </Text>
              </Pressable>
            </View>
          ) : notification.group_id ? (
            <Pressable style={styles.primaryButton} onPress={handleOpenContext}>
              <Text style={styles.primaryButtonText}>Open circle</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
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
      paddingTop: 32,
      paddingBottom: 120,
      backgroundColor: colors.background,
    },
    loadingState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.08,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 12 },
      elevation: 10,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 18,
    },
    iconWrap: {
      width: 58,
      height: 58,
      borderRadius: 18,
      backgroundColor: colors.chipBackground,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    headerText: {
      flex: 1,
    },
    cardSubtitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    cardMeta: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 4,
    },
    cardTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 14,
    },
    cardDescription: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
      marginBottom: 24,
    },
    buttonRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
    button: {
      minWidth: 120,
      alignItems: "center",
    },
    primaryButton: {
      alignSelf: "flex-start",
      backgroundColor: colors.accentPrimary,
      borderRadius: 16,
      paddingHorizontal: 22,
      paddingVertical: 14,
    },
    primaryButtonText: {
      color: colors.accentOnPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    secondaryButton: {
      alignSelf: "flex-start",
      backgroundColor: colors.chipBackground,
      borderRadius: 16,
      paddingHorizontal: 22,
      paddingVertical: 14,
    },
    secondaryButtonText: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    emptyState: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 120,
      backgroundColor: colors.background,
      alignItems: "center",
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 12,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 24,
    },
    emptyButton: {
      backgroundColor: colors.accentPrimary,
      borderRadius: 14,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    emptyButtonText: {
      color: colors.accentOnPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
  });
