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
  groupSummaries,
  type GroupSummary,
} from "../../constants/groups";

export default function Home() {
  const [groups, setGroups] = useState<GroupSummary[]>(() =>
    groupSummaries.map((group) => ({ ...group }))
  );
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      setGroups(groupSummaries.map((group) => ({ ...group })));
    }, [])
  );

  const handleGroupPress = (group: GroupSummary) => {
    router.push({ pathname: "/group/[id]", params: { id: group.id } });
  };

  const handleDeletePress = (
    event: GestureResponderEvent,
    group: GroupSummary
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
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.heading}>Home</Text>

        {groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No circles yet</Text>
            <Text style={styles.emptySubtitle}>
              Once you join or create a circle, you will see shared goals and
              progress here.
            </Text>
            <Pressable
              onPress={() =>
                Alert.alert("Circles", "Hook this up to your join/create flows.")
              }
              style={styles.emptyCta}
            >
              <Text style={styles.emptyCtaText}>Explore circles</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={groups}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
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
                    <View
                      style={[
                        styles.statusPill,
                        item.status === "active"
                          ? styles.statusActive
                          : item.status === "cooldown"
                          ? styles.statusCooldown
                          : styles.statusPaused,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          item.status === "active"
                            ? styles.dotActive
                            : item.status === "cooldown"
                            ? styles.dotCooldown
                            : styles.dotPaused,
                        ]}
                      />
                      <Text style={styles.statusText}>
                        {item.status === "active"
                          ? "Active"
                          : item.status === "cooldown"
                          ? "Cooldown"
                          : "Paused"}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={(event) => handleDeletePress(event, item)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.groupDetail}>
                    Goal: {formatHours(item.goalPerMember)} {item.unit} per member
                  </Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${fillWidth}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.groupDetail}>
                    You: {formatHours(item.youLogged)}h | Team: {formatHours(
                      item.teamLogged
                    )}h / {formatHours(item.teamTarget)}h
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

const formatHours = (value: number) => {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 140,
    },
    heading: {
      fontSize: 30,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 24,
    },
    listContent: {
      paddingBottom: 160,
    },
    groupCard: {
      backgroundColor: colors.cardElevated,
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
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
      marginBottom: 4,
    },
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 999,
      paddingVertical: 4,
      paddingHorizontal: 10,
      marginLeft: 8,
      gap: 6,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    statusActive: {
      backgroundColor: "rgba(97, 228, 168, 0.14)",
      borderColor: "rgba(97, 228, 168, 0.5)",
    },
    statusCooldown: {
      backgroundColor: "rgba(255, 198, 64, 0.14)",
      borderColor: "rgba(255, 198, 64, 0.5)",
    },
    statusPaused: {
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
    dotCooldown: {
      backgroundColor: "#FFC640",
    },
    dotPaused: {
      backgroundColor: "#7C8192",
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    groupName: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
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
