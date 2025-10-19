import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { ThemeColors, useTheme } from "../../theme/ThemeProvider";
import { listNotifications, type NotificationRead } from "../lib/api";

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

export default function Inbox() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [items, setItems] = useState<NotificationRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listNotifications();
      setItems(data);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load notifications right now.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications]),
  );

  const getNotificationMeta = useCallback(
    (notification: NotificationRead) => {
      switch (notification.kind) {
        case "group_invite":
          return {
            iconName: "person-add-outline" as const,
            iconColor: "#1B6CF5",
            iconBackground: "rgba(27,108,245,0.12)",
            badge: notification.group?.name ?? "Group invite",
          };
        case "milestone_member":
          return {
            iconName: "trophy-outline" as const,
            iconColor: "#29B583",
            iconBackground: "rgba(41,181,131,0.14)",
            badge: notification.group?.name ?? "Milestone reached",
          };
        case "milestone_group":
          return {
            iconName: "people-circle-outline" as const,
            iconColor: "#8B5CF6",
            iconBackground: "rgba(139,92,246,0.14)",
            badge: notification.group?.name ?? "Group milestone",
          };
        case "session_reminder":
          return {
            iconName: "alarm-outline" as const,
            iconColor: "#F5A21B",
            iconBackground: "rgba(245,162,27,0.16)",
            badge: notification.group?.name ?? "Session reminder",
          };
        default:
          return {
            iconName: "notifications-outline" as const,
            iconColor: colors.accentPrimary,
            iconBackground: colors.chipBackground,
            badge: notification.group?.name ?? "Update",
          };
      }
    },
    [colors.accentPrimary, colors.chipBackground],
  );

  const handlePress = (item: NotificationRead) => {
    router.push({
      pathname: "/notification/[id]",
      params: { id: item.id },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Inbox</Text>
            <Text style={styles.heroSubtitle}>
              Your focus updates and milestones.
            </Text>
          </View>
          <View style={styles.heroIconWrap}>
            <Ionicons
              name="notifications-outline"
              size={60}
              color={colors.accentSecondary}
            />
          </View>
        </View>

        <View style={styles.list}>
          {loading ? (
            <Text style={styles.cardHint}>Loading notifications…</Text>
          ) : error ? (
            <Text style={styles.cardError}>{error}</Text>
          ) : items.length === 0 ? (
            <Text style={styles.cardHint}>
              No notifications yet. Start a session or invite friends to get
              updates.
            </Text>
          ) : (
            items.map((notification) => {
              const meta = getNotificationMeta(notification);
              return (
                <Pressable
                  key={notification.id}
                  style={styles.card}
                  onPress={() => handlePress(notification)}
                  android_ripple={{ color: colors.chipBackground }}
                >
                  <View style={styles.cardLeft}>
                    <View
                      style={[
                        styles.cardIcon,
                        { backgroundColor: meta.iconBackground },
                      ]}
                    >
                      <Ionicons
                        name={meta.iconName}
                        size={28}
                        color={meta.iconColor}
                      />
                    </View>
                  </View>
                  <View style={styles.cardCenter}>
                    <Text style={styles.cardTitle}>
                      {notification.title ?? "Notification"}
                    </Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{meta.badge}</Text>
                    </View>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={styles.cardTime}>
                      {formatRelativeTime(notification.created_at)}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
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
      paddingTop: 36,
      paddingBottom: 160,
      backgroundColor: colors.background,
    },
    hero: {
      backgroundColor: colors.accentPrimary,
      borderRadius: 28,
      padding: 24,
      marginBottom: 28,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.12,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 14 },
      elevation: 16,
    },
    heroText: {
      flex: 1,
      marginRight: 18,
    },
    heroTitle: {
      fontSize: 30,
      fontWeight: "700",
      color: colors.accentOnPrimary,
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: 16,
      color: colors.heroTextSecondary,
      lineHeight: 22,
    },
    heroIconWrap: {
      width: 70,
      height: 70,
      borderRadius: 24,
      backgroundColor: colors.heroAccent,
      alignItems: "center",
      justifyContent: "center",
    },
    list: {
      gap: 16,
    },
    cardHint: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    cardError: {
      fontSize: 13,
      color: colors.destructive,
    },
    card: {
      backgroundColor: colors.cardElevated,
      borderRadius: 20,
      paddingVertical: 20,
      paddingHorizontal: 18,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
    cardLeft: {
      marginRight: 14,
    },
    cardIcon: {
      width: 52,
      height: 52,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    cardCenter: {
      flex: 1,
      marginRight: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 10,
    },
    badge: {
      alignSelf: "flex-start",
      backgroundColor: colors.chipBackground,
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    badgeText: {
      color: colors.chipText,
      fontWeight: "600",
      fontSize: 13,
    },
    cardRight: {
      alignItems: "flex-end",
    },
    cardTime: {
      fontSize: 13,
      color: colors.textMuted,
    },
  });
