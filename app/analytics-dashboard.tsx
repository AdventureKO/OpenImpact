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

export default function AnalyticsScreen() {
  const navigation = useNavigation();
  const auth = useContext(AuthContext);
  const bg = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");

  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<stats.DonationStats | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [grouped, setGrouped] = useState<Record<string, any[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!auth?.user) {
        setDonations([]);
        setAnalytics(null);
        setInsights([]);
        setGrouped({});
        setLoading(false);
        return;
      }

      const d = (await storage.loadForUser(auth.user, "donations", [])) || [];
      setDonations(d);

      const calculatedStats = stats.calculateStats(d);
      setAnalytics(calculatedStats);

      const donationInsights = stats.getDonationInsights(d);
      setInsights(donationInsights);

      const groupedByMonth = stats.groupByPeriod(d, "month");
      setGrouped(groupedByMonth);
    } catch (e) {
      console.warn("analytics load failed", e);
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

  if (!analytics || donations.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
        <View style={{ padding: 16 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginBottom: 16 }}
          >
            <Text style={{ color: "#2563eb", fontWeight: "600" }}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: text }]}>Your Analytics</Text>
          <Text style={{ color: text, marginTop: 16 }}>
            No donation data yet. Start donating to see your impact analytics!
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Donate")}
            style={{
              marginTop: 16,
              backgroundColor: "#2563eb",
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text
              style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}
            >
              Make Your First Donation
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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

          <Text style={[styles.title, { color: text }]}>
            Your Impact Analytics
          </Text>
          <Text style={{ color: "#666", marginBottom: 20 }}>
            See your giving patterns, favorite causes, and impact metrics
          </Text>

          {/* Key Metrics Cards */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { borderLeftColor: "#10b981" }]}>
              <Text style={styles.metricLabel}>Total Donated</Text>
              <Text style={[styles.metricValue, { color: text }]}>
                ${analytics.totalDonated.toFixed(2)}
              </Text>
              <Text style={styles.metricSubtext}>
                {analytics.donationCount} donations
              </Text>
            </View>

            <View style={[styles.metricCard, { borderLeftColor: "#3b82f6" }]}>
              <Text style={styles.metricLabel}>Average Gift</Text>
              <Text style={[styles.metricValue, { color: text }]}>
                ${analytics.averageDonation.toFixed(2)}
              </Text>
              <Text style={styles.metricSubtext}>per donation</Text>
            </View>

            <View style={[styles.metricCard, { borderLeftColor: "#f59e0b" }]}>
              <Text style={styles.metricLabel}>Largest Gift</Text>
              <Text style={[styles.metricValue, { color: text }]}>
                ${analytics.largestDonation.toFixed(2)}
              </Text>
              <Text style={styles.metricSubtext}>one-time</Text>
            </View>

            <View style={[styles.metricCard, { borderLeftColor: "#8b5cf6" }]}>
              <Text style={styles.metricLabel}>Impact Rate</Text>
              <Text style={[styles.metricValue, { color: text }]}>
                {Math.round(
                  (analytics.completedCount / analytics.donationCount) * 100,
                )}
                %
              </Text>
              <Text style={styles.metricSubtext}>verified impact</Text>
            </View>
          </View>

          {/* Insights */}
          {insights.length > 0 && (
            <View style={{ marginTop: 20, marginBottom: 20 }}>
              <Text style={[styles.sectionTitle, { color: text }]}>
                💡 Key Insights
              </Text>
              {insights.map((insight, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.insightCard,
                    { borderLeftColor: insight.color },
                  ]}
                >
                  <Text style={styles.insightEmoji}>{insight.emoji}</Text>
                  <Text style={[styles.insightText, { color: text }]}>
                    {insight.insight}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Top Causes */}
          {analytics.topCauses.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={[styles.sectionTitle, { color: text }]}>
                🎯 Top Causes
              </Text>
              {analytics.topCauses.map((cause, idx) => (
                <View key={idx} style={styles.causeRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.causeName, { color: text }]}>
                      #{idx + 1} {cause.causeId}
                    </Text>
                    <Text style={styles.causeStats}>
                      {cause.count} donation{cause.count > 1 ? "s" : ""}
                    </Text>
                  </View>
                  <View style={styles.causeAmount}>
                    <Text style={[styles.causeValue, { color: text }]}>
                      ${cause.total.toFixed(2)}
                    </Text>
                    <View
                      style={[
                        styles.causeBar,
                        {
                          width: `${(cause.total / analytics.totalDonated) * 100}%`,
                          backgroundColor: [
                            "#10b981",
                            "#3b82f6",
                            "#f59e0b",
                            "#8b5cf6",
                            "#ec4899",
                          ][idx % 5],
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Timeline by Month */}
          {Object.keys(grouped).length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={[styles.sectionTitle, { color: text }]}>
                📅 Giving Timeline
              </Text>
              {Object.entries(grouped)
                .sort(
                  (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime(),
                )
                .slice(0, 6)
                .map(([period, items]) => {
                  const total = items.reduce(
                    (s: number, d: any) => s + (Number(d.amount) || 0),
                    0,
                  );
                  return (
                    <View key={period} style={styles.timelineRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.periodName, { color: text }]}>
                          {period}
                        </Text>
                        <Text style={styles.periodStats}>
                          {items.length} donation{items.length > 1 ? "s" : ""}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={[styles.periodValue, { color: text }]}>
                          ${total.toFixed(2)}
                        </Text>
                        <View
                          style={[
                            styles.timelineBar,
                            {
                              width: Math.max(
                                40,
                                (total /
                                  Math.max(
                                    ...Object.values(grouped).map((g: any[]) =>
                                      g.reduce(
                                        (s: number, d: any) =>
                                          s + (Number(d.amount) || 0),
                                        0,
                                      ),
                                    ),
                                  )) *
                                  150,
                              ),
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
            </View>
          )}

          {/* Stats Cards */}
          <View style={styles.statsSection}>
            <View style={[styles.statBox, { backgroundColor: "#e0f2fe" }]}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>📈</Text>
              <Text style={[styles.statBoxLabel, { color: "#0369a1" }]}>
                Completion Rate
              </Text>
              <Text style={[styles.statBoxValue, { color: "#0c4a6e" }]}>
                {analytics.completedCount}/{analytics.donationCount} verified
              </Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: "#f0fdf4" }]}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>⏳</Text>
              <Text style={[styles.statBoxLabel, { color: "#166534" }]}>
                In Progress
              </Text>
              <Text style={[styles.statBoxValue, { color: "#166534" }]}>
                {analytics.inProgressCount} awaiting impact
              </Text>
            </View>
          </View>

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  metricLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 6,
  },
  metricValue: { fontSize: 18, fontWeight: "800", marginBottom: 2 },
  metricSubtext: { fontSize: 10, color: "#9ca3af" },
  insightCard: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    alignItems: "center",
  },
  insightEmoji: { fontSize: 20, marginRight: 10 },
  insightText: { flex: 1, fontSize: 13, lineHeight: 18 },
  causeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  causeName: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  causeStats: { fontSize: 11, color: "#6b7280" },
  causeAmount: { width: 80, alignItems: "flex-end" },
  causeValue: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  causeBar: { height: 4, borderRadius: 2, width: "100%" },
  timelineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  periodName: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  periodStats: { fontSize: 11, color: "#6b7280" },
  periodValue: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "right",
  },
  timelineBar: { height: 4, borderRadius: 2, backgroundColor: "#3b82f6" },
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 4,
  },
  statBoxLabel: { fontSize: 12, fontWeight: "600", marginBottom: 2 },
  statBoxValue: { fontSize: 14, fontWeight: "800" },
});
