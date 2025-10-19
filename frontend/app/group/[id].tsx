import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ThemeColors, useTheme } from "../../theme/ThemeProvider";
import { useAppContext } from "../providers/AppProvider";
import {
  createSession,
  createTimeLog,
  ensureSessionParticipant,
  getGroup,
  getGroupProgress,
  updateSessionStatus,
  type GroupProgressRow,
  type GroupRead,
  type SessionRead,
} from "../lib/api";

type MemberProgress = {
  id: string;
  name: string;
  role: string;
  loggedMinutes: number;
  targetMinutes: number;
  remainingMinutes: number;
  isCurrentUser: boolean;
};

const formatMinutes = (totalMinutes: number) => {
  const minutes = Math.round(totalMinutes);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) {
    return `${remainder}m`;
  }
  if (remainder === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainder}m`;
};

const formatDateTime = (value: string | null | undefined, timezone: string) => {
  if (!value) {
    return "Not set";
  }
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  });
  try {
    return formatter.format(new Date(value));
  } catch {
    return formatter.format(new Date(value));
  }
};

const formatElapsed = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
  ];
  return parts.join(":");
};

const minutesToHours = (minutes: number) => Math.round((minutes / 60) * 10) / 10;

type SessionBuckets = {
  upcoming: SessionRead[];
  past: SessionRead[];
};

const bucketSessions = (sessions: SessionRead[]): SessionBuckets => {
  const upcomingStatuses = new Set<SessionRead["status"]>([
    "scheduled",
    "running",
    "paused",
  ]);
  const upcoming: SessionRead[] = [];
  const past: SessionRead[] = [];

  sessions.forEach((session) => {
    if (upcomingStatuses.has(session.status)) {
      upcoming.push(session);
    } else {
      past.push(session);
    }
  });

  upcoming.sort((a, b) => {
    const aTime = a.started_at ? new Date(a.started_at).getTime() : 0;
    const bTime = b.started_at ? new Date(b.started_at).getTime() : 0;
    return aTime - bTime;
  });

  past.sort((a, b) => {
    const aTime = a.started_at ? new Date(a.started_at).getTime() : 0;
    const bTime = b.started_at ? new Date(b.started_at).getTime() : 0;
    return bTime - aTime;
  });

  return { upcoming, past };
};

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile } = useAppContext();

  const [group, setGroup] = useState<GroupRead | null>(null);
  const [progressRows, setProgressRows] = useState<GroupProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (sessionStart) {
      timer = setInterval(() => {
        setElapsedMs(Date.now() - sessionStart.getTime());
      }, 1000);
    } else {
      setElapsedMs(0);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [sessionStart]);

  const loadGroup = useCallback(async () => {
    if (!id) {
      setError("Missing group id");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [groupData, progressData] = await Promise.all([
        getGroup(id),
        getGroupProgress(id),
      ]);
      setGroup(groupData);
      setProgressRows(progressData);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load this circle.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadGroup();
  }, [loadGroup]);

  const members = useMemo<MemberProgress[]>(() => {
    if (!group) {
      return [];
    }
    return group.members
      .map((member) => {
        const row = progressRows.find((item) => item.user_id === member.user_id);
        const targetMinutes =
          row?.target_minutes ??
          member.override_period_target_minutes ??
          group.period_target_minutes;
        const loggedMinutes = row ? row.seconds_done / 60 : 0;
        return {
          id: member.id,
          name:
            member.user?.display_name ??
            member.user?.email ??
            "Unnamed teammate",
          role: member.role,
          loggedMinutes,
          targetMinutes,
          remainingMinutes: Math.max(targetMinutes - loggedMinutes, 0),
          isCurrentUser: member.user_id === profile?.id,
        };
      })
      .sort((a, b) => b.loggedMinutes - a.loggedMinutes);
  }, [group, progressRows, profile?.id]);

  const sessionBuckets = useMemo(() => {
    if (!group) {
      return { upcoming: [], past: [] };
    }
    return bucketSessions(group.sessions);
  }, [group]);

  const handleStartSession = async () => {
    if (!group || !profile) {
      Alert.alert("Not ready", "We need your profile before starting a session.");
      return;
    }
    if (activeSessionId || sessionStart) {
      return;
    }
    setSaving(true);
    try {
      const now = new Date();
      const session = await createSession({
        group_id: group.id,
        scheduled_start: now.toISOString(),
      });
      await updateSessionStatus(session.id, {
        status: "running",
        timestamp: now.toISOString(),
      });
      await ensureSessionParticipant(session.id);
      setActiveSessionId(session.id);
      setSessionStart(now);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not start the session.";
      Alert.alert("Start session", message);
    } finally {
      setSaving(false);
    }
  };

  const handleStopSession = async () => {
    if (!group || !profile || !activeSessionId || !sessionStart) {
      return;
    }
    setSaving(true);
    try {
      const end = new Date();
      await updateSessionStatus(activeSessionId, {
        status: "ended",
        timestamp: end.toISOString(),
      });
      const participant = await ensureSessionParticipant(activeSessionId);
      await createTimeLog(activeSessionId, {
        user_id: participant.user_id,
        started_at: sessionStart.toISOString(),
        ended_at: end.toISOString(),
      });
      Alert.alert("Session logged", "Great work staying locked in.");
      setActiveSessionId(null);
      setSessionStart(null);
      setElapsedMs(0);
      await loadGroup();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not finish the session.";
      Alert.alert("Finish session", message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.accentPrimary} size="large" />
          <Text style={styles.centerText}>Loading group...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadGroup}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <Text style={styles.errorText}>Group not found.</Text>
          <Pressable style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const statusLabel =
    group.status === "active"
      ? "Active"
      : group.status === "pending"
      ? "Pending"
      : "Archived";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.groupName}>{group.name}</Text>
          {group.description ? (
            <Text style={styles.groupDescription}>{group.description}</Text>
          ) : null}
          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaChip}>
              <Ionicons name="flag-outline" size={18} color={colors.textPrimary} />
              <Text style={styles.heroMetaText}>
                {minutesToHours(group.period_target_minutes)}h target
              </Text>
            </View>
            <View style={styles.heroMetaChip}>
              <Ionicons
                name="time-outline"
                size={18}
                color={colors.textPrimary}
              />
              <Text style={styles.heroMetaText}>
                {group.period === "daily" ? "Daily cadence" : "Weekly cadence"}
              </Text>
            </View>
            <View style={styles.heroMetaChip}>
              <Ionicons
                name="ellipse-outline"
                size={18}
                color={colors.textPrimary}
              />
              <Text style={styles.heroMetaText}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={styles.heroSchedule}>
            Runs {formatDateTime(group.start_at, group.timezone)} →{" "}
            {formatDateTime(group.end_at, group.timezone)}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Member progress</Text>
            <Text style={styles.sectionMeta}>{members.length} people</Text>
          </View>
          {members.map((member) => (
            <View
              key={member.id}
              style={[
                styles.memberRow,
                member.isCurrentUser && styles.memberRowHighlight,
              ]}
            >
              <View style={styles.memberInfo}>
                <Ionicons
                  name="person-circle-outline"
                  size={28}
                  color={colors.accentPrimary}
                />
                <View style={styles.memberText}>
                  <Text style={styles.memberName}>
                    {member.name}
                    {member.isCurrentUser ? " (you)" : ""}
                  </Text>
                  <Text style={styles.memberMeta}>
                    {formatMinutes(member.loggedMinutes)} of{" "}
                    {formatMinutes(member.targetMinutes)}
                  </Text>
                </View>
              </View>
              <View style={styles.memberProgress}>
                <Text style={styles.memberRole}>{member.role.toUpperCase()}</Text>
                <Text style={styles.memberRemaining}>
                  {formatMinutes(member.remainingMinutes)} left
                </Text>
              </View>
            </View>
          ))}
          {members.length === 0 ? (
            <Text style={styles.emptyHint}>
              No members yet — invite teammates from the admin dashboard.
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Focus session</Text>
          </View>
          <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>
              {activeSessionId ? "Currently locked in" : "Ready to focus?"}
            </Text>
            <Text style={styles.timerValue}>{formatElapsed(elapsedMs)}</Text>
            <View style={styles.timerActions}>
              {activeSessionId ? (
                <Pressable
                  style={[styles.timerButton, styles.timerStop]}
                  onPress={handleStopSession}
                  disabled={saving}
                >
                  <Text style={styles.timerButtonText}>
                    {saving ? "Saving…" : "Clock out"}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.timerButton, styles.timerStart]}
                  onPress={handleStartSession}
                  disabled={saving}
                >
                  <Text style={styles.timerButtonText}>
                    {saving ? "Starting…" : "Clock in"}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming sessions</Text>
            <Text style={styles.sectionMeta}>
              {sessionBuckets.upcoming.length}
            </Text>
          </View>
          {sessionBuckets.upcoming.length === 0 ? (
            <Text style={styles.emptyHint}>
              No scheduled sessions yet. Start one to get things rolling.
            </Text>
          ) : (
            sessionBuckets.upcoming.map((session) => (
              <View key={session.id} style={styles.sessionRow}>
                <View>
                  <Text style={styles.sessionTitle}>
                    {session.status === "running"
                      ? "In progress"
                      : "Scheduled"}
                  </Text>
                  <Text style={styles.sessionMeta}>
                    {formatDateTime(session.started_at, group.timezone)}
                  </Text>
                </View>
                <Text style={styles.sessionStatus}>{session.status}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent sessions</Text>
            <Text style={styles.sectionMeta}>
              {sessionBuckets.past.length}
            </Text>
          </View>
          {sessionBuckets.past.length === 0 ? (
            <Text style={styles.emptyHint}>
              No past sessions yet. Clock in to build history.
            </Text>
          ) : (
            sessionBuckets.past.map((session) => (
              <View key={session.id} style={styles.sessionRow}>
                <View>
                  <Text style={styles.sessionTitle}>Ended session</Text>
                  <Text style={styles.sessionMeta}>
                    {formatDateTime(session.started_at, group.timezone)} →{" "}
                    {formatDateTime(session.ended_at, group.timezone)}
                  </Text>
                </View>
                <Text style={styles.sessionStatus}>{session.status}</Text>
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
    content: {
      paddingBottom: 120,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 24,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    backLabel: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    centerState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    centerText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
    errorText: {
      color: colors.destructive,
      fontSize: 16,
      textAlign: "center",
      marginBottom: 16,
    },
    retryButton: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.accentPrimary,
    },
    retryText: {
      color: colors.accentOnPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    heroCard: {
      marginTop: 24,
      marginHorizontal: 24,
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.08,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 12 },
      elevation: 12,
    },
    groupName: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 8,
    },
    groupDescription: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 18,
    },
    heroMetaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 12,
    },
    heroMetaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.chipBackground,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    heroMetaText: {
      color: colors.textPrimary,
      fontWeight: "600",
      fontSize: 13,
    },
    heroSchedule: {
      fontSize: 13,
      color: colors.textMuted,
    },
    section: {
      marginTop: 28,
      marginHorizontal: 24,
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.05,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    sectionMeta: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    memberRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    memberRowHighlight: {
      backgroundColor: colors.chipBackground,
      borderRadius: 12,
      paddingHorizontal: 12,
    },
    memberInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    memberText: {
      flex: 1,
    },
    memberName: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    memberMeta: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    memberProgress: {
      alignItems: "flex-end",
      gap: 4,
    },
    memberRole: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textSecondary,
    },
    memberRemaining: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    emptyHint: {
      marginTop: 8,
      fontSize: 13,
      color: colors.textSecondary,
    },
    timerCard: {
      backgroundColor: colors.navBackground,
      borderRadius: 18,
      padding: 24,
      alignItems: "center",
      gap: 16,
    },
    timerLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    timerValue: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.textPrimary,
      letterSpacing: 2,
    },
    timerActions: {
      flexDirection: "row",
      gap: 12,
    },
    timerButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 14,
    },
    timerStart: {
      backgroundColor: colors.accentPrimary,
    },
    timerStop: {
      backgroundColor: colors.destructive,
    },
    timerButtonText: {
      color: colors.accentOnPrimary,
      fontWeight: "700",
      fontSize: 15,
    },
    sessionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    sessionTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    sessionMeta: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    sessionStatus: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
  });

