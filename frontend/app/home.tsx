import { useState } from "react";
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

type GroupSummary = {
  id: string;
  name: string;
  goalPerMember: number;
  unit: "hours";
  youLogged: number;
  teamLogged: number;
  teamTarget: number;
};

const MOCK_GROUPS: GroupSummary[] = [
  {
    id: "midterm-study-squad",
    name: "Midterm Study Squad",
    goalPerMember: 5,
    unit: "hours",
    youLogged: 4,
    teamLogged: 9,
    teamTarget: 15,
  },
  {
    id: "workout-buddies",
    name: "Workout Buddies",
    goalPerMember: 10,
    unit: "hours",
    youLogged: 3,
    teamLogged: 6,
    teamTarget: 30,
  },
  {
    id: "coders-unite",
    name: "Coders Unite",
    goalPerMember: 8,
    unit: "hours",
    youLogged: 1,
    teamLogged: 4,
    teamTarget: 40,
  },
];

export default function Home() {
  const [groups, setGroups] = useState<GroupSummary[]>(MOCK_GROUPS);

  const handleGroupPress = (group: GroupSummary) => {
    Alert.alert(group.name, "Full group dashboards are on the roadmap.");
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
                    <Pressable
                      style={styles.deleteButton}
                      onPress={(event) => handleDeletePress(event, item)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.groupDetail}>
                    Goal: {item.goalPerMember} {item.unit} per member
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
                    You: {item.youLogged}h | Team: {item.teamLogged}h /{" "}
                    {item.teamTarget}h
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E9F5F0",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  heading: {
    fontSize: 30,
    fontWeight: "700",
    color: "#0B3B3C",
    marginBottom: 24,
  },
  listContent: {
    paddingBottom: 16,
  },
  groupCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#0B3B3C",
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
    gap: 12,
  },
  groupName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F2239",
  },
  groupDetail: {
    fontSize: 14,
    color: "#4F5D73",
    marginTop: 6,
  },
  progressTrack: {
    height: 12,
    borderRadius: 12,
    backgroundColor: "#E2ECF4",
    marginTop: 16,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 12,
    backgroundColor: "#0EA58B",
  },
  deleteButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#F8E5E5",
  },
  deleteButtonText: {
    color: "#C34747",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyState: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F2239",
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#4F5D73",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyCta: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#0EA58B",
  },
  emptyCtaText: {
    color: "#F5FFFB",
    fontSize: 15,
    fontWeight: "600",
  },
});
