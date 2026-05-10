import { AuthContext } from "@/context/AuthContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import * as achievements from "@/utils/achievements";
import * as stats from "@/utils/donationStats";
import * as storage from "@/utils/storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useContext, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function AchievementsScreen() {
  const navigation = useNavigation();
  const auth = useContext(AuthContext);
  const bg = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");

  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStats, setCurrentStats] = useState<stats.DonationStats | null>(
    null,
  );
  const [unlockedBadges, setUnlockedBadges] = useState<achievements.Badge[]>(
    [],
  );
  const [nextBadges, setNextBadges] = useState<achievements.Badge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<achievements.Badge | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!auth?.user) {
        setDonations([]);
        setCurrentStats(null);
        setUnlockedBadges([]);
        setNextBadges([]);
        setLoading(false);
        return;
      }

      const d = (await storage.loadForUser(auth.user, "donations", [])) || [];
      setDonations(d);

      const calculatedStats = stats.calculateStats(d);
      calculatedStats.donationsWithNotes = d.filter((don) => don.note).length;
      setCurrentStats(calculatedStats);

      const unlocked = achievements.getUnlockedBadges(calculatedStats);
      setUnlockedBadges(unlocked);

      const next = achievements.getNextBadges(calculatedStats, 5);
      setNextBadges(next);
    } catch (e) {
      console.warn("achievements load failed", e);
    } finally {
      setLoading(false);
    }
  }, [auth?.user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const getProgressTowardsBadge = (badge: achievements.Badge) => {
    if (!currentStats) return { progress: 0, target: "?", label: "N/A" };

    if (badge.id === "first-donation") {
      return {
        progress: Math.min(currentStats.donationCount, 1),
        target: 1,
        label: "donation",
      };
    }
    if (badge.id === "generous") {
      const pct = (currentStats.totalDonated / 100) * 100;
      return {
        progress: Math.min(pct, 100),
        target: 100,
        label: "percent of $100",
      };
    }
    if (badge.id === "super-donor") {
      const pct = (currentStats.totalDonated / 500) * 100;
      return {
        progress: Math.min(pct, 100),
        target: 100,
        label: "percent of $500",
      };
    }
    if (badge.id === "impact-champion") {
      return {
        progress: currentStats.completedCount,
        target: 5,
        label: "verified donations",
      };
    }
    if (badge.id === "consistency") {
      return {
        progress: currentStats.donationCount,
        target: 10,
        label: "donations",
      };
    }
    if (badge.id === "precision") {
      const rate =
        currentStats.donationCount > 0
          ? (currentStats.completedCount / currentStats.donationCount) * 100
          : 0;
      return {
        progress: Math.min(rate, 100),
        target: 80,
        label: "percent verified",
      };
    }
    if (badge.id === "multi-cause") {
      return {
        progress: currentStats.topCauses?.length || 0,
        target: 5,
        label: "causes",
      };
    }
    if (badge.id === "thoughtful") {
      return {
        progress: currentStats.donationsWithNotes || 0,
        target: 5,
        label: "donations with notes",
      };
    }

    return { progress: 0, target: "?", label: "unknown" };
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: bg, justifyContent: "center" },
        ]}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

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

          <View style={{ marginBottom: 24 }}>
            <Text style={[styles.title, { color: text }]}>🏆 Achievements</Text>
            <Text style={{ color: "#666", fontSize: 13, marginTop: 4 }}>
              Unlock badges as you give and make impact
            </Text>
          </View>

          {/* Unlocked Badges Section */}
          {unlockedBadges.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={[styles.sectionTitle, { color: text }]}>
                Unlocked ({unlockedBadges.length})
              </Text>
              <View style={styles.badgeGrid}>
                {unlockedBadges.map((badge) => (
                  <TouchableOpacity
                    key={badge.id}
                    onPress={() => setSelectedBadge(badge)}
                    style={[
                      styles.badgeCard,
                      {
                        backgroundColor: badge.color + "20",
                        borderColor: badge.color,
                      },
                    ]}
                  >
                    <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                    <Text style={[styles.badgeName, { color: text }]}>
                      {badge.name}
                    </Text>
                    <Text style={styles.badgeCheckmark}>✓</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Next Badges Section */}
          {nextBadges.length > 0 && (
            <View>
              <Text style={[styles.sectionTitle, { color: text }]}>
                Almost There ({nextBadges.length})
              </Text>
              {nextBadges.map((badge) => {
                const progress = getProgressTowardsBadge(badge);
                const isPercentBased =
                  badge.id.includes("generous") ||
                  badge.id.includes("super-donor") ||
                  badge.id.includes("precision");
                const progressPercent = isPercentBased
                  ? Math.min(
                      ((progress.progress as number) /
                        (progress.target as number)) *
                        100,
                      100,
                    )
                  : Math.min(
                      ((progress.progress as number) /
                        (progress.target as number)) *
                        100,
                      100,
                    );

                return (
                  <TouchableOpacity
                    key={badge.id}
                    onPress={() => setSelectedBadge(badge)}
                    style={[
                      styles.nextBadgeCard,
                      { borderLeftColor: badge.color },
                    ]}
                  >
                    <Text style={styles.nextBadgeEmoji}>{badge.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.nextBadgeName, { color: text }]}>
                        {badge.name}
                      </Text>
                      <Text style={styles.nextBadgeDesc}>
                        {badge.description}
                      </Text>

                      {/* Progress Bar */}
                      <View style={styles.progressBarContainer}>
                        <View
                          style={[
                            styles.progressBar,
                            {
                              width: `${progressPercent}%`,
                              backgroundColor: badge.color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {Math.round(progressPercent)}% •{" "}
                        {typeof progress.progress === "number"
                          ? Math.round(progress.progress)
                          : progress.progress}{" "}
                        / {progress.target} {progress.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Empty State */}
          {unlockedBadges.length === 0 && nextBadges.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎯</Text>
              <Text style={[styles.emptyText, { color: text }]}>
                No badges yet
              </Text>
              <Text style={styles.emptySubtext}>
                Start donating to unlock achievements!
              </Text>
            </View>
          )}

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: "rgba(0, 0, 0, 0.7)" },
          ]}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setSelectedBadge(null)}
          />
          <View style={[styles.modalContent, { backgroundColor: bg }]}>
            <TouchableOpacity
              onPress={() => setSelectedBadge(null)}
              style={{ alignSelf: "flex-end", marginBottom: 12 }}
            >
              <Text style={{ fontSize: 24 }}>×</Text>
            </TouchableOpacity>

            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>
                {selectedBadge.emoji}
              </Text>
              <Text style={[styles.modalTitle, { color: text }]}>
                {selectedBadge.name}
              </Text>
              <Text style={styles.modalDesc}>{selectedBadge.description}</Text>
            </View>

            {unlockedBadges.find((b) => b.id === selectedBadge.id) && (
              <Text style={styles.unlockedText}>
                ✓ You've unlocked this badge!
              </Text>
            )}

            {!unlockedBadges.find((b) => b.id === selectedBadge.id) && (
              <View>
                <Text style={[styles.progressLabel, { color: text }]}>
                  Progress
                </Text>
                <View style={styles.modalProgressBar}>
                  <View
                    style={[
                      styles.modalProgressFill,
                      {
                        width: `${Math.min(((getProgressTowardsBadge(selectedBadge).progress as number) / (getProgressTowardsBadge(selectedBadge).target as number)) * 100, 100)}%`,
                        backgroundColor: selectedBadge.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressSubtext}>
                  Keep up the great work to unlock this badge!
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setSelectedBadge(null)}
              style={[
                styles.closeButton,
                { backgroundColor: selectedBadge.color },
              ]}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  badgeCard: {
    width: "31%",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    alignItems: "center",
  },
  badgeEmoji: { fontSize: 32, marginBottom: 6 },
  badgeName: { fontSize: 12, fontWeight: "700", textAlign: "center" },
  badgeCheckmark: { fontSize: 18, color: "#10b981", marginTop: 4 },
  nextBadgeCard: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    alignItems: "center",
  },
  nextBadgeEmoji: { fontSize: 28, marginRight: 12 },
  nextBadgeName: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  nextBadgeDesc: { fontSize: 11, color: "#666", marginBottom: 8 },
  progressBarContainer: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: { height: 6, borderRadius: 3 },
  progressText: { fontSize: 10, color: "#666", marginTop: 4 },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  modalDesc: { fontSize: 13, color: "#666", textAlign: "center", marginTop: 4 },
  unlockedText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10b981",
    textAlign: "center",
    marginVertical: 16,
    backgroundColor: "#dcfce7",
    paddingVertical: 10,
    borderRadius: 8,
  },
  progressLabel: { fontSize: 12, fontWeight: "700", marginBottom: 8 },
  modalProgressBar: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  modalProgressFill: { height: 8, borderRadius: 4 },
  progressSubtext: { fontSize: 11, color: "#666" },
  closeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
});
