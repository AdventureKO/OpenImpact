import { AuthContext } from "@/context/AuthContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import * as allocations from "@/utils/allocations";
import * as storage from "@/utils/storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import React, { useCallback, useContext, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type DonationExport = {
  id: string;
  amount: number;
  causeName: string;
  causeId: string;
  donatedAt: string;
  allocations: Array<{
    allocationTitle: string;
    amount: number;
    projectId?: string;
  }>;
  journeyStage: number;
  journeyStages: string[];
};

export default function ExportImpactScreen() {
  const navigation = useNavigation();
  const auth = useContext(AuthContext);
  const bg = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");
  const secondary = useThemeColor({}, "secondary");
  const [donations, setDonations] = useState<DonationExport[]>([]);
  const [projects, setProjects] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const journeyLabels = [
    "Collected",
    "Allocated",
    "Purchasing",
    "Deployed",
    "Impact Verified",
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!auth?.user) {
        setDonations([]);
        setLoading(false);
        return;
      }

      // Load donations
      const d = ((await storage.loadForUser(auth.user, "donations", [])) ||
        []) as any[];

      // Load projects for reference
      try {
        const resp = await fetch(`http://localhost:3000/api/fundraisers`);
        const data = await resp.json();
        const projectMap: Record<string, any> = {};
        (data.fundraisers || []).forEach((p: any) => {
          projectMap[p.id] = p;
        });
        setProjects(projectMap);
      } catch (e) {
        console.warn("failed to load projects", e);
      }

      // Enrich donations with allocations
      const enriched = await Promise.all(
        d.map(async (don) => {
          try {
            const alcs = await allocations.assignmentsForDonation(don.id);
            return {
              id: don.id,
              amount: Number(don.amount || 0),
              causeName:
                projects[don.projectId]?.name || don.projectId || "Unknown",
              causeId: don.projectId || "",
              donatedAt: don.createdAt || new Date().toISOString(),
              allocations: (alcs || []).map((a) => ({
                allocationTitle: a.allocationTitle || "Unallocated",
                amount: Number(a.amount || 0),
                projectId: a.projectId,
              })),
              journeyStage: Number(don.journeyStep || 0),
              journeyStages: journeyLabels,
            };
          } catch (e) {
            return {
              id: don.id,
              amount: Number(don.amount || 0),
              causeName:
                projects[don.projectId]?.name || don.projectId || "Unknown",
              causeId: don.projectId || "",
              donatedAt: don.createdAt || new Date().toISOString(),
              allocations: [],
              journeyStage: Number(don.journeyStep || 0),
              journeyStages: journeyLabels,
            };
          }
        }),
      );

      setDonations(
        enriched.sort(
          (a, b) =>
            new Date(b.donatedAt).getTime() - new Date(a.donatedAt).getTime(),
        ),
      );
    } catch (e) {
      console.warn("export load failed", e);
      Alert.alert("Error", "Failed to load your donation data");
    } finally {
      setLoading(false);
    }
  }, [auth?.user, projects]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const exportAsJSON = async () => {
    setExporting(true);
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        donor: auth?.user?.email || "Unknown",
        totalDonated: donations.reduce((s, d) => s + d.amount, 0),
        donationCount: donations.length,
        donations: donations,
        verificationNote:
          "This export contains your donation trail for independent verification.",
      };

      const json = JSON.stringify(exportData, null, 2);
      const filename = `donation-trail-${Date.now()}.json`;
      const filepath = `${FileSystem.DocumentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(filepath, json);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filepath, {
          mimeType: "application/json",
          dialogTitle: "Share your donation trail",
        });
      } else {
        Alert.alert("Success", `File saved to ${filepath}`);
      }
    } catch (e) {
      console.warn("JSON export failed", e);
      Alert.alert("Error", "Failed to export JSON");
    } finally {
      setExporting(false);
    }
  };

  const exportAsCSV = async () => {
    setExporting(true);
    try {
      const headers = [
        "Donation ID",
        "Amount",
        "Cause",
        "Donated At",
        "Journey Stage",
        "Allocation Category",
        "Allocation Amount",
      ];

      const rows: string[][] = [];
      donations.forEach((don) => {
        if (don.allocations.length > 0) {
          don.allocations.forEach((alc) => {
            rows.push([
              don.id,
              `$${don.amount.toFixed(2)}`,
              don.causeName,
              don.donatedAt,
              `${don.journeyStage}/4 (${journeyLabels[don.journeyStage] || "Unknown"})`,
              alc.allocationTitle,
              `$${alc.amount.toFixed(2)}`,
            ]);
          });
        } else {
          rows.push([
            don.id,
            `$${don.amount.toFixed(2)}`,
            don.causeName,
            don.donatedAt,
            `${don.journeyStage}/4 (${journeyLabels[don.journeyStage] || "Unknown"})`,
            "Unallocated",
            "—",
          ]);
        }
      });

      const csv = [headers, ...rows].map((row) =>
        row
          .map((cell) =>
            typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell,
          )
          .join(","),
      );

      const csvContent = csv.join("\n");
      const filename = `donation-trail-${Date.now()}.csv`;
      const filepath = `${FileSystem.DocumentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(filepath, csvContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filepath, {
          mimeType: "text/csv",
          dialogTitle: "Share your donation trail",
        });
      } else {
        Alert.alert("Success", `File saved to ${filepath}`);
      }
    } catch (e) {
      console.warn("CSV export failed", e);
      Alert.alert("Error", "Failed to export CSV");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const totalDonated = donations.reduce((s, d) => s + d.amount, 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bg }]}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={{ color: "#2563eb", fontWeight: "600" }}>← Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: text }]}>
        Export Your Impact Trail
      </Text>
      <Text style={[styles.sub, { color: secondary }]}>
        Download your complete donation history with allocation breakdown for
        independent verification.
      </Text>

      {/* Summary stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${totalDonated.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Donated</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{donations.length}</Text>
          <Text style={styles.statLabel}>Donations</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {donations.filter((d) => d.journeyStage === 4).length}
          </Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
      </View>

      {/* Export options */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: text }]}>
          Export Format
        </Text>

        <TouchableOpacity
          disabled={exporting}
          style={[styles.exportButton, { opacity: exporting ? 0.6 : 1 }]}
          onPress={exportAsJSON}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.exportIcon}>📄</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.exportTitle}>JSON Format</Text>
                <Text style={styles.exportDesc}>
                  Complete metadata & allocations
                </Text>
              </View>
              <Text style={{ color: "#fff", fontSize: 18 }}>→</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          disabled={exporting}
          style={[
            styles.exportButton,
            { opacity: exporting ? 0.6 : 1, backgroundColor: "#059669" },
          ]}
          onPress={exportAsCSV}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.exportIcon}>📊</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.exportTitle}>CSV Format</Text>
                <Text style={styles.exportDesc}>Spreadsheet-friendly</Text>
              </View>
              <Text style={{ color: "#fff", fontSize: 18 }}>→</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Donation list preview */}
      {donations.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: text }]}>
            Preview ({donations.length})
          </Text>

          {donations.map((don) => (
            <View key={don.id} style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <View>
                  <Text style={[styles.previewAmount, { color: text }]}>
                    ${don.amount.toFixed(2)}
                  </Text>
                  <Text style={styles.previewCause}>{don.causeName}</Text>
                </View>
                <View style={styles.journeyBadge}>
                  <Text style={styles.journeyStage}>{don.journeyStage}/4</Text>
                  <Text style={styles.journeyLabel}>
                    {journeyLabels[don.journeyStage] || "Unknown"}
                  </Text>
                </View>
              </View>

              <Text style={styles.previewDate}>
                {new Date(don.donatedAt).toLocaleDateString()}
              </Text>

              {don.allocations.length > 0 && (
                <View style={styles.previewAllocations}>
                  {don.allocations.map((alc, idx) => (
                    <Text key={idx} style={styles.allocationItem}>
                      • {alc.allocationTitle}: ${alc.amount.toFixed(2)}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {donations.length === 0 && (
        <Text style={[styles.emptyText, { color: secondary }]}>
          No donations to export yet. Start donating to build your impact trail!
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 12 },
  back: { marginBottom: 16 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 8 },
  sub: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 4,
    alignItems: "center",
  },
  statValue: { fontSize: 18, fontWeight: "800", color: "#1f2937" },
  statLabel: { fontSize: 11, color: "#6b7280", marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  exportButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  exportIcon: { fontSize: 24, marginRight: 12 },
  exportTitle: { color: "#fff", fontWeight: "700", fontSize: 14 },
  exportDesc: { color: "#93c5fd", fontSize: 12, marginTop: 2 },
  previewCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  previewAmount: { fontSize: 16, fontWeight: "700" },
  previewCause: { fontSize: 12, color: "#64748b", marginTop: 2 },
  journeyBadge: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  journeyStage: { fontSize: 12, fontWeight: "700", color: "#0369a1" },
  journeyLabel: { fontSize: 10, color: "#0369a1", marginTop: 2 },
  previewDate: { fontSize: 11, color: "#9ca3af", marginTop: 8 },
  previewAllocations: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  allocationItem: { fontSize: 11, color: "#475569", marginBottom: 4 },
  emptyText: { textAlign: "center", fontSize: 14, marginTop: 24 },
});
