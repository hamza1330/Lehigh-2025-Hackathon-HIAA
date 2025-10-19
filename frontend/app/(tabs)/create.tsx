import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ThemeColors, useTheme } from "../../theme/ThemeProvider";

type ArchivedGroup = {
  id: string;
  name: string;
  goalPerMember: string;
  archivedOn: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
};

const archivedGroups: ArchivedGroup[] = [
  {
    id: "finals",
    name: "Finals Study Crew",
    goalPerMember: "5 hours per member",
    archivedOn: "Oct 10, 2025",
    iconName: "people-circle",
    iconColor: "#1B6CF5",
    iconBg: "rgba(27,108,245,0.12)",
  },
  {
    id: "gym-rats",
    name: "Gym Rat Pack",
    goalPerMember: "5 hours per member",
    archivedOn: "Aug 5, 2025",
    iconName: "fitness-outline",
    iconColor: "#F58B1B",
    iconBg: "rgba(245,139,27,0.12)",
  },
];

export default function Create() {
  const [groups] = useState(archivedGroups);
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleCreatePress = () => {
    Alert.alert("Create group", "Hook up the creation wizard next.");
  };

  const handleJoinPress = () => {
    Alert.alert("Join with code", "Show the join modal once ready.");
  };

  const handleRestorePress = (groupName: string) => {
    Alert.alert("Reopen circle", `Bring ${groupName} back in a future update.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={styles.title}>Create or Join a Group</Text>
            <Text style={styles.subtitle}>
              Focus together, just like old times.
            </Text>
          </View>
          <View style={styles.heroIllustration}>
            <Ionicons name="hourglass-outline" size={64} color="#1B6CF5" />
          </View>
        </View>

        <Pressable style={styles.primaryButton} onPress={handleCreatePress}>
          <Text style={styles.primaryButtonText}>Create New Group</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={handleJoinPress}>
          <Text style={styles.secondaryButtonText}>Join with Code</Text>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Archived Groups</Text>
        </View>

        <View style={styles.cardList}>
          {groups.map((group) => (
            <View key={group.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View
                  style={[styles.avatar, { backgroundColor: group.iconBg }]}
                >
                  <Ionicons name={group.iconName} size={28} color={group.iconColor} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{group.name}</Text>
                  <Text style={styles.cardDetail}>Goal: {group.goalPerMember}</Text>
                  <Text style={styles.cardMeta}>
                    Archived {group.archivedOn}
                  </Text>
                </View>
              </View>
              <Pressable
                style={styles.restoreButton}
                onPress={() => handleRestorePress(group.name)}
              >
                <Ionicons name="refresh" size={22} color="#1B6CF5" />
              </Pressable>
            </View>
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
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.heroBackground,
      borderRadius: 28,
      padding: 24,
      marginBottom: 28,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.08,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 12,
    },
    heroText: {
      flex: 1,
      marginRight: 16,
    },
    heroIllustration: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: colors.heroAccent,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
    },
    primaryButton: {
      backgroundColor: colors.accentPrimary,
      borderRadius: 18,
      paddingVertical: 18,
      alignItems: "center",
      marginBottom: 16,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 10,
    },
    primaryButtonText: {
      color: colors.accentOnPrimary,
      fontSize: 18,
      fontWeight: "700",
    },
    secondaryButton: {
      backgroundColor: colors.accentSecondary,
      borderRadius: 18,
      paddingVertical: 18,
      alignItems: "center",
      marginBottom: 28,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
    secondaryButtonText: {
      color: colors.accentOnSecondary,
      fontSize: 18,
      fontWeight: "700",
    },
    sectionHeader: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    cardList: {
      gap: 16,
    },
    card: {
      backgroundColor: colors.cardElevated,
      borderRadius: 20,
      padding: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.06,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
    cardRow: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      marginRight: 12,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 16,
      marginRight: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    cardText: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 4,
    },
    cardDetail: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    cardMeta: {
      fontSize: 13,
      color: colors.textMuted,
    },
    restoreButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.chipBackground,
    },
  });
