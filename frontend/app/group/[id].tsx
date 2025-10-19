import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  applyGroupDetailUpdate,
  cloneGroupDetail,
  computeSummary,
  formatDuration,
  type SessionItem,
  type GroupMember,
  type GroupStatus,
  type GroupDetail,
  type GroupSummary,
} from "../../constants/groups";
import { ThemeColors, useTheme } from "../../theme/ThemeProvider";

const statusMeta: Record<
  GroupStatus,
  { label: string; color: string; background: string }
> = {
  active: {
    label: "Active",
    color: "#0EA58B",
    background: "rgba(97, 228, 168, 0.16)",
  },
  cooldown: {
    label: "Cooldown",
    color: "#F5A21B",
    background: "rgba(255, 198, 64, 0.16)",
  },
  paused: {
    label: "Paused",
    color: "#7C8192",
    background: "rgba(124, 129, 146, 0.18)",
  },
};

const memberStatusMeta: Record<
  GroupMember["status"],
  { color: string; label: string }
> = {
  active: { color: "#0EA58B", label: "Active" },
  paused: { color: "#7C8192", label: "Cooling off" },
  behind: { color: "#FF6B6B", label: "Needs focus" },
};

type LockState = "idle" | "running" | "summary";

type SessionSummary = {
  memberName: string;
  durationMinutes: number;
  start: Date;
  end: Date;
  remainingMinutes: number;
};

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const initialDetail = useMemo(
    () => (id ? cloneGroupDetail(id) : undefined),
    [id]
  );
  const [groupData, setGroupData] = useState<GroupDetail | undefined>(
    initialDetail
  );
  const [summaryData, setSummaryData] = useState<GroupSummary | undefined>(
    initialDetail ? computeSummary(initialDetail) : undefined
  );
  const [activeTab, setActiveTab] = useState<"leaderboard" | "sessions">("leaderboard");
  const [lockState, setLockState] = useState<LockState>("idle");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);

  useEffect(() => {
    if (initialDetail) {
      setGroupData(initialDetail);
      setSummaryData(computeSummary(initialDetail));
    }
  }, [initialDetail]);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (lockState === "running" && startTime) {
      timer = setInterval(() => {
        setElapsedMs(Date.now() - startTime.getTime());
      }, 250);
    } else if (lockState !== "summary") {
      setElapsedMs(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [lockState, startTime]);

  const scheduledSessions = useMemo(() => {
    if (!groupData) return [];
    return [...groupData.sessions.scheduled].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  }, [groupData]);
  const pastSessions = useMemo(() => {
    if (!groupData) return [];
    return [...groupData.sessions.past].sort(
      (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()
    );
  }, [groupData]);

  if (!groupData || !summaryData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.missingState}>
          <Text style={styles.missingTitle}>Group not found</Text>
          <Text style={styles.missingSubtitle}>
            This circle may have been archived. Head back to the home dashboard
            to see the latest groups.
          </Text>
          <Pressable
            style={styles.missingButton}
            onPress={() => router.replace("/(tabs)/home")}
          >
            <Text style={styles.missingButtonText}>Back to Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const statusBadge = statusMeta[groupData.status];

  const handleClockIn = () => {
    const now = new Date();
    setStartTime(now);
    setElapsedMs(0);
    setSessionSummary(null);
    setLockState("running");
  };

  const handleSchedule = () => {
    Alert.alert(
      "Schedule session",
      "We will let you pick a future lock-in time and notify your circle once the backend integration is ready."
    );
  };

  const handleClockOut = () => {
    if (!groupData || !startTime) {
      setLockState("summary");
      return;
    }
    const end = new Date();
    const durationMs = end.getTime() - startTime.getTime();
    const durationMinutes = Math.max(1, Math.round(durationMs / 60000));
    const memberIndex = groupData.members.findIndex(
      (member) => member.id === groupData.focusMemberId
    );
    const focusMember =
      memberIndex >= 0 ? groupData.members[memberIndex] : groupData.members[0];
    const loggedMinutes = focusMember.loggedMinutes + durationMinutes;
    const remainingMinutes = Math.max(
      focusMember.targetMinutes - loggedMinutes,
      0
    );

    const updatedMember: GroupMember = {
      ...focusMember,
      loggedMinutes,
      remainingMinutes,
      status: remainingMinutes > 0 ? focusMember.status : "active",
    };

    const updatedMembers = [...groupData.members];
    const replaceIndex = memberIndex >= 0 ? memberIndex : 0;
    updatedMembers[replaceIndex] = updatedMember;
    updatedMembers.sort((a, b) => b.loggedMinutes - a.loggedMinutes);

    const newSession: SessionItem = {
      id: `session-${Date.now()}`,
      memberId: updatedMember.id,
      memberName: updatedMember.name,
      avatarColor: updatedMember.avatarColor,
      iconName: updatedMember.iconName,
      status: "completed",
      start: startTime.toISOString(),
      end: end.toISOString(),
      durationMinutes,
      note: "Recorded via LockIN mobile session.",
    };

    const updatedGroup: GroupDetail = {
      ...groupData,
      members: updatedMembers,
      sessions: {
        scheduled: [...groupData.sessions.scheduled],
        past: [newSession, ...groupData.sessions.past],
      },
    };

    const recalculatedSummary = computeSummary(updatedGroup);
    const persistedSummary = applyGroupDetailUpdate(updatedGroup);
    setGroupData(updatedGroup);
    setSummaryData(persistedSummary ?? recalculatedSummary);

    setSessionSummary({
      memberName: updatedMember.name,
      durationMinutes,
      start: startTime,
      end,
      remainingMinutes,
    });
    setElapsedMs(durationMs);
    setStartTime(null);
    setActiveTab("leaderboard");
    setLockState("summary");
  };

  const handleSummaryDismiss = () => {
    setLockState("idle");
    setSessionSummary(null);
    setElapsedMs(0);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.appName}>LockIN</Text>
            <View style={styles.heroMascot}>
              <Ionicons name="hourglass-outline" size={26} color="#FFC640" />
            </View>
          </View>

          <View style={styles.heroBody}>
            <View style={styles.heroTitleRow}>
              <Ionicons name="ribbon-outline" size={22} color="#FFC640" />
              <Text style={styles.heroTitle}>{groupData.name}</Text>
            </View>
            <Text style={styles.heroSubtitle}>{groupData.description}</Text>

            <View style={styles.heroChips}>
              <View style={styles.heroChipPrimary}>
                <Ionicons name="flag-outline" size={18} color="#FFFFFF" />
                <Text style={styles.heroChipPrimaryText}>
                  Target: {formatHoursLabel(summaryData.goalPerMember)} per member
                </Text>
              </View>
              <View
                style={[
                  styles.heroChipStatus,
                  { backgroundColor: statusBadge.background },
                ]}
              >
                <Ionicons
                  name="radio-button-on"
                  size={16}
                  color={statusBadge.color}
                />
                <Text
                  style={[styles.heroChipStatusText, { color: statusBadge.color }]}
                >
                  {statusBadge.label}
                </Text>
              </View>
            </View>
            <View style={styles.heroActions}>
              <Pressable
                style={[
                  styles.clockButton,
                  lockState !== "idle" && { opacity: 0.6 },
                ]}
                onPress={handleClockIn}
                disabled={lockState !== "idle"}
              >
                <Ionicons name="timer-outline" size={20} color="#FFFFFF" />
                <Text style={styles.clockButtonText}>
                  {lockState === "running"
                    ? "Currently Locked In"
                    : lockState === "summary"
                    ? "Reviewing Session"
                    : "Clock In"}
                </Text>
              </Pressable>

              <Pressable style={styles.scheduleButton} onPress={handleSchedule}>
                <Ionicons name="calendar-outline" size={18} color="#1B2F58" />
                <Text style={styles.scheduleButtonText}>Schedule</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.tabBar}>
          <TabButton
            label="Leaderboard"
            isActive={activeTab === "leaderboard"}
            onPress={() => setActiveTab("leaderboard")}
            colors={colors}
          />
          <TabButton
            label="Sessions"
            isActive={activeTab === "sessions"}
            onPress={() => setActiveTab("sessions")}
            colors={colors}
          />
        </View>

        <View style={styles.sectionHeader}>
          {activeTab === "leaderboard" ? (
            <>
              <Text style={styles.sectionTitle}>Todays Progress</Text>
              <Text style={styles.sectionMeta}>
                Team {formatHoursLabel(summaryData.teamLogged)} /{" "}
                {formatHoursLabel(summaryData.teamTarget)}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Sessions</Text>
              <Text style={styles.sectionMeta}>
                Upcoming {scheduledSessions.length} | Past {pastSessions.length}
              </Text>
            </>
          )}
        </View>

        {activeTab === "leaderboard" ? (
          <View style={styles.memberList}>
            {groupData.members.map((member) => {
              const memberMeta = memberStatusMeta[member.status];
              const progress =
                member.targetMinutes === 0
                  ? 0
                  : Math.min(member.loggedMinutes / member.targetMinutes, 1);

              return (
                <View key={member.id} style={styles.memberCard}>
                  <View style={styles.memberHeader}>
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: member.avatarColor },
                      ]}
                    >
                      <Ionicons
                        name={member.iconName}
                        size={26}
                        color="#1B2F58"
                      />
                    </View>

                    <View style={styles.memberNames}>
                      <View style={styles.memberNameRow}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <View
                          style={[
                            styles.memberStatusDot,
                            { backgroundColor: memberMeta.color },
                          ]}
                        />
                        <Text
                          style={[
                            styles.memberStatusText,
                            { color: memberMeta.color },
                          ]}
                        >
                          {memberMeta.label}
                        </Text>
                      </View>
                      <Text style={styles.memberTotals}>
                        {formatDuration(member.loggedMinutes)} /{" "}
                        {formatDuration(member.targetMinutes)}
                      </Text>
                    </View>

                    <View style={styles.memberRight}>
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={colors.textMuted ?? colors.textSecondary}
                      />
                      <Text style={styles.memberRemaining}>
                        {formatDuration(member.remainingMinutes)} left
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.max(progress * 100, 6)}%`,
                          backgroundColor: member.progressColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <SessionSections
            scheduled={scheduledSessions}
            past={pastSessions}
            colors={colors}
          />
        )}
      </ScrollView>
      <ClockInModal
        visible={lockState !== "idle"}
        mode={lockState === "summary" ? "summary" : "running"}
        startTime={startTime}
        elapsedMs={elapsedMs}
        summary={sessionSummary}
        onClockOut={handleClockOut}
        onDone={handleSummaryDismiss}
        styles={styles}
      />
    </SafeAreaView>
  );
}

const formatHoursLabel = (value: number) => {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}h` : `${rounded.toFixed(1)}h`;
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 140,
    },
    hero: {
      backgroundColor: "#1B6CF5",
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      paddingTop: 20,
      paddingHorizontal: 24,
      paddingBottom: 28,
      marginBottom: 24,
      shadowColor: "#0F1E3D",
      shadowOpacity: 0.22,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 14,
    },
    heroHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 24,
    },
    backButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.4)",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.1)",
    },
    appName: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: 1,
    },
    heroMascot: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: "rgba(255,255,255,0.18)",
      alignItems: "center",
      justifyContent: "center",
    },
    heroBody: {},
    heroTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 10,
    },
    heroTitle: {
      color: "#FFFFFF",
      fontSize: 26,
      fontWeight: "700",
    },
    heroSubtitle: {
      color: "rgba(255,255,255,0.85)",
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 18,
    },
    heroChips: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    heroChipPrimary: {
      backgroundColor: "rgba(255,255,255,0.14)",
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    heroChipPrimaryText: {
      color: "#FFFFFF",
      fontWeight: "600",
      fontSize: 13,
    },
    heroChipStatus: {
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    heroChipStatusText: {
      fontWeight: "600",
      fontSize: 13,
    },
    heroActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 18,
    },
    clockButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: "rgba(0,0,0,0.2)",
      borderRadius: 999,
      paddingVertical: 10,
      paddingHorizontal: 18,
    },
    clockButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },
    scheduleButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 999,
      backgroundColor: "#FFFFFF",
    },
    scheduleButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#1B2F58",
    },
    tabBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      marginBottom: 12,
      paddingHorizontal: 24,
      gap: 12,
    },
    sectionHeader: {
      paddingHorizontal: 24,
      marginBottom: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    sectionMeta: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    memberList: {
      paddingHorizontal: 24,
      gap: 18,
    },
    memberCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    memberHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 14,
      gap: 14,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    memberNames: {
      flex: 1,
    },
    memberNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 6,
    },
    memberName: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    memberStatusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    memberStatusText: {
      fontSize: 12,
      fontWeight: "600",
    },
    memberTotals: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    memberRight: {
      alignItems: "flex-end",
      gap: 4,
    },
    memberRemaining: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "600",
    },
    progressTrack: {
      height: 12,
      borderRadius: 999,
      backgroundColor: colors.progressTrack,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: colors.progressFill,
    },
    missingState: {
      flex: 1,
      paddingHorizontal: 32,
      paddingTop: 160,
      backgroundColor: colors.background,
      alignItems: "center",
    },
    missingTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 12,
    },
    missingSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 24,
    },
    missingButton: {
      backgroundColor: colors.accentPrimary,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 24,
    },
    missingButtonText: {
      color: colors.accentOnPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalBody: {
      flex: 1,
      paddingHorizontal: 28,
      paddingTop: 80,
      paddingBottom: 40,
      alignItems: "center",
    },
    modalTitle: {
      fontSize: 32,
      fontWeight: "800",
      color: colors.textPrimary,
      textAlign: "center",
      marginBottom: 16,
    },
    modalMessage: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 48,
    },
    modalTimer: {
      fontSize: 56,
      fontWeight: "800",
      color: colors.accentPrimary,
      marginBottom: 16,
    },
    modalClockInTime: {
      fontSize: 15,
      color: colors.textSecondary,
      marginBottom: 48,
    },
    modalSummaryGroup: {
      alignSelf: "stretch",
      gap: 14,
      marginBottom: 48,
    },
    modalSummaryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
    },
    modalSummaryIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.chipBackground,
    },
    modalSummaryText: {
      flex: 1,
    },
    modalSummaryLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    modalSummaryValue: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.textPrimary,
      marginTop: 2,
    },
    modalStopButton: {
      marginTop: "auto",
      alignSelf: "stretch",
      backgroundColor: "#FF6B6B",
      paddingVertical: 18,
      borderRadius: 18,
      alignItems: "center",
    },
    modalStopText: {
      color: "#FFFFFF",
      fontSize: 17,
      fontWeight: "700",
    },
  });

type TabButtonProps = {
  label: string;
  isActive: boolean;
  onPress: () => void;
  colors: ThemeColors;
};

function TabButton({ label, isActive, onPress, colors }: TabButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          flex: 1,
          alignItems: "center",
          paddingVertical: 10,
          borderRadius: 999,
          backgroundColor: isActive ? colors.chipBackground : "transparent",
          borderWidth: isActive ? 0 : 1,
          borderColor: isActive ? "transparent" : colors.cardBorder,
        },
      ]}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: isActive ? colors.textPrimary : colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type SessionSectionsProps = {
  scheduled: SessionItem[];
  past: SessionItem[];
  colors: ThemeColors;
};

function SessionSections({ scheduled, past, colors }: SessionSectionsProps) {
  return (
    <View style={{ paddingHorizontal: 24, gap: 24, paddingBottom: 80 }}>
      <SessionSection
        title="Scheduled"
        emptyMessage="No upcoming sessions yet. Add one to keep your circle aligned."
        sessions={scheduled}
        colors={colors}
        accent="scheduled"
      />
      <SessionSection
        title="Past"
        emptyMessage="No past focus blocks logged yet."
        sessions={past}
        colors={colors}
        accent="completed"
      />
    </View>
  );
}

type SessionSectionProps = {
  title: string;
  sessions: SessionItem[];
  emptyMessage: string;
  colors: ThemeColors;
  accent: "scheduled" | "completed";
};

function SessionSection({
  title,
  sessions,
  emptyMessage,
  colors,
  accent,
}: SessionSectionProps) {
  const accentColor =
    accent === "scheduled" ? "#1B6CF5" : colors.textSecondary;
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: colors.textPrimary,
          }}
        >
          {title}
        </Text>
        <View
          style={{
            flex: 1,
            height: 1,
            backgroundColor: colors.divider,
          }}
        />
      </View>
      {sessions.length === 0 ? (
        <View
          style={{
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            backgroundColor: colors.card,
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            {emptyMessage}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {sessions.map((session) => (
            <View
              key={session.id}
              style={{
                flexDirection: "row",
                gap: 14,
                padding: 16,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                backgroundColor: colors.card,
                shadowColor: colors.shadowColor,
                shadowOpacity: 0.04,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 5,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: session.avatarColor,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={session.iconName}
                  size={22}
                  color="#1B2F58"
                />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: colors.textPrimary,
                    }}
                  >
                    {session.memberName}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 999,
                      backgroundColor:
                        accent === "scheduled"
                          ? "rgba(27,108,245,0.12)"
                          : colors.chipBackground,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: accentColor,
                        textTransform: "uppercase",
                      }}
                    >
                      {session.status === "scheduled" ? "Scheduled" : "Completed"}
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  {formatSessionWindow(session)}
                </Text>
                {session.note ? (
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 13,
                      lineHeight: 18,
                    }}
                  >
                    {session.note}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const formatSessionWindow = (session: SessionItem) => {
  const start = new Date(session.start);
  const end = session.end ? new Date(session.end) : undefined;
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const dateLabel = formatter.format(start);
  const timeRange = end
    ? `${timeFormatter.format(start)} - ${timeFormatter.format(end)}`
    : timeFormatter.format(start);

  const duration =
    session.durationMinutes != null
      ? ` | ${formatDuration(session.durationMinutes)}`
      : end
      ? ` | ${formatDuration(
          Math.round((end.getTime() - start.getTime()) / 60000)
        )}`
      : "";

  return `${dateLabel} | ${timeRange}${duration}`;
};

type ClockInModalProps = {
  visible: boolean;
  mode: "running" | "summary";
  startTime: Date | null;
  elapsedMs: number;
  onClockOut: () => void;
  onDone: () => void;
  summary: SessionSummary | null;
  styles: ReturnType<typeof createStyles>;
};

function ClockInModal({
  visible,
  mode,
  startTime,
  elapsedMs,
  onClockOut,
  onDone,
  summary,
  styles,
}: ClockInModalProps) {
  const startTimeText = startTime
    ? `Clocked in at ${formatClockInTimestamp(startTime)}`
    : "Preparing timer...";

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={() => {}}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalBody}>
          {mode === "running" ? (
            <>
              <Text style={styles.modalTitle}>You&apos;re Locked In</Text>
              <Text style={styles.modalMessage}>
                Stay focused and keep the streak alive. Do not navigate away – your future self will thank you!
              </Text>
              <Text style={styles.modalTimer}>{formatElapsed(elapsedMs)}</Text>
              <Text style={styles.modalClockInTime}>{startTimeText}</Text>

              <Pressable style={styles.modalStopButton} onPress={onClockOut}>
                <Text style={styles.modalStopText}>Clock Out</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.modalTitle}>Session Complete</Text>
              <Text style={styles.modalMessage}>
                Great work staying locked in. Here&apos;s what you just accomplished.
              </Text>
              <View style={styles.modalSummaryGroup}>
                <SummaryRow
                  icon="timer-outline"
                  label="Focus time"
                  value={
                    summary
                      ? formatDuration(summary.durationMinutes)
                      : formatElapsed(elapsedMs)
                  }
                  styles={styles}
                />
                <SummaryRow
                  icon="play-outline"
                  label="Started"
                  value={
                    summary ? formatClockInTimestamp(summary.start) : startTimeText
                  }
                  styles={styles}
                />
                <SummaryRow
                  icon="stop-outline"
                  label="Finished"
                  value={
                    summary
                      ? formatClockInTimestamp(summary.end)
                      : formatClockInTimestamp(new Date())
                  }
                  styles={styles}
                />
                <SummaryRow
                  icon="flag-outline"
                  label="Remaining to goal"
                  value={
                    summary
                      ? summary.remainingMinutes <= 0
                        ? "Goal complete!"
                        : `${formatDuration(summary.remainingMinutes)} left`
                      : "-"
                  }
                  styles={styles}
                />
              </View>

              <Pressable style={styles.modalStopButton} onPress={onDone}>
                <Text style={styles.modalStopText}>Back to group</Text>
              </Pressable>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

type SummaryRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
};

function SummaryRow({ icon, label, value, styles }: SummaryRowProps) {
  return (
    <View style={styles.modalSummaryRow}>
      <View style={styles.modalSummaryIcon}>
        <Ionicons name={icon} size={20} color="#1B2F58" />
      </View>
      <View style={styles.modalSummaryText}>
        <Text style={styles.modalSummaryLabel}>{label}</Text>
        <Text style={styles.modalSummaryValue}>{value}</Text>
      </View>
    </View>
  );
}

const formatElapsed = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
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

const formatClockInTimestamp = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return formatter.format(date);
};












