import { USER_ROLE } from "@/constants/userRoles";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useContext, useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { useThemeColor } from "../hooks/use-theme-color";
import * as storage from "../utils/storage";

export default function Dashboard() {
  const auth = useContext(AuthContext);
  const navigation = useNavigation();
  const bg = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");
  const [totalDonated, setTotalDonated] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [recent, setRecent] = useState([]);
  const [impact, setImpact] = useState({ meals: 0, trees: 0 });

  const load = useCallback(async () => {
    try {
      const d =
        auth && auth.user
          ? (await storage.loadForUser(auth.user, "donations", [])) || []
          : (await storage.load("anonDonations", [])) || [];
      const total = (d || []).reduce((s, x) => s + (Number(x.amount) || 0), 0);
      setTotalDonated(total);
      setActiveCount((d || []).filter((x) => x.status !== "delivered").length);
      setRecent((d || []).slice(0, 5));
      setImpact({
        meals: Math.round(total * 2),
        trees: Math.round(total * 0.1),
      });
    } catch (e) {
      console.warn("load dashboard failed", e);
    }
  }, [auth && auth.user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={{ padding: 16, paddingTop: 20 }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              marginBottom: 4,
              color: text,
            }}
          >
            OpenImpact
          </Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              marginBottom: 12,
              color: text,
            }}
          >
            Hello {auth && auth.user ? auth.user.name || auth.user.email : ""}
          </Text>

          {/* Quick Stats */}
          <View style={styles.row}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Total Donated</Text>
              <Text style={styles.cardValue}>${totalDonated}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Active</Text>
              <Text style={styles.cardValue}>{activeCount}</Text>
            </View>
          </View>

          <View style={{ height: 16 }} />
          <Text style={{ fontWeight: "700", marginBottom: 10, color: text }}>
            Primary Actions
          </Text>
          <View style={styles.primaryButtons}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Donate")}
              style={[styles.actionLarge, { backgroundColor: "#27ae60" }]}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
                💚 Donate
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("MyImpact")}
              style={[styles.actionLarge, { backgroundColor: "#7c3aed" }]}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
                👁️ My Impact
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("Projects")}
              style={[styles.actionLarge, { backgroundColor: "#3498db" }]}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
                🔍 Browse
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 12 }} />
          <Text style={{ fontWeight: "700", marginBottom: 10, color: text }}>
            More Tools
          </Text>
          <View style={styles.secondaryButtons}>
            <TouchableOpacity
              onPress={() => navigation.navigate("DonationHistory")}
              style={styles.actionSmall}
            >
              <Text style={styles.buttonText}>📜 History</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("Track")}
              style={styles.actionSmall}
            >
              <Text style={styles.buttonText}>📍 Track</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("Achievements")}
              style={styles.actionSmall}
            >
              <Text style={styles.buttonText}>🏆 Badges</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("AnalyticsDashboard")}
              style={styles.actionSmall}
            >
              <Text style={styles.buttonText}>📊 Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("ImpactGoals")}
              style={styles.actionSmall}
            >
              <Text style={styles.buttonText}>🎯 Goals</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("MonthlyRecap")}
              style={styles.actionSmall}
            >
              <Text style={styles.buttonText}>📈 Recap</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("Collections")}
              style={styles.actionSmall}
            >
              <Text style={styles.buttonText}>📚 Collections</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("CharityRatings")}
              style={styles.actionSmall}
            >
              <Text style={styles.buttonText}>⭐ Ratings</Text>
            </TouchableOpacity>
          </View>

          {auth?.user?.role !== USER_ROLE.ORGANIZATION && (
            <>
              <View style={{ height: 12 }} />
              <TouchableOpacity
                onPress={() => navigation.navigate("Notifications")}
                style={styles.notificationLink}
              >
                <Text
                  style={{ color: "#2563eb", fontWeight: "600", fontSize: 12 }}
                >
                  🔔 Notifications
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Impact Summary */}
          {totalDonated > 0 && (
            <>
              <View style={{ height: 16 }} />
              <View style={styles.summaryCard}>
                <Text
                  style={{ fontWeight: "700", marginBottom: 8, color: text }}
                >
                  Impact Summary
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                  }}
                >
                  <View style={{ alignItems: "center" }}>
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "800",
                        color: "#f59e0b",
                      }}
                    >
                      {impact.meals}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#666" }}>Meals</Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "800",
                        color: "#10b981",
                      }}
                    >
                      {impact.trees}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#666" }}>Trees</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
    marginBottom: 4,
  },
  cardValue: { fontSize: 18, fontWeight: "800" },
  primaryButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  actionLarge: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    elevation: 2,
  },
  secondaryButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionSmall: {
    width: "48%",
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  buttonText: { fontWeight: "600", fontSize: 12, color: "#1f2937" },
  notificationLink: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  summaryCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
});
