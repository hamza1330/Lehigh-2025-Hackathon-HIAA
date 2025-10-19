import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  GestureResponderEvent,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { ThemeColors, useTheme } from "../../theme/ThemeProvider";
import {
  getGroupProgress,
  listGroups,
  type GroupListItem,
  type GroupProgressRow,
  type GroupStatus,
} from "../lib/api";
import { useAppContext } from "../providers/AppProvider";

type DashboardGroup = {
  id: string;
  name: string;
  description: string | null;
  status: GroupStatus;
  goalPerMember: number;
  unit: "hours";
  youLogged: number;
  teamLogged: number;
  teamTarget: number;
};

const secondsToHours = (seconds: number) => seconds / 3600;
const minutesToHours = (minutes: number) => minutes / 60;
const roundHours = (hours: number) => Math.round(hours * 10) / 10;
const formatHours = (value: number) => roundHours(value).toFixed(1);

export default function Home() {
  const [groups, setGroups] = useState<DashboardGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { profile, loadingProfile } = useAppContext();

  const computeSummary = useCallback(
    (group: GroupListItem, progress: GroupProgressRow[]): DashboardGroup => {
      const teamLoggedHours = roundHours(
        progress.reduce(
          (sum, row) => sum + secondsToHours(row.seconds_done),
          0,
        ),
      );
      const teamTargetHours = roundHours(
        progress.reduce(
          (sum, row) => sum + minutesToHours(row.target_minutes),
          0,
        ),
      );
      const youLoggedHours = roundHours(
        progress.reduce((sum, row) => {
          if (row.user_id === profile?.id) {
            return sum + secondsToHours(row.seconds_done);
          }
          return sum;
        }, 0),
      );

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        status: group.status,
        goalPerMember: roundHours(minutesToHours(group.period_target_minutes)),
        unit: "hours",
        youLogged: youLoggedHours,
        teamLogged: teamLoggedHours,
        teamTarget: teamTargetHours,
      };
    },
    [profile?.id],
  );

  const loadGroups = useCallback(async () => {
    if (!profile) {
      setGroups([]);
      return;
    }
    setLoading(true);
    try {
      const groupList = await listGroups();
      const summaries = await Promise.all(
        groupList.map(async (group) => {
          const progress = await getGroupProgress(group.id);
          return computeSummary(group, progress);
        }),
      );
      setGroups(summaries);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load circles right now.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [computeSummary, profile]);

  useFocusEffect(
    useCallback(() => {
      if (!loadingProfile) {
        void loadGroups();
      }
    }, [loadGroups, loadingProfile]),
  );

  const handleGroupPress = (group: DashboardGroup) => {
    router.push({ pathname: "/group/[id]", params: { id: group.id } });
  };

  const handleDeletePress = (
    event: GestureResponderEvent,
    group: DashboardGroup,
  ) => {
    event.stopPropagation();
    Alert.alert(
      "Remove circle",
      `Are you sure you want to leave "${group.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, remove",
          style: "destructive",
          onPress: () =>
            setGroups((prev) => prev.filter((item) => item.id !== group.id)),
        },
      ],
    );
  };

  const statusMeta = useMemo(
    () => ({
      active: {
        chip: styles.statusActive,
        dot: styles.dotActive,
        label: "Active",
      },
      pending: {
        chip: styles.statusPending,
        dot: styles.dotPending,
        label: "Pending",
      },
      archived: {
        chip: styles.statusArchived,
        dot: styles.dotArchived,
        label: "Archived",
      },
    }),
    [styles],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.heading}>Home</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>Loading circles...</Text>
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No circles yet</Text>
            <Text style={styles.emptySubtitle}>
              Once you join or create a circle, you will see shared goals and
              progress here.
            </Text>
            <Pressable
              onPress={() =>
                Alert.alert(
                  "Circles",
                  "Use the Create tab to spin up your first circle.",
                )
              }
              style={styles.emptyCta}
            >
              <Text style={styles.emptyCtaText}>Create a circle</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={groups}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const statusStyles = statusMeta[item.status];
              const progress =
                item.teamTarget === 0
                  ? 0
                  : Math.min(item.teamLogged / item.teamTarget, 1);
              const fillWidth = progress === 0 ? 0 : Math.max(progress * 100, 6);

              return (
                <Pressable
                  style={styles.groupCard}
                  onPress={() => handleGroupPress(item)}
                >
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupName}>{item.name}</Text>
                    <View style={[styles.statusPill, statusStyles.chip]}>
                      <View style={[styles.statusDot, statusStyles.dot]} />
                      <Text style={styles.statusText}>{statusStyles.label}</Text>
                    </View>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={(event) => handleDeletePress(event, item)}
                    >
                      <Text style={styles.deleteButtonText}>Leave</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.groupDetail}>
                    Goal: {formatHours(item.goalPerMember)} {item.unit} per member
                  </Text>
                  <Text style={styles.groupDetail}>
                    Team {formatHours(item.teamLogged)} {item.unit} /{" "}
                    {formatHours(item.teamTarget)} {item.unit}
                  </Text>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${fillWidth}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.groupDetail}>
                    You logged {formatHours(item.youLogged)} {item.unit} this period
                  </Text>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 40,
      backgroundColor: colors.background,
    },
    heading: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 16,
    },
    errorText: {
      color: colors.destructive,
      fontSize: 14,
      marginBottom: 12,
    },
    loadingState: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 28,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginTop: 40,
    },
    loadingText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    listContent: {
      paddingBottom: 120,
      gap: 16,
    },
    groupCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 8,
    },
    groupHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    groupName: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
      flex: 1,
      marginRight: 12,
    },
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 999,
      paddingVertical: 4,
      paddingHorizontal: 10,
      gap: 6,
      borderWidth: 1,
    },
    statusActive: {
      backgroundColor: "rgba(97, 228, 168, 0.14)",
      borderColor: "rgba(97, 228, 168, 0.5)",
    },
    statusPending: {
      backgroundColor: "rgba(255, 198, 64, 0.14)",
      borderColor: "rgba(255, 198, 64, 0.4)",
    },
    statusArchived: {
      backgroundColor: "rgba(124, 129, 146, 0.14)",
      borderColor: "rgba(124, 129, 146, 0.4)",
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    dotActive: {
      backgroundColor: "#61E4A8",
    },
    dotPending: {
      backgroundColor: "#FFC640",
    },
    dotArchived: {
      backgroundColor: "#7C8192",
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    groupDetail: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 6,
    },
    progressTrack: {
      height: 12,
      borderRadius: 12,
      backgroundColor: colors.progressTrack,
      marginTop: 16,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 12,
      backgroundColor: colors.progressFill,
    },
    deleteButton: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: colors.destructiveBg,
      marginLeft: 12,
    },
    deleteButtonText: {
      color: colors.destructive,
      fontSize: 13,
      fontWeight: "600",
    },
    emptyState: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 28,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 60,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    emptyTitle: {
      fontSize: 20,
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
    emptyCta: {
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: colors.accentPrimary,
    },
    emptyCtaText: {
      color: colors.accentOnPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
  });

