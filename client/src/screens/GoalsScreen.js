import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://54.90.157.246:3000';

export default function GoalsScreen() {
  const [goals, setGoals] = useState([]);
  const [user, setUser] = useState(null);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    goal_type: 'work',
    duration: 'daily',
    target_value: 1,
    points_per_completion: 10,
  });

  useEffect(() => {
    loadUserData();
    loadGoals();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadGoals = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_BASE}/api/goals`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setGoals(data);
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const createGoal = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_BASE}/api/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newGoal),
      });

      if (response.ok) {
        setShowAddGoal(false);
        setNewGoal({
          title: '',
          description: '',
          goal_type: 'work',
          duration: 'daily',
          target_value: 1,
          points_per_completion: 10,
        });
        loadGoals();
        Alert.alert('Success', 'Goal created successfully!');
      } else {
        Alert.alert('Error', 'Failed to create goal');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      Alert.alert('Error', 'Network error');
    }
  };

  const completeGoal = async (goalId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_BASE}/api/goals/${goalId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          notes: 'Completed via mobile app',
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Goal completed! +50 points');
        loadGoals();
      } else {
        Alert.alert('Error', 'Failed to complete goal');
      }
    } catch (error) {
      console.error('Error completing goal:', error);
      Alert.alert('Error', 'Network error');
    }
  };

  const getGoalTypeIcon = (type) => {
    switch (type) {
      case 'work': return '💼';
      case 'study': return '📚';
      case 'fitness': return '🏃‍♂️';
      case 'personal': return '🎯';
      case 'location': return '📍';
      default: return '🎯';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'active': return '#2196F3';
      case 'paused': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const renderGoal = ({ item }) => (
    <View style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalIcon}>{getGoalTypeIcon(item.goal_type)}</Text>
        <View style={styles.goalInfo}>
          <Text style={styles.goalTitle}>{item.title}</Text>
          <Text style={styles.goalDescription}>{item.description}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.goalProgress}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(item.current_value / item.target_value) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {item.current_value}/{item.target_value} completed
        </Text>
      </View>

      <View style={styles.goalActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => completeGoal(item.id)}
        >
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.actionText}>Complete</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="eye" size={20} color="#2196F3" />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Goals</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddGoal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {user && (
        <View style={styles.userStats}>
          <Text style={styles.welcomeText}>Welcome back, {user.full_name}!</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.total_points || 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Level {user.level || 1}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{goals.length}</Text>
              <Text style={styles.statLabel}>Goals</Text>
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={goals}
        renderItem={renderGoal}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.goalsList}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={showAddGoal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Goal</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Goal Title"
              value={newGoal.title}
              onChangeText={(text) => setNewGoal({...newGoal, title: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={newGoal.description}
              onChangeText={(text) => setNewGoal({...newGoal, description: text})}
              multiline
            />
            
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddGoal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.createButton}
                onPress={createGoal}
              >
                <Text style={styles.createButtonText}>Create Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addButton: {
    backgroundColor: '#667eea',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userStats: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  goalsList: {
    padding: 20,
  },
  goalCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  goalIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  goalDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  goalProgress: {
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  goalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  actionText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
