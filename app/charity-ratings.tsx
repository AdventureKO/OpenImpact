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
    View
} from "react-native";

interface CharityRating {
  id: string;
  charityId: string;
  charityName: string;
  rating: number;
  review: string;
  author: string;
  categories: {
    transparency: number;
    impact: number;
    efficiency: number;
    communication: number;
  };
  createdAt: string;
}

export default function CharityRatingsScreen() {
  const navigation = useNavigation();
  const auth = useContext(AuthContext);
  const bg = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");

  const [ratings, setRatings] = useState<CharityRating[]>([]);
  const [charityStats, setCharityStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newRating, setNewRating] = useState({
    charityName: "",
    rating: 5,
    transparency: 5,
    impact: 5,
    efficiency: 5,
    communication: 5,
    review: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const saved = (await storage.load("charityRatings", [])) || [];
      setRatings(saved);

      // Calculate stats per charity
      const stats: Record<string, any> = {};
      saved.forEach((r: CharityRating) => {
        if (!stats[r.charityId]) {
          stats[r.charityId] = {
            name: r.charityName,
            count: 0,
            avgRating: 0,
            avgTransparency: 0,
            avgImpact: 0,
            avgEfficiency: 0,
            avgCommunication: 0,
            sum: {
              rating: 0,
              transparency: 0,
              impact: 0,
              efficiency: 0,
              communication: 0,
            },
          };
        }
        stats[r.charityId].count += 1;
        stats[r.charityId].sum.rating += r.rating;
        stats[r.charityId].sum.transparency += r.categories.transparency;
        stats[r.charityId].sum.impact += r.categories.impact;
        stats[r.charityId].sum.efficiency += r.categories.efficiency;
        stats[r.charityId].sum.communication += r.categories.communication;
      });

      Object.keys(stats).forEach((id) => {
        const s = stats[id];
        s.avgRating = Math.round((s.sum.rating / s.count) * 10) / 10;
        s.avgTransparency =
          Math.round((s.sum.transparency / s.count) * 10) / 10;
        s.avgImpact = Math.round((s.sum.impact / s.count) * 10) / 10;
        s.avgEfficiency = Math.round((s.sum.efficiency / s.count) * 10) / 10;
        s.avgCommunication =
          Math.round((s.sum.communication / s.count) * 10) / 10;
      });

      setCharityStats(stats);
    } catch (e) {
      console.warn("ratings load failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const submitRating = async () => {
    if (!newRating.charityName.trim()) {
      Alert.alert("Error", "Please enter a charity/org name");
      return;
    }

    const rating: CharityRating = {
      id: `rating-${Date.now()}`,
      charityId: `org-${newRating.charityName.toLowerCase().replace(/\s+/g, "-")}`,
      charityName: newRating.charityName,
      rating: newRating.rating,
      review: newRating.review,
      author: auth?.user?.name || "Anonymous",
      categories: {
        transparency: newRating.transparency,
        impact: newRating.impact,
        efficiency: newRating.efficiency,
        communication: newRating.communication,
      },
      createdAt: new Date().toISOString(),
    };

    try {
      const updated = [...ratings, rating];
      await storage.save("charityRatings", updated);
      setRatings(updated);
      setShowModal(false);
      setNewRating({
        charityName: "",
        rating: 5,
        transparency: 5,
        impact: 5,
        efficiency: 5,
        communication: 5,
        review: "",
      });
      Alert.alert("Success", "Thank you for your review!");
      load();
    } catch (e) {
      Alert.alert("Error", "Failed to submit rating");
    }
  };

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View style={{ flexDirection: "row" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Text key={i} style={{ fontSize: size, marginRight: 2 }}>
            {i <= Math.round(rating) ? "⭐" : "☆"}
          </Text>
        ))}
      </View>
    );
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
              <Text style={[styles.title, { color: text }]}>
                Charity Ratings
              </Text>
              <Text style={{ color: "#666", fontSize: 13, marginTop: 4 }}>
                Community-driven trust scores
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
                + Review
              </Text>
            </TouchableOpacity>
          </View>

          {Object.keys(charityStats).length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>⭐</Text>
              <Text style={[styles.emptyText, { color: text }]}>
                No ratings yet
              </Text>
              <Text style={styles.emptySubtext}>
                Be the first to review a charity
              </Text>
            </View>
          ) : (
            <View>
              {Object.entries(charityStats)
                .sort((a, b) => b[1].avgRating - a[1].avgRating)
                .map(([charityId, stats]) => (
                  <View
                    key={charityId}
                    style={[styles.ratingCard, { borderLeftColor: "#f59e0b" }]}
                  >
                    <View style={{ marginBottom: 10 }}>
                      <Text style={[styles.charityName, { color: text }]}>
                        {stats.name}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 6,
                        }}
                      >
                        {renderStars(stats.avgRating, 14)}
                        <Text
                          style={{ marginLeft: 8, fontSize: 12, color: "#666" }}
                        >
                          {stats.avgRating.toFixed(1)} ({stats.count} review
                          {stats.count > 1 ? "s" : ""})
                        </Text>
                      </View>
                    </View>

                    {/* Category Scores */}
                    <View style={styles.categoryScores}>
                      <View style={styles.categoryScore}>
                        <Text style={styles.categoryLabel}>Transparency</Text>
                        <Text style={styles.categoryValue}>
                          {stats.avgTransparency.toFixed(1)}
                        </Text>
                      </View>
                      <View style={styles.categoryScore}>
                        <Text style={styles.categoryLabel}>Impact</Text>
                        <Text style={styles.categoryValue}>
                          {stats.avgImpact.toFixed(1)}
                        </Text>
                      </View>
                      <View style={styles.categoryScore}>
                        <Text style={styles.categoryLabel}>Efficiency</Text>
                        <Text style={styles.categoryValue}>
                          {stats.avgEfficiency.toFixed(1)}
                        </Text>
                      </View>
                      <View style={styles.categoryScore}>
                        <Text style={styles.categoryLabel}>Communication</Text>
                        <Text style={styles.categoryValue}>
                          {stats.avgCommunication.toFixed(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
            </View>
          )}

          {/* Recent Reviews */}
          {ratings.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={[styles.sectionTitle, { color: text }]}>
                Recent Reviews
              </Text>
              {ratings
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .slice(0, 5)
                .map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={{ marginBottom: 8 }}>
                      <Text style={[styles.reviewAuthor, { color: text }]}>
                        {review.author}
                      </Text>
                      <View style={{ marginTop: 4 }}>
                        {renderStars(review.rating, 12)}
                      </View>
                    </View>
                    {review.review && (
                      <Text style={[styles.reviewText, { color: text }]}>
                        {review.review}
                      </Text>
                    )}
                  </View>
                ))}
            </View>
          )}

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>

      {/* Modal for adding rating */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: bg }]}>
            <Text style={[styles.modalTitle, { color: text }]}>
              Rate a Charity
            </Text>

            <Text style={[styles.inputLabel, { color: text }]}>
              Charity/Organization Name
            </Text>
            <TextInput
              placeholder="e.g., Hope Foundation"
              placeholderTextColor="#999"
              value={newRating.charityName}
              onChangeText={(v) =>
                setNewRating({ ...newRating, charityName: v })
              }
              style={[styles.input, { color: text }]}
            />

            {/* Overall Rating */}
            <Text style={[styles.inputLabel, { color: text }]}>
              Overall Rating
            </Text>
            <View style={styles.ratingSelector}>
              {[1, 2, 3, 4, 5].map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setNewRating({ ...newRating, rating: r })}
                  style={[
                    styles.ratingButton,
                    newRating.rating === r && { backgroundColor: "#fef3c7" },
                  ]}
                >
                  <Text style={{ fontSize: 20 }}>
                    {r <= newRating.rating ? "⭐" : "☆"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category Ratings */}
            {["transparency", "impact", "efficiency", "communication"].map(
              (category) => (
                <View key={category} style={{ marginBottom: 12 }}>
                  <Text
                    style={[
                      styles.inputLabel,
                      { color: text, textTransform: "capitalize" },
                    ]}
                  >
                    {category} Rating
                  </Text>
                  <View style={styles.ratingSelector}>
                    {[1, 2, 3, 4, 5].map((r) => (
                      <TouchableOpacity
                        key={r}
                        onPress={() =>
                          setNewRating({ ...newRating, [category]: r })
                        }
                        style={[
                          styles.ratingButtonSmall,
                          newRating[category as keyof typeof newRating] ===
                            r && {
                            backgroundColor: "#dbeafe",
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 14 }}>
                          {r <=
                          (newRating[
                            category as keyof typeof newRating
                          ] as number)
                            ? "⭐"
                            : "☆"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ),
            )}

            <Text style={[styles.inputLabel, { color: text }]}>
              Review (optional)
            </Text>
            <TextInput
              placeholder="Share your experience..."
              placeholderTextColor="#999"
              value={newRating.review}
              onChangeText={(v) => setNewRating({ ...newRating, review: v })}
              style={[styles.textarea, { color: text }]}
              multiline
              numberOfLines={4}
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
                onPress={submitRating}
                style={[
                  styles.modalButton,
                  { backgroundColor: "#10b981", flex: 1 },
                ]}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Submit</Text>
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
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: "#999" },
  ratingCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  charityName: { fontSize: 15, fontWeight: "700" },
  categoryScores: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  categoryScore: { flex: 1, alignItems: "center", marginHorizontal: 4 },
  categoryLabel: {
    fontSize: 9,
    color: "#666",
    fontWeight: "600",
    marginBottom: 4,
  },
  categoryValue: { fontSize: 14, fontWeight: "800", color: "#3b82f6" },
  reviewCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  reviewAuthor: { fontSize: 13, fontWeight: "700" },
  reviewText: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: { borderRadius: 16, padding: 20, width: "100%" },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  textarea: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    textAlignVertical: "top",
  },
  ratingSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  ratingButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  ratingButtonSmall: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  modalButton: { paddingVertical: 12, borderRadius: 8, alignItems: "center" },
});
