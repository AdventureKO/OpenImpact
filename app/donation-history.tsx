import { AuthContext } from "@/context/AuthContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import * as donationStats from "@/utils/donationStats";
import * as storage from "@/utils/storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useContext, useMemo, useState } from "react";
import {
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

const JOURNEY_STAGES = [
  "Collected",
  "Allocated",
  "Purchasing",
  "Deployed",
  "Impact Verified",
];
const STAGE_COLORS: Record<string, string> = {
  Collected: "#3b82f6",
  Allocated: "#8b5cf6",
  Purchasing: "#f59e0b",
  Deployed: "#10b981",
  "Impact Verified": "#06b6d4",
};

export default function DonationHistoryScreen() {
  const navigation = useNavigation();
  const auth = useContext(AuthContext);
  const bg = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");

  const [donations, setDonations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStage, setFilterStage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<
    "recent" | "oldest" | "highest" | "lowest"
  >("recent");
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      if (!auth?.user) {
        setDonations([]);
        return;
      }

      const d = (await storage.loadForUser(auth.user, "donations", [])) || [];
      setDonations(d);
    } catch (e) {
      console.warn("donation history load failed", e);
    }
  }, [auth?.user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filteredAndSorted = useMemo(() => {
    let filtered = donations;

    // Apply search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (d) =>
          d.projectId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.cause?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.note?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply stage filter
    if (filterStage) {
      filtered = filtered.filter((d) => d.status === filterStage);
    }

    // Apply sorting
    filtered = donationStats.sortDonations(filtered, sortBy);

    return filtered;
  }, [donations, searchQuery, filterStage, sortBy]);

  const stats = useMemo(() => {
    const totalDonated = filteredAndSorted.reduce(
      (s, d) => s + (Number(d.amount) || 0),
      0,
    );
    const avgDonation =
      filteredAndSorted.length > 0
        ? totalDonated / filteredAndSorted.length
        : 0;
    const verified = filteredAndSorted.filter(
      (d) => d.status === "Impact Verified",
    ).length;
    const inProgress = filteredAndSorted.length - verified;
    return { totalDonated, avgDonation, verified, inProgress };
  }, [filteredAndSorted]);

  const groupedByMonth = useMemo(() => {
    const grouped = donationStats.groupByPeriod(filteredAndSorted, "month");
    return grouped;
  }, [filteredAndSorted]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ padding: 16, paddingBottom: 0 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginBottom: 12 }}
          >
            <Text style={{ color: "#2563eb", fontWeight: "600" }}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: text }]}>Donation History</Text>
          <Text style={{ color: "#666", fontSize: 13, marginTop: 4 }}>
            Track all your donations and their impact status
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={{ padding: 16 }}>
            {/* Quick Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Donated</Text>
                <Text style={[styles.statValue, { color: text }]}>
                  ${stats.totalDonated.toFixed(2)}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Average</Text>
                <Text style={[styles.statValue, { color: text }]}>
                  ${stats.avgDonation.toFixed(2)}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Verified</Text>
                <Text style={[styles.statValue, { color: "#10b981" }]}>
                  {stats.verified}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>In Progress</Text>
                <Text style={[styles.statValue, { color: "#f59e0b" }]}>
                  {stats.inProgress}
                </Text>
              </View>
            </View>

            {/* Search and Filter */}
            <View style={{ marginBottom: 16 }}>
              <View style={styles.searchBar}>
                <TextInput
                  placeholder="Search donations..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={[styles.searchInput, { color: text }]}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => setFilterModalVisible(true)}
                  style={[
                    styles.filterButton,
                    filterStage && {
                      backgroundColor: "#dbeafe",
                      borderColor: "#3b82f6",
                    },
                  ]}
                >
                  <Text
                    style={[
                      { fontWeight: "600", fontSize: 12 },
                      filterStage && { color: "#3b82f6" },
                    ]}
                  >
                    {filterStage ? `📍 ${filterStage}` : "🔽 Filter"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const sorts: Array<
                      "recent" | "oldest" | "highest" | "lowest"
                    > = ["recent", "oldest", "highest", "lowest"];
                    const current = sorts.indexOf(sortBy);
                    setSortBy(sorts[(current + 1) % sorts.length]);
                  }}
                  style={styles.sortButton}
                >
                  <Text style={{ fontWeight: "600", fontSize: 12 }}>
                    {sortBy === "recent" && "📅 Recent"}
                    {sortBy === "oldest" && "📅 Oldest"}
                    {sortBy === "highest" && "💰 High"}
                    {sortBy === "lowest" && "💰 Low"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Donations List */}
            {filteredAndSorted.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={[styles.emptyText, { color: text }]}>
                  No donations found
                </Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery
                    ? "Try a different search"
                    : "Start donating to see your history"}
                </Text>
              </View>
            ) : (
              <View>
                {Object.entries(groupedByMonth).map(
                  ([month, monthDonations]: any) => (
                    <View key={month} style={{ marginBottom: 16 }}>
                      <Text style={[styles.monthHeader, { color: text }]}>
                        {month}
                      </Text>
                      {monthDonations.map((donation: any) => {
                        const donationDate = new Date(donation.createdAt || 0);
                        const dateStr = donationDate.toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          },
                        );
                        const timeStr = donationDate.toLocaleTimeString(
                          "en-US",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        );

                        return (
                          <TouchableOpacity
                            key={donation.id}
                            onPress={() => setSelectedDonation(donation)}
                            style={styles.donationItem}
                          >
                            <View style={{ flex: 1 }}>
                              <View
                                style={{
                                  flexDirection: "row",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: 6,
                                }}
                              >
                                <Text
                                  style={[styles.projectName, { color: text }]}
                                >
                                  {donation.projectId || "Donation"}
                                </Text>
                                <Text style={styles.amount}>
                                  ${donation.amount}
                                </Text>
                              </View>

                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  marginBottom: 6,
                                }}
                              >
                                <Text style={styles.date}>
                                  📅 {dateStr} • {timeStr}
                                </Text>
                              </View>

                              {/* Status Badge */}
                              <View
                                style={[
                                  styles.statusBadge,
                                  {
                                    backgroundColor:
                                      (STAGE_COLORS[donation.status] ||
                                        "#999") + "20",
                                  },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.statusDot,
                                    {
                                      backgroundColor:
                                        STAGE_COLORS[donation.status] || "#999",
                                    },
                                  ]}
                                />
                                <Text
                                  style={[
                                    styles.statusText,
                                    {
                                      color:
                                        STAGE_COLORS[donation.status] || "#999",
                                    },
                                  ]}
                                >
                                  {donation.status || "Pending"}
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ),
                )}
              </View>
            )}

            <View style={{ height: 20 }} />
          </View>
        </ScrollView>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: bg }]}>
            <Text style={[styles.modalTitle, { color: text }]}>
              Filter by Status
            </Text>

            {[null, ...JOURNEY_STAGES].map((stage) => (
              <TouchableOpacity
                key={stage || "all"}
                onPress={() => {
                  setFilterStage(stage);
                  setFilterModalVisible(false);
                }}
                style={[
                  styles.filterOption,
                  filterStage === stage && { backgroundColor: "#dbeafe" },
                ]}
              >
                {stage && (
                  <View
                    style={[
                      styles.stageColorDot,
                      { backgroundColor: STAGE_COLORS[stage] || "#999" },
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.filterOptionText,
                    filterStage === stage && {
                      color: "#3b82f6",
                      fontWeight: "700",
                    },
                  ]}
                >
                  {stage ? stage : "All Statuses"}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setFilterModalVisible(false)}
              style={[styles.modalButton, { backgroundColor: "#3b82f6" }]}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Donation Detail Modal */}
      {selectedDonation && (
        <View style={styles.detailOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setSelectedDonation(null)}
          />
          <View style={[styles.detailContent, { backgroundColor: bg }]}>
            <TouchableOpacity
              onPress={() => setSelectedDonation(null)}
              style={{ alignSelf: "flex-end", marginBottom: 12 }}
            >
              <Text style={{ fontSize: 24 }}>×</Text>
            </TouchableOpacity>

            <Text style={[styles.detailTitle, { color: text }]}>
              {selectedDonation.projectId}
            </Text>
            <Text style={styles.detailAmount}>${selectedDonation.amount}</Text>

            <View style={styles.detailGrid}>
              <View style={styles.detailField}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={[styles.detailValue, { color: text }]}>
                  {new Date(
                    selectedDonation.createdAt || 0,
                  ).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.detailField}>
                <Text style={styles.detailLabel}>Status</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        (STAGE_COLORS[selectedDonation.status] || "#999") +
                        "20",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          STAGE_COLORS[selectedDonation.status] || "#999",
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: STAGE_COLORS[selectedDonation.status] || "#999",
                      },
                    ]}
                  >
                    {selectedDonation.status}
                  </Text>
                </View>
              </View>
            </View>

            {selectedDonation.note && (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.detailLabel}>Your Message</Text>
                <Text style={[styles.noteText, { color: text }]}>
                  "{selectedDonation.note}"
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setSelectedDonation(null)}
              style={[styles.closeButton, { backgroundColor: "#3b82f6" }]}
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
  title: { fontSize: 24, fontWeight: "800" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: "48%",
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statLabel: {
    fontSize: 10,
    color: "#666",
    fontWeight: "600",
    marginBottom: 4,
  },
  statValue: { fontSize: 16, fontWeight: "800" },
  searchBar: { marginBottom: 8 },
  searchInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  filterButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  sortButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  emptySubtext: { fontSize: 12, color: "#999" },
  monthHeader: { fontSize: 14, fontWeight: "700", marginBottom: 10 },
  donationItem: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  projectName: { fontSize: 14, fontWeight: "700" },
  amount: { fontSize: 16, fontWeight: "800", color: "#10b981" },
  date: { fontSize: 11, color: "#999" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  statusText: { fontSize: 10, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", marginBottom: 12 },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  stageColorDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  filterOptionText: { fontSize: 14, color: "#666" },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  detailOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  detailContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  detailTitle: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  detailAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#10b981",
    marginBottom: 16,
  },
  detailGrid: { flexDirection: "row", gap: 12, marginBottom: 16 },
  detailField: { flex: 1 },
  detailLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
    marginBottom: 4,
  },
  detailValue: { fontSize: 13, fontWeight: "600" },
  noteText: {
    fontSize: 13,
    fontStyle: "italic",
    backgroundColor: "#f9fafb",
    padding: 10,
    borderRadius: 8,
  },
  closeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
});
