import { AuthContext } from "@/context/AuthContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
    loadIncomingDonations,
    sumIncomingForCause,
} from "@/utils/fundTracking";
import * as storage from "@/utils/storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useState } from "react";
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export default function OrgFundsScreen() {
  const auth = useContext(AuthContext);
  const bg = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");
  const [rows, setRows] = useState<
    { id: string; name: string; raised: number }[]
  >([]);

  const load = useCallback(async () => {
    const causes =
      (await storage.loadForUser(auth?.user ?? null, "myFundraisers", [])) ||
      [];
    const incoming = await loadIncomingDonations();
    setRows(
      causes.map((c: { id: string; name?: string }) => ({
        id: String(c.id),
        name: c.name || "Untitled cause",
        raised: sumIncomingForCause(incoming, c.id),
      })),
    );
  }, [auth?.user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const total = rows.reduce((s, r) => s + r.raised, 0);

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: bg }]}>
      <Text style={[styles.title, { color: text }]}>Funds collected</Text>
      <Text style={[styles.sub, { color: text }]}>
        Totals are aggregated from donations recorded on this device (demo).
        Connect a backend to reconcile payouts.
      </Text>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>All causes</Text>
        <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={{ color: text }}>
            No causes yet — add one under “My causes”.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.causeName, { color: text }]}>
                {item.name}
              </Text>
              <Text style={styles.meta}>Cause id: {item.id}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.amount}>${item.raised.toFixed(2)}</Text>
              <TouchableOpacity
                style={{
                  marginTop: 8,
                  backgroundColor: "#0ea5a4",
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                }}
                onPress={() => {
                  router.push({
                    pathname: "/org-allocations",
                    params: { projectId: item.id },
                  });
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Manage</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, paddingTop: 20 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 6 },
  sub: { opacity: 0.85, marginBottom: 14, fontSize: 13 },
  summary: {
    backgroundColor: "#ecfdf5",
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  summaryLabel: { fontSize: 12, color: "#065f46", fontWeight: "600" },
  summaryValue: { fontSize: 28, fontWeight: "800", color: "#047857" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 8,
    elevation: 1,
  },
  causeName: { fontWeight: "700", fontSize: 16 },
  meta: { fontSize: 11, color: "#888", marginTop: 2 },
  amount: { fontSize: 18, fontWeight: "800", color: "#059669" },
});
