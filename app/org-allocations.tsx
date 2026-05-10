import { AuthContext } from "@/context/AuthContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import * as allocations from "@/utils/allocations";
import { appendIncomingDonation } from "@/utils/fundTracking";
import * as sync from "@/utils/sync";
import { useFocusEffect, useRouter, useSearchParams } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function OrgAllocationsScreen() {
  const auth = useContext(AuthContext);
  const bg = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");
  const params = useSearchParams();
  const router = useRouter();

  const [qTitle, setQTitle] = useState("Materials");
  const [qAmount, setQAmount] = useState("10000");
  const [rows, setRows] = useState([]);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportText, setExportText] = useState("");
  const [exportTitle, setExportTitle] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const load = useCallback(async () => {
    const list = await allocations.loadAllocationsForUser(auth?.user ?? null);
    setRows(list || []);
  }, [auth?.user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const create = async () => {
    try {
      const alloc = await allocations.createAllocationForUser(
        auth.user,
        params.projectId || "",
        qTitle,
        Number(qAmount),
        false,
      );
      Alert.alert(
        "Allocation created",
        `${alloc.title} ($${alloc.targetAmount})`,
      );
      setQTitle("Materials");
      setQAmount("10000");
      load();
    } catch (e) {
      console.warn(e);
      Alert.alert("Error", "Failed to create allocation");
    }
  };

  const runDemo = async () => {
    try {
      const projectId = params.projectId || "demo-prj";
      // seed some incoming donations
      const samples = [200, 1500, 3000, 2500, 800];
      for (const amt of samples) {
        const entry = {
          projectId,
          amount: amt,
          donationId: `demo-don-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date().toISOString(),
        };
        await appendIncomingDonation(entry);
        // small delay to ensure ordering
        await new Promise((r) => setTimeout(r, 50));
      }

      // create and release a sample allocation
      const alloc = await allocations.createAllocationForUser(
        auth.user,
        projectId,
        "Materials (demo)",
        10000,
        false,
      );
      const res = await allocations.releaseAllocation(auth.user, alloc.id);
      Alert.alert(
        "Demo complete",
        `Seeded ${samples.length} donations. Assigned $${res.assigned} to allocation ${alloc.title}`,
      );
      load();
    } catch (e) {
      console.warn("demo run failed", e);
      Alert.alert("Demo failed", e && e.message ? e.message : String(e));
    }
  };

  const release = async (id) => {
    try {
      const res = await allocations.releaseAllocation(auth.user, id);
      Alert.alert("Released", `Assigned $${res.assigned} to allocation`);
      load();
    } catch (e) {
      console.warn(e);
      Alert.alert("Error", "Release failed");
    }
  };

  const markSynced = async (id) => {
    // simple local 'sync' placeholder: flag allocation as synced
    const list = await allocations.loadAllocationsForUser(auth.user);
    const idx = (list || []).findIndex((a) => a.id === id);
    if (idx === -1) return;
    list[idx].synced = Date.now();
    await allocations.saveAllocationsForUser(auth.user, list);
    Alert.alert("Marked synced");
    load();
  };

  const showExport = (title, text) => {
    setExportTitle(title || "Export");
    setExportText(text || "");
    setExportModalVisible(true);
  };

  const doSync = async () => {
    try {
      setIsSyncing(true);
      const res = await sync.mockSyncToServer(auth.user);
      Alert.alert(
        "Sync result",
        `Synced ${res.syncedCount} allocations, sent ${res.assignmentsSent} assignments`,
      );
      load();
    } catch (e) {
      console.warn(e);
      Alert.alert("Sync failed", e && e.message ? e.message : String(e));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: bg }]}>
      <Text style={[styles.title, { color: text }]}>Manage Allocations</Text>
      <Text style={[styles.sub, { color: text }]}>
        Create, release, and mark allocations for this org (demo).
      </Text>

      <View style={{ flexDirection: "row", marginTop: 12, marginBottom: 12 }}>
        <TextInput
          placeholder="Title"
          value={qTitle}
          onChangeText={setQTitle}
          style={styles.input}
        />
        <TextInput
          placeholder="Amount"
          value={qAmount}
          onChangeText={setQAmount}
          keyboardType="numeric"
          style={[styles.input, { width: 120 }]}
        />
        <TouchableOpacity onPress={create} style={styles.primaryBtn}>
          <Text style={{ color: "#fff" }}>Create</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TouchableOpacity
          style={[
            styles.smallBtn,
            { backgroundColor: "#2563eb", marginRight: 8 },
          ]}
          onPress={async () => {
            try {
              const csv = await allocations.exportAssignmentsAsCSV();
              console.log("Assignments CSV:\n", csv);
              showExport("Assignments CSV", csv);
            } catch (e) {
              console.warn(e);
              Alert.alert("Error", "Export failed");
            }
          }}
        >
          <Text style={{ color: "#fff" }}>Export assignments (CSV)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.smallBtn,
            { backgroundColor: "#7c3aed", marginRight: 8 },
          ]}
          onPress={async () => {
            try {
              const json = await allocations.exportAllAsJSON();
              console.log("Allocations+Assignments JSON:\n", json);
              showExport("Allocations JSON", json);
            } catch (e) {
              console.warn(e);
              Alert.alert("Error", "Export failed");
            }
          }}
        >
          <Text style={{ color: "#fff" }}>Export JSON</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.smallBtn,
            { backgroundColor: "#059669", marginRight: 8 },
          ]}
          onPress={doSync}
          disabled={isSyncing}
        >
          <Text style={{ color: "#fff" }}>
            {isSyncing ? "Syncing…" : "Sync to server"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.smallBtn, { backgroundColor: "#111827" }]}
          onPress={runDemo}
        >
          <Text style={{ color: "#fff" }}>Run demo simulation</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        ListEmptyComponent={
          <Text style={{ color: text }}>No allocations yet.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.causeName, { color: text }]}>
                {item.title}
              </Text>
              <Text style={styles.meta}>
                Target: ${Number(item.targetAmount).toFixed(2)} •{" "}
                {item.releasedAt ? "Released" : "Draft"}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <TouchableOpacity
                style={styles.smallBtn}
                onPress={() => release(item.id)}
              >
                <Text style={{ color: "#fff" }}>Release</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.smallBtn,
                  { backgroundColor: "#6b7280", marginTop: 8 },
                ]}
                onPress={() => markSynced(item.id)}
              >
                <Text style={{ color: "#fff" }}>Mark Synced</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal
        visible={exportModalVisible}
        animationType="slide"
        onRequestClose={() => setExportModalVisible(false)}
      >
        <SafeAreaView style={[{ flex: 1, padding: 12, backgroundColor: bg }]}>
          <Text style={{ fontWeight: "700", marginBottom: 8, color: text }}>
            {exportTitle}
          </Text>
          <TextInput
            value={exportText}
            editable
            multiline
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 8,
              color: "#000",
              backgroundColor: "#fff",
            }}
          />
          <View style={{ flexDirection: "row", marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => {
                console.log(exportText);
                Alert.alert("Logged", "Export printed to console");
              }}
              style={[styles.primaryBtn, { marginRight: 8 }]}
            >
              <Text style={{ color: "#fff" }}>Log & Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setExportModalVisible(false)}
              style={[styles.smallBtn, { backgroundColor: "#95a5a6" }]}
            >
              <Text style={{ color: "#fff" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

<View style={{ flexDirection: "row", marginBottom: 8 }}>
  <TouchableOpacity
    style={[styles.smallBtn, { backgroundColor: "#2563eb", marginRight: 8 }]}
    onPress={async () => {
      try {
        const csv = await allocations.exportAssignmentsAsCSV();
        console.log("Assignments CSV:\n", csv);
        Alert.alert("Exported", "Assignments CSV printed to console.");
      } catch (e) {
        console.warn(e);
        Alert.alert("Error", "Export failed");
      }
    }}
  >
    <Text style={{ color: "#fff" }}>Export assignments (CSV)</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.smallBtn, { backgroundColor: "#7c3aed" }]}
    onPress={async () => {
      try {
        const json = await allocations.exportAllAsJSON();
        console.log("Allocations+Assignments JSON:\n", json);
        Alert.alert("Exported", "Allocations JSON printed to console.");
      } catch (e) {
        console.warn(e);
        Alert.alert("Error", "Export failed");
      }
    }}
  >
    <Text style={{ color: "#fff" }}>Export JSON</Text>
  </TouchableOpacity>
</View>;
const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, paddingTop: 20 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 6 },
  sub: { opacity: 0.85, marginBottom: 14, fontSize: 13 },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
    flex: 1,
  },
  primaryBtn: {
    backgroundColor: "#059669",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: "center",
  },
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
  meta: { fontSize: 12, color: "#888", marginTop: 4 },
  smallBtn: {
    backgroundColor: "#0ea5a4",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
});
