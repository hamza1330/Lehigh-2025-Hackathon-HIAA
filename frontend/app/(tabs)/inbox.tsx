import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  notifications,
  type NotificationItem,
} from "../../constants/notifications";
import { ThemeColors, useTheme } from "../../theme/ThemeProvider";

export default function Inbox() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handlePress = (item: NotificationItem) => {
    router.push(item.targetRoute);
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
          {notifications.map((notification) => (
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
                    {
                      backgroundColor: isDark
                        ? colors.chipBackground
                        : notification.iconBg,
                    },
                  ]}
                >
                  <Ionicons
                    name={notification.iconName}
                    size={28}
                    color={notification.iconColor}
                  />
                </View>
              </View>
              <View style={styles.cardCenter}>
                <Text style={styles.cardTitle}>{notification.title}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notification.detail}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardTime}>{notification.ago}</Text>
              </View>
            </Pressable>
          ))}
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
