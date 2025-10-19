import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  notifications,
  type NotificationItem,
} from "../../constants/notifications";
import { ThemeColors, useTheme } from "../../theme/ThemeProvider";

export default function NotificationDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const notification = notifications.find((item) => item.id === id);

  const handlePrimaryAction = (item: NotificationItem) => {
    if (item.ctaTarget) {
      router.replace(item.ctaTarget);
    } else {
      router.back();
    }
  };

  if (!notification) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Notification not found</Text>
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconWrap}>
              <Ionicons
                name={notification.iconName}
                size={34}
                color={notification.iconColor}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.cardSubtitle}>{notification.detail}</Text>
              <Text style={styles.cardMeta}>{notification.ago}</Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>{notification.title}</Text>
          <Text style={styles.cardDescription}>{notification.description}</Text>

          {notification.ctaLabel ? (
            <Pressable
              style={styles.primaryButton}
              onPress={() => handlePrimaryAction(notification)}
            >
              <Text style={styles.primaryButtonText}>
                {notification.ctaLabel}
              </Text>
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
