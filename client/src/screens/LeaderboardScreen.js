import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = 'http://54.90.157.246:3000';

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/leaderboard`);
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return '#667eea';
  };

  const renderLeaderboardItem = ({ item, index }) => (
    <View style={styles.leaderboardItem}>
      <View style={styles.rankContainer}>
        <Text style={[styles.rankText, { color: getRankColor(item.rank) }]}>
          {getRankIcon(item.rank)}
        </Text>
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.fullName}>{item.full_name}</Text>
      </View>
      
      <View style={styles.pointsContainer}>
        <Text style={styles.points}>{item.total_points}</Text>
        <Text style={styles.pointsLabel}>points</Text>
      </View>
      
      <View style={styles.levelContainer}>
        <Text style={styles.level}>Lv.{item.level}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Leaderboard</Text>
        <TouchableOpacity onPress={loadLeaderboard}>
          <Ionicons name="refresh" size={24} color="#667eea" />
        </TouchableOpacity>
      </View>

      <View style={styles.topThree}>
        {leaderboard.slice(0, 3).map((user, index) => (
          <View key={user.id} style={[styles.topUser, { backgroundColor: getRankColor(user.rank) + '20' }]}>
            <Text style={styles.topRank}>{getRankIcon(user.rank)}</Text>
            <Text style={styles.topUsername}>{user.username}</Text>
            <Text style={styles.topPoints}>{user.total_points} pts</Text>
          </View>
        ))}
      </View>

      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.leaderboardList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  topThree: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  topUser: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    minWidth: 80,
  },
  topRank: {
    fontSize: 24,
    marginBottom: 5,
  },
  topUsername: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  topPoints: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  leaderboardList: {
    padding: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  fullName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  pointsContainer: {
    alignItems: 'center',
    marginRight: 15,
  },
  points: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#666',
  },
  levelContainer: {
    alignItems: 'center',
  },
  level: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});
