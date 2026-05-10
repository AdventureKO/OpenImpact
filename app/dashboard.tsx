import { USER_ROLE } from "@/constants/userRoles";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useContext, useState } from "react";
import {
    FlatList,
    SafeAreaView,
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
            fontSize: 14,
            fontWeight: "600",
            marginBottom: 6,
            color: text,
            opacity: 0.85,
          }}
        >
          Donors see where dollars went; organizations prove it with updates
          tied to each stage.
        </Text>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            marginBottom: 6,
            color: text,
          }}
        >
          Hello
          {auth && auth.user ? `, ${auth.user.name || auth.user.email}` : ""}
        </Text>
        <View style={{ height: 12 }} />
        <View style={styles.row}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Total Donated</Text>
            <Text style={styles.cardValue}>${totalDonated}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Active Donations</Text>
            <Text style={styles.cardValue}>{activeCount}</Text>
          </View>
        </View>

        <View style={{ height: 12 }} />
        <Text style={{ fontWeight: "700", marginBottom: 8, color: text }}>
          Quick actions
        </Text>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate("Donate")}
            style={styles.action}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Donate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("Track")}
            style={[styles.action, { backgroundColor: "#3498db" }]}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Track</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("Projects")}
            style={[styles.action, { backgroundColor: "#16a085" }]}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Browse</Text>
          </TouchableOpacity>
          {auth?.user?.role !== USER_ROLE.ORGANIZATION ? (
            <TouchableOpacity
              onPress={() => navigation.navigate("MyImpact")}
              style={[styles.action, { backgroundColor: "#7c3aed" }]}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                My impact
              </Text>
            </TouchableOpacity>
          ) : null}
          {auth?.user?.role !== USER_ROLE.ORGANIZATION ? (
            <TouchableOpacity
              onPress={() => navigation.navigate("ImpactGoals")}
              style={[styles.action, { backgroundColor: "#f59e0b" }]}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Goals</Text>
            </TouchableOpacity>
          ) : null}
          {auth?.user?.role !== USER_ROLE.ORGANIZATION ? (
            <TouchableOpacity
              onPress={() => navigation.navigate("AnalyticsDashboard")}
              style={[styles.action, { backgroundColor: "#8b5cf6" }]}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                Analytics
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={{ height: 10 }} />
        <TouchableOpacity
          onPress={() => navigation.navigate("Notifications")}
          style={{
            alignSelf: "flex-start",
            paddingVertical: 8,
            paddingHorizontal: 12,
          }}
        >
          <Text style={{ color: text, fontWeight: "600", fontSize: 14 }}>
            Notifications →
          </Text>
        </TouchableOpacity>

        <View style={{ height: 16 }} />

        {/* Demo Features Banner */}
        {auth?.user?.role !== USER_ROLE.ORGANIZATION && totalDonated > 0 && (
          <View style={styles.demoBanner}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: "#1f2937",
                marginBottom: 10,
              }}
            >
              ✨ Unique Transparency Features
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("MyImpact")}
              style={styles.demoBannerButton}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: "#0369a1",
                  marginBottom: 2,
                }}
              >
                👁️ My Impact Tracker
              </Text>
              <Text style={{ fontSize: 11, color: "#0c4a6e" }}>
                See your donations matched to org updates by allocation type
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("ExportImpact")}
              style={styles.demoBannerButton}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: "#059669",
                  marginBottom: 2,
                }}
              >
                📥 Export Your Trail
              </Text>
              <Text style={{ fontSize: 11, color: "#065f46" }}>
                Download JSON/CSV for independent audit or tax records
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 16 }} />
        <Text style={{ fontWeight: "700", marginBottom: 8, color: text }}>
          Recent updates
        </Text>
        {recent.length === 0 ? (
          <Text style={{ color: text }}>No recent updates</Text>
        ) : (
          <FlatList
            data={recent}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <View
                style={{
                  padding: 8,
                  borderBottomWidth: 1,
                  borderColor: "#eee",
                }}
              >
                <Text style={{ fontWeight: "700", color: text }}>
                  {item.projectId || "Project"}
                </Text>
                <Text style={{ color: text }}>
                  ${item.amount} — {new Date(item.createdAt).toLocaleString()}
                </Text>
              </View>
            )}
          />
        )}

        <View style={{ height: 16 }} />
        <Text style={{ fontWeight: "700", marginBottom: 8, color: text }}>
          Impact summary
        </Text>
        <View style={{ padding: 8 }}>
          <Text style={{ color: text }}>Meals provided: {impact.meals}</Text>
          <Text style={{ color: text }}>
            Trees planted (est): {impact.trees}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between" },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    elevation: 2,
  },
  cardLabel: { fontSize: 12, color: "#666" },
  cardValue: { fontSize: 18, fontWeight: "700" },
  action: {
    backgroundColor: "#27ae60",
    padding: 12,
    borderRadius: 8,
    minWidth: "30%",
    flexGrow: 1,
    alignItems: "center",
    marginRight: 8,
  },
  demoBanner: {
    backgroundColor: "#f0f9ff",
    borderWidth: 2,
    borderColor: "#0369a1",
    borderRadius: 12,
    padding: 14,
  },
  demoBannerButton: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#0369a1",
  },
});
