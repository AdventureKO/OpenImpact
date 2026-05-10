import { AuthContext } from "@/context/AuthContext";
import { useThemeColor } from "@/hooks/use-theme-color";
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

interface CommunityUser {
  id: string;
  name: string;
  totalDonated: number;
  donationCount: number;
  impactScore: number;
  rank: number;
  badges: number;
}

export default function LeaderboardScreen() {
  const navigation = useNavigation();
  const auth = useContext(AuthContext);
  const bg = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");

  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<CommunityUser[]>([]);
  const [userRank, setUserRank] = useState<CommunityUser | null>(null);
  const [activeTab, setActiveTab] = useState<
    "total" | "impact" | "consistency"
  >("total");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!auth?.user) {
        setLeaderboard([]);
        setUserRank(null);
        setLoading(false);
        return;
      }

      // Load user's donations
      const userDonations =
        (await storage.loadForUser(auth.user, "donations", [])) || [];
      const userStats = stats.calculateStats(userDonations);

      // Mock community data - in production, this would come from a backend
      const mockCommunityUsers: CommunityUser[] = [
        {
          id: "user-1",
          name: "Sarah Chen",
          totalDonated: 2500,
          donationCount: 45,
          impactScore: 95,
          rank: 1,
          badges: 7,
        },
        {
          id: "user-2",
          name: "Michael Rodriguez",
          totalDonated: 1800,
          donationCount: 32,
          impactScore: 88,
          rank: 2,
          badges: 6,
        },
        {
          id: "user-3",
          name: "Emma Thompson",
          totalDonated: 1500,
          donationCount: 28,
          impactScore: 82,
          rank: 3,
          badges: 5,
        },
        {
          id: "user-4",
          name: "James Park",
          totalDonated: 1200,
          donationCount: 22,
          impactScore: 75,
          rank: 4,
          badges: 4,
        },
        {
          id: "user-5",
          name: "Lisa Anderson",
          totalDonated: 950,
          donationCount: 18,
          impactScore: 68,
          rank: 5,
          badges: 3,
        },
      ];

      // User's virtual rank
      const userCommunityEntry: CommunityUser = {
        id: auth.user.id || "user-current",
        name: auth.user.name || auth.user.email || "You",
        totalDonated: userStats.totalDonated,
        donationCount: userStats.donationCount,
        impactScore: Math.min(
          Math.round(
            userStats.completedCount * 10 + userStats.donationCount * 2,
          ),
          100,
        ),
        rank: mockCommunityUsers.length + 1,
        badges: userStats.completedCount,
      };

      setUserRank(userCommunityEntry);

      // Sort by active tab
      let sorted = [...mockCommunityUsers];
      if (activeTab === "total") {
        sorted.sort((a, b) => b.totalDonated - a.totalDonated);
      } else if (activeTab === "impact") {
        sorted.sort((a, b) => b.impactScore - a.impactScore);
      } else if (activeTab === "consistency") {
        sorted.sort((a, b) => b.donationCount - a.donationCount);
      }

      setLeaderboard(sorted);
    } catch (e) {
      console.warn("leaderboard load failed", e);
    } finally {
      setLoading(false);
    }
  }, [auth?.user, activeTab]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

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

          <Text style={[styles.title, { color: text }]}>🏆 Leaderboard</Text>
          <Text
            style={{
              color: "#666",
              fontSize: 13,
              marginTop: 4,
              marginBottom: 16,
            }}
          >
            Community giving rankings
          </Text>

          {/* Your Rank Card */}
          {userRank && (
            <View
              style={[
                styles.userCard,
                { backgroundColor: "#fef3c7", borderColor: "#f59e0b" },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{userRank.rank}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.userName, { color: "#92400e" }]}>
                      {userRank.name}
                    </Text>
                    <Text style={styles.userSubtext}>
                      ${userRank.totalDonated} • {userRank.donationCount}{" "}
                      donations
                    </Text>
                  </View>
                </View>
                <Text style={styles.medalEmoji}>🎯</Text>
              </View>
            </View>
          )}

          {/* Tab Selector */}
          <View style={{ flexDirection: "row", gap: 8, marginVertical: 16 }}>
            {["total", "impact", "consistency"].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab as any)}
                style={[
                  styles.tab,
                  activeTab === tab && { backgroundColor: "#3b82f6" },
                ]}
              >
                <Text
                  style={[
                    { fontWeight: "600", fontSize: 12 },
                    activeTab === tab && { color: "#fff" },
                  ]}
                >
                  {tab === "total" && "💰 Total"}
                  {tab === "impact" && "⭐ Impact"}
                  {tab === "consistency" && "📈 Consistent"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Leaderboard List */}
          <View>
            {leaderboard.map((user, idx) => {
              const rank = idx + 1;
              let medalEmoji = "";
              if (rank === 1) medalEmoji = "🥇";
              else if (rank === 2) medalEmoji = "🥈";
              else if (rank === 3) medalEmoji = "🥉";

              return (
                <View
                  key={user.id}
                  style={[
                    styles.leaderboardItem,
                    rank <= 3 && {
                      backgroundColor: ["#fef3c7", "#f0f9ff", "#f0fdf4"][
                        rank - 1
                      ],
                      borderLeftColor: ["#f59e0b", "#3b82f6", "#10b981"][
                        rank - 1
                      ],
                    },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <View
                      style={[
                        styles.rankBox,
                        rank <= 3 && {
                          backgroundColor: ["#fcd34d", "#93c5fd", "#86efac"][
                            rank - 1
                          ],
                        },
                      ]}
                    >
                      {medalEmoji ? (
                        <Text style={styles.medalEmoji}>{medalEmoji}</Text>
                      ) : (
                        <Text style={styles.rankTextSmall}>{rank}</Text>
                      )}
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.rankName, { color: text }]}>
                        {user.name}
                      </Text>
                      <View
                        style={{ flexDirection: "row", gap: 8, marginTop: 4 }}
                      >
                        {activeTab === "total" && (
                          <Text style={styles.rankStat}>
                            ${user.totalDonated}
                          </Text>
                        )}
                        {activeTab === "impact" && (
                          <Text style={styles.rankStat}>
                            {user.impactScore} score
                          </Text>
                        )}
                        {activeTab === "consistency" && (
                          <Text style={styles.rankStat}>
                            {user.donationCount} donations
                          </Text>
                        )}
                        <Text style={styles.rankStat}>
                          {user.badges} badges
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", gap: 4 }}>
                    {[...Array(Math.min(user.badges, 3))].map((_, i) => (
                      <Text key={i} style={{ fontSize: 12 }}>
                        ⭐
                      </Text>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Stats Cards */}
          <View style={{ marginTop: 24, marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { color: text }]}>
              Community Stats
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>👥</Text>
                <Text style={styles.statValue}>{leaderboard.length + 1}</Text>
                <Text style={styles.statLabel}>Active Donors</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>💰</Text>
                <Text style={styles.statValue}>
                  $
                  {(
                    leaderboard.reduce((s, u) => s + u.totalDonated, 0) +
                    (userRank?.totalDonated || 0)
                  ).toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Total Given</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>🎯</Text>
                <Text style={styles.statValue}>
                  {leaderboard.reduce((s, u) => s + u.donationCount, 0) +
                    (userRank?.donationCount || 0)}
                </Text>
                <Text style={styles.statLabel}>Total Donations</Text>
              </View>
            </View>
          </View>

          {/* Achievement Hint */}
          <View
            style={[
              styles.hintCard,
              { backgroundColor: "#dbeafe", borderColor: "#3b82f6" },
            ]}
          >
            <Text style={styles.hintEmoji}>💡</Text>
            <View>
              <Text style={[styles.hintTitle, { color: "#0c4a6e" }]}>
                Climb the Leaderboard
              </Text>
              <Text style={styles.hintText}>
                Make more donations and get verified impact to increase your
                score and rank!
              </Text>
            </View>
          </View>

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 26, fontWeight: "800" },
  userCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 14,
    marginBottom: 16,
  },
  rankBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f59e0b",
    justifyContent: "center",
    alignItems: "center",
  },
  rankText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  userName: { fontSize: 15, fontWeight: "700" },
  userSubtext: { fontSize: 11, color: "#666", marginTop: 2 },
  medalEmoji: { fontSize: 28 },
  tab: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  leaderboardItem: {
    flexDirection: "row",
    borderLeftWidth: 4,
    borderLeftColor: "#d1d5db",
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "space-between",
  },
  rankBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  rankTextSmall: { fontSize: 14, fontWeight: "800", color: "#374151" },
  rankName: { fontSize: 14, fontWeight: "700" },
  rankStat: { fontSize: 10, color: "#666", fontWeight: "600" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  statsGrid: { flexDirection: "row", gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statEmoji: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: "800", color: "#1f2937" },
  statLabel: { fontSize: 9, color: "#666", marginTop: 4 },
  hintCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  hintEmoji: { fontSize: 24, marginTop: 4 },
  hintTitle: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  hintText: { fontSize: 11, color: "#666" },
});
