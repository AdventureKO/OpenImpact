import ShareImpactButton from "@/components/ShareImpactButton";
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

export default function MonthlyRecapScreen() {
  const navigation = useNavigation();
  const auth = useContext(AuthContext);
  const bg = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");

  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStats, setCurrentStats] = useState<stats.DonationStats | null>(
    null,
  );
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [newBadges, setNewBadges] = useState<any[]>([]);

  const currentMonth = new Date();
  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!auth?.user) {
        setDonations([]);
        setCurrentStats(null);
        setMonthlyStats(null);
        setBadges([]);
        setNewBadges([]);
        setLoading(false);
        return;
      }

      const d = (await storage.loadForUser(auth.user, "donations", [])) || [];
      setDonations(d);

      const calculatedStats = stats.calculateStats(d);
      setCurrentStats(calculatedStats);

      // Get this month's donations
      const thisMonth = d.filter((don) => {
        const donDate = new Date(don.createdAt || 0);
        return (
          donDate.getMonth() === currentMonth.getMonth() &&
          donDate.getFullYear() === currentMonth.getFullYear()
        );
      });

      const monthlyAmount = thisMonth.reduce(
        (s, d) => s + (Number(d.amount) || 0),
        0,
      );
      const monthlyCount = thisMonth.length;

      setMonthlyStats({
        amount: monthlyAmount,
        count: monthlyCount,
        average: monthlyCount > 0 ? monthlyAmount / monthlyCount : 0,
        impact: {
          meals: Math.round(monthlyAmount * 2),
          families: Math.round(monthlyAmount * 0.02),
          hours: Math.round(monthlyAmount * 0.5),
        },
      });

      // Get achievements
      const unlockedBadges = achievements.getUnlockedBadges(calculatedStats);
      setBadges(unlockedBadges);

      const nextBadges = achievements.getNextBadges(calculatedStats, 3);
      setNewBadges(nextBadges);

      // Calculate stats for share
      const statsForShare = {
        ...calculatedStats,
        donationsWithNotes: d.filter((don) => don.note).length,
      };
    } catch (e) {
      console.warn("recap load failed", e);
    } finally {
      setLoading(false);
    }
  }, [auth?.user]);

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

  if (!monthlyStats) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
        <View style={{ padding: 16 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginBottom: 16 }}
          >
            <Text style={{ color: "#2563eb", fontWeight: "600" }}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: text }]}>Monthly Recap</Text>
          <Text style={{ color: text, marginTop: 16 }}>
            No donations this month yet. Start giving to see your monthly
            impact!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Month */}
        <View style={[styles.header, { backgroundColor: "#06b6d4" }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              position: "absolute",
              left: 16,
              top: 16,
              zIndex: 10,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerMonth}>{monthName}</Text>
          <Text style={styles.headerSubtitle}>Impact Recap</Text>
        </View>

        <View style={{ padding: 16 }}>
          {/* Main Stats */}
          <View style={styles.mainStatsContainer}>
            <View style={styles.mainStatBox}>
              <Text style={styles.mainStatLabel}>Total Donated</Text>
              <Text style={[styles.mainStatValue, { color: text }]}>
                ${monthlyStats.amount.toFixed(2)}
              </Text>
              <Text style={styles.mainStatSubtext}>
                {monthlyStats.count} donations
              </Text>
            </View>

            <View style={styles.mainStatBox}>
              <Text style={styles.mainStatLabel}>Average Gift</Text>
              <Text style={[styles.mainStatValue, { color: text }]}>
                ${monthlyStats.average.toFixed(2)}
              </Text>
              <Text style={styles.mainStatSubtext}>per donation</Text>
            </View>
          </View>

          {/* Impact Achieved */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: text }]}>
              🎯 This Month's Impact
            </Text>
            <View style={styles.impactGrid}>
              <View style={[styles.impactCard, { backgroundColor: "#fef3c7" }]}>
                <Text style={styles.impactEmoji}>🍽️</Text>
                <Text
                  style={{ fontSize: 20, fontWeight: "800", color: "#92400e" }}
                >
                  {monthlyStats.impact.meals}
                </Text>
                <Text
                  style={{ fontSize: 11, color: "#92400e", fontWeight: "600" }}
                >
                  Meals Provided
                </Text>
              </View>
              <View style={[styles.impactCard, { backgroundColor: "#dbeafe" }]}>
                <Text style={styles.impactEmoji}>👨‍👩‍👧</Text>
                <Text
                  style={{ fontSize: 20, fontWeight: "800", color: "#0c4a6e" }}
                >
                  {Math.round(monthlyStats.impact.families)}
                </Text>
                <Text
                  style={{ fontSize: 11, color: "#0c4a6e", fontWeight: "600" }}
                >
                  Families Reached
                </Text>
              </View>
              <View style={[styles.impactCard, { backgroundColor: "#dcfce7" }]}>
                <Text style={styles.impactEmoji}>⏱️</Text>
                <Text
                  style={{ fontSize: 20, fontWeight: "800", color: "#166534" }}
                >
                  {Math.round(monthlyStats.impact.hours)}
                </Text>
                <Text
                  style={{ fontSize: 11, color: "#166534", fontWeight: "600" }}
                >
                  Hours of Service
                </Text>
              </View>
            </View>
          </View>

          {/* New Badges */}
          {badges.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: text }]}>
                🏆 Achievements Unlocked ({badges.length})
              </Text>
              <View style={styles.badgeGrid}>
                {badges.map((badge) => (
                  <View
                    key={badge.id}
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
                    <Text style={styles.badgeDesc}>{badge.description}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Next Achievements */}
          {newBadges.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: text }]}>
                🎯 Nearly There! Unlock Next...
              </Text>
              {newBadges.map((badge, idx) => (
                <View
                  key={badge.id}
                  style={[
                    styles.nextBadgeCard,
                    {
                      borderLeftColor: badge.color,
                      opacity: 0.7,
                    },
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
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Share This Recap */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: text }]}>
              📢 Share Your Recap
            </Text>
            <ShareImpactButton
              donationAmount={monthlyStats.amount}
              causeName="multiple causes"
              impact={monthlyStats.impact}
            />
          </View>

          {/* Overall Stats */}
          {currentStats && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: text }]}>
                📊 All-Time Statistics
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Lifetime</Text>
                  <Text style={[styles.statValue, { color: text }]}>
                    ${currentStats.totalDonated.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>All Donations</Text>
                  <Text style={[styles.statValue, { color: text }]}>
                    {currentStats.donationCount}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Verified Impact</Text>
                  <Text style={[styles.statValue, { color: text }]}>
                    {currentStats.completedCount}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  headerMonth: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  mainStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  mainStatBox: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  mainStatLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
    marginBottom: 6,
  },
  mainStatValue: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 2,
  },
  mainStatSubtext: {
    fontSize: 10,
    color: "#999",
  },
  impactGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  impactCard: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 4,
    alignItems: "center",
  },
  impactEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
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
  badgeEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
    textAlign: "center",
  },
  badgeDesc: {
    fontSize: 9,
    color: "#666",
    textAlign: "center",
  },
  nextBadgeCard: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    alignItems: "center",
  },
  nextBadgeEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  nextBadgeName: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  nextBadgeDesc: {
    fontSize: 11,
    color: "#666",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 4,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
  },
});
