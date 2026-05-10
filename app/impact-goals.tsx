import { AuthContext } from "@/context/AuthContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import * as storage from "@/utils/storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useContext, useState } from "react";
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Goal {
  id: string;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  createdAt: string;
}

export default function ImpactGoalsScreen() {
  const navigation = useNavigation();
  const auth = useContext(AuthContext);
  const bg = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");

  const [goals, setGoals] = useState<Goal[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: "",
    category: "Health",
    targetAmount: "",
    deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  });

  const categories = [
    "Health",
    "Education",
    "Environment",
    "Food",
    "Housing",
    "Other",
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!auth?.user) {
        setGoals([]);
        setDonations([]);
        setLoading(false);
        return;
      }

      const savedGoals =
        (await storage.loadForUser(auth.user, "impactGoals", [])) || [];
      setGoals(savedGoals);

      const donations_ =
        (await storage.loadForUser(auth.user, "donations", [])) || [];
      setDonations(donations_);
    } catch (e) {
      console.warn("goals load failed", e);
    } finally {
      setLoading(false);
    }
  }, [auth?.user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const addGoal = async () => {
    if (!newGoal.name || !newGoal.targetAmount) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const goal: Goal = {
      id: `goal-${Date.now()}`,
      name: newGoal.name,
      category: newGoal.category,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: 0,
      deadline: newGoal.deadline,
      createdAt: new Date().toISOString(),
    };

    try {
      const updated = [...goals, goal];
      await storage.saveForUser(auth.user, "impactGoals", updated);
      setGoals(updated);
      setShowModal(false);
      setNewGoal({
        name: "",
        category: "Health",
        targetAmount: "",
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      });
      Alert.alert("Success", "Goal created!");
    } catch (e) {
      Alert.alert("Error", "Failed to create goal");
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const updated = goals.filter((g) => g.id !== goalId);
      await storage.saveForUser(auth.user, "impactGoals", updated);
      setGoals(updated);
    } catch (e) {
      Alert.alert("Error", "Failed to delete goal");
    }
  };

  const getGoalProgress = (goal: Goal) => {
    // Calculate how much of this goal has been met by donations
    const donationsForGoal = donations.filter(
      (d) =>
        (d.allocationCategory || d.projectId || "").toLowerCase() ===
        goal.category.toLowerCase(),
    );
    const totalForGoal = donationsForGoal.reduce(
      (s, d) => s + (Number(d.amount) || 0),
      0,
    );
    return totalForGoal;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: 16 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginBottom: 16 }}
          >
            <Text style={{ color: "#2563eb", fontWeight: "600" }}>← Back</Text>
          </TouchableOpacity>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <View>
              <Text style={[styles.title, { color: text }]}>Impact Goals</Text>
              <Text style={{ color: "#666", fontSize: 13, marginTop: 4 }}>
                Set and track your giving targets
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowModal(true)}
              style={{
                backgroundColor: "#10b981",
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>
                + New Goal
              </Text>
            </TouchableOpacity>
          </View>

          {goals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎯</Text>
              <Text style={[styles.emptyText, { color: text }]}>
                No goals yet
              </Text>
              <Text style={styles.emptySubtext}>
                Create a goal to track your giving progress
              </Text>
            </View>
          ) : (
            goals.map((goal) => {
              const progress = getGoalProgress(goal);
              const percentage = Math.min(
                (progress / goal.targetAmount) * 100,
                100,
              );
              const daysLeft = Math.max(
                0,
                Math.ceil(
                  (new Date(goal.deadline).getTime() - Date.now()) /
                    (24 * 60 * 60 * 1000),
                ),
              );
              const isCompleted = progress >= goal.targetAmount;

              return (
                <View
                  key={goal.id}
                  style={[
                    styles.goalCard,
                    isCompleted && styles.goalCardCompleted,
                  ]}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.goalName, { color: text }]}>
                        {goal.name}
                      </Text>
                      <View style={{ flexDirection: "row", marginTop: 4 }}>
                        <View
                          style={[
                            styles.goalBadge,
                            { backgroundColor: "#e0f2fe" },
                          ]}
                        >
                          <Text style={{ fontSize: 11, color: "#0369a1" }}>
                            {goal.category}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.goalBadge,
                            { backgroundColor: "#fef3c7" },
                          ]}
                        >
                          <Text style={{ fontSize: 11, color: "#92400e" }}>
                            {daysLeft} days left
                          </Text>
                        </View>
                      </View>
                    </View>
                    {isCompleted && <Text style={{ fontSize: 20 }}>✅</Text>}
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${percentage}%`,
                          backgroundColor: isCompleted ? "#10b981" : "#3b82f6",
                        },
                      ]}
                    />
                  </View>

                  {/* Progress Text */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 8,
                    }}
                  >
                    <Text style={[styles.progressText, { color: text }]}>
                      ${progress.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
                    </Text>
                    <Text style={styles.percentText}>
                      {Math.round(percentage)}%
                    </Text>
                  </View>

                  {/* Delete Button */}
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        "Delete Goal?",
                        `Are you sure you want to delete "${goal.name}"?`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            onPress: () => deleteGoal(goal.id),
                            style: "destructive",
                          },
                        ],
                      )
                    }
                    style={{ marginTop: 12 }}
                  >
                    <Text
                      style={{
                        color: "#ef4444",
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      Remove Goal
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>

      {/* Modal for adding new goal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: bg }]}>
            <Text style={[styles.modalTitle, { color: text }]}>
              Create New Goal
            </Text>

            <Text style={[styles.inputLabel, { color: text }]}>Goal Name</Text>
            <TextInput
              placeholder="e.g., 'Support clean water'"
              placeholderTextColor="#999"
              value={newGoal.name}
              onChangeText={(v) => setNewGoal({ ...newGoal, name: v })}
              style={[styles.input, { color: text }]}
            />

            <Text style={[styles.inputLabel, { color: text }]}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 12 }}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setNewGoal({ ...newGoal, category: cat })}
                  style={[
                    styles.categoryChip,
                    newGoal.category === cat && styles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      newGoal.category === cat && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabel, { color: text }]}>
              Target Amount ($)
            </Text>
            <TextInput
              placeholder="e.g., 500"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={newGoal.targetAmount}
              onChangeText={(v) => setNewGoal({ ...newGoal, targetAmount: v })}
              style={[styles.input, { color: text }]}
            />

            <Text style={[styles.inputLabel, { color: text }]}>Deadline</Text>
            <TextInput
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
              value={newGoal.deadline}
              onChangeText={(v) => setNewGoal({ ...newGoal, deadline: v })}
              style={[styles.input, { color: text }]}
            />

            <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={[
                  styles.modalButton,
                  { backgroundColor: "#e5e7eb", flex: 1 },
                ]}
              >
                <Text style={{ color: "#374151", fontWeight: "700" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={addGoal}
                style={[
                  styles.modalButton,
                  { backgroundColor: "#10b981", flex: 1 },
                ]}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Create Goal
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 26, fontWeight: "800" },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: "#999" },
  goalCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  goalCardCompleted: { backgroundColor: "#f0fdf4", borderColor: "#86efac" },
  goalName: { fontSize: 15, fontWeight: "700" },
  goalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
  },
  progressContainer: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: { height: "100%", borderRadius: 4 },
  progressText: { fontSize: 13, fontWeight: "700" },
  percentText: { fontSize: 13, fontWeight: "700", color: "#3b82f6" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    width: "100%",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: "#dbeafe", borderColor: "#0369a1" },
  categoryChipText: { fontSize: 12, color: "#666", fontWeight: "600" },
  categoryChipTextActive: { color: "#0369a1" },
  modalButton: { paddingVertical: 12, borderRadius: 8, alignItems: "center" },
});
