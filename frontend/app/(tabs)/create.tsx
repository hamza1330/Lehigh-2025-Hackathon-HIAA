import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
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
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { listGroups, type GroupListItem } from "../lib/api";

type ArchivedGroupCard = {
  id: string;
  name: string;
  goalPerMemberHours: number;
  archivedOn: string;
};

export default function Create() {
  const [groups, setGroups] = useState<ArchivedGroupCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const loadArchivedGroups = useCallback(async () => {
    setLoading(true);
    try {
      const archived = await listGroups("archived");
      const formatter = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const mapped: ArchivedGroupCard[] = archived.map((group: GroupListItem) => ({
        id: group.id,
        name: group.name,
        goalPerMemberHours: Math.round((group.period_target_minutes / 60) * 10) / 10,
        archivedOn: formatter.format(new Date(group.updated_at ?? group.end_at)),
      }));
      setGroups(mapped);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load archived circles right now.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadArchivedGroups();
    }, [loadArchivedGroups]),
  );

  const handleCreatePress = () => {
    router.push("/create-group");
  };

  const handleJoinPress = () => {
    Alert.alert("Join with code", "Show the join modal once ready.");
  };

  const handleRestorePress = (groupName: string) => {
    Alert.alert(
      "Reopen circle",
      `We'll bring "${groupName}" back in a future update.`
    );
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
          {loading ? (
            <Text style={styles.cardHint}>Loading archived circles…</Text>
          ) : error ? (
            <Text style={styles.cardError}>{error}</Text>
          ) : groups.length === 0 ? (
            <Text style={styles.cardHint}>
              No archived circles yet. Keep locking in!
            </Text>
          ) : (
            groups.map((group) => (
              <View key={group.id} style={styles.card}>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{group.name}</Text>
                  <Text style={styles.cardDetail}>
                    Target: {group.goalPerMemberHours} hours per member
                  </Text>
                  <Text style={styles.cardMeta}>
                    Archived {group.archivedOn}
                  </Text>
                </View>
                <Pressable
                  style={styles.restoreButton}
                  onPress={() => handleRestorePress(group.name)}
                >
                  <Ionicons name="refresh" size={22} color="#1B6CF5" />
                </Pressable>
              </View>
            ))
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
    cardText: {
      flex: 1,
      marginRight: 12,
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
