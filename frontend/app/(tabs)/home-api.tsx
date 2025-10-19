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
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { ThemeColors, useTheme } from "../../theme/ThemeProvider";
import { useGroups } from "../../hooks/useGroups";
import { useAuth } from "../../hooks/useAuth";
import { Group } from "../../services/groups";

// Convert API Group to GroupSummary format for compatibility
const convertGroupToSummary = (group: Group) => ({
  id: group.id,
  name: group.name,
  goalPerMember: group.target_hours_per_member,
  unit: "hours" as const,
  youLogged: 0, // This would come from user progress data
  teamLogged: 0, // This would come from group progress data
  teamTarget: group.target_hours_per_member, // This would be calculated from members
  status: group.status as "active" | "cooldown" | "paused",
});

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { groups, isLoading, error, fetchGroups, leaveGroup } = useGroups();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  // Convert API groups to the format expected by the UI
  const groupSummaries = useMemo(() => 
    groups.map(convertGroupToSummary), 
    [groups]
  );

  const [refreshing, setRefreshing] = useState(false);

  // Refresh groups when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchGroups();
      }
    }, [isAuthenticated, fetchGroups])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchGroups();
    } finally {
      setRefreshing(false);
    }
  }, [fetchGroups]);

  const handleGroupPress = (group: any) => {
    router.push({ pathname: "/group/[id]", params: { id: group.id } });
  };

  const handleDeletePress = async (
    event: GestureResponderEvent,
    group: any
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
          onPress: async () => {
            try {
              await leaveGroup(group.id);
              Alert.alert("Success", "You have left the group successfully.");
            } catch (error) {
              Alert.alert("Error", "Failed to leave group. Please try again.");
            }
          },
        },
      ]
    );
  };

  // Show loading state
  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your circles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={fetchGroups}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Show empty state
  if (groupSummaries.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No circles yet</Text>
          <Text style={styles.emptyMessage}>
            Create your first circle or join an existing one to start your focus journey.
          </Text>
          <Pressable
            style={styles.createButton}
            onPress={() => router.push("/create-group")}
          >
            <Text style={styles.createButtonText}>Create Circle</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Circles</Text>
        <Text style={styles.subtitle}>
          {groupSummaries.length} circle{groupSummaries.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={groupSummaries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.groupCard}
            onPress={() => handleGroupPress(item)}
          >
            <View style={styles.groupHeader}>
              <Text style={styles.groupName}>{item.name}</Text>
              <Pressable
                style={styles.deleteButton}
                onPress={(e) => handleDeletePress(e, item)}
              >
                <Text style={styles.deleteButtonText}>×</Text>
              </Pressable>
            </View>
            
            <View style={styles.groupStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{item.youLogged}</Text>
                <Text style={styles.statLabel}>Your Hours</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{item.teamLogged}</Text>
                <Text style={styles.statLabel}>Team Hours</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{item.teamTarget}</Text>
                <Text style={styles.statLabel}>Target</Text>
              </View>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min((item.teamLogged / item.teamTarget) * 100, 100)}%`,
                    backgroundColor: item.status === 'active' ? colors.success : colors.warning,
                  },
                ]}
              />
            </View>

            <View style={styles.groupFooter}>
              <Text style={styles.statusText}>
                Status: {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </Pressable>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.error,
      marginBottom: 8,
    },
    errorMessage: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    emptyMessage: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 24,
    },
    createButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    createButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: '600',
    },
    header: {
      padding: 20,
      paddingBottom: 10,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    listContainer: {
      padding: 20,
      paddingTop: 10,
    },
    groupCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    groupHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    groupName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    deleteButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.error,
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: 'bold',
    },
    groupStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    progressBar: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      marginBottom: 8,
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    groupFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statusText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  });
