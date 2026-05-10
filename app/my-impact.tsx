import DonationAllocationBar from "@/components/DonationAllocationBar";
import { DonationJourneyBar } from "@/components/DonationJourneyBar";
import { AuthContext } from "@/context/AuthContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import * as allocations from "@/utils/allocations";
import { on as onEvent } from "@/utils/events";
import * as storage from "@/utils/storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
    FlatList,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type DonationRow = {
  id: string;
  amount?: number;
  projectId?: string | null;
  createdAt?: string;
  journeyStep?: number;
};

export default function MyImpactScreen() {
  const navigation = useNavigation();
  const auth = useContext(AuthContext);
  const bg = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");
  const secondary = useThemeColor({}, "secondary");
  const [rows, setRows] = useState<DonationRow[]>([]);
  const [causeFeeds, setCauseFeeds] = useState<Record<string, any[]>>({});
  const [donationAllocations, setDonationAllocations] = useState<
    Record<string, any[]>
  >({});

  const load = useCallback(async () => {
    if (!auth?.user) {
      setRows([]);
      return;
    }
    const d = ((await storage.loadForUser(auth.user, "donations", [])) ||
      []) as DonationRow[];
    setRows(
      d.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      ),
    );
    try {
      const ids = Array.from(
        new Set((d || []).map((r) => String(r.projectId || ""))),
      ).filter(Boolean);
      const map: Record<string, any[]> = {};
      await Promise.all(
        ids.map(async (id) => {
          try {
            const items = ((await storage.load(`causeFeed_${id}`, [])) ||
              []) as any[];
            map[id] = items.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            );
          } catch (e) {
            map[id] = [];
          }
        }),
      );
      setCauseFeeds(map);
    } catch (e) {
      console.warn("preload feeds failed", e);
    }
    // Load allocations for each donation
    try {
      const allocMap: Record<string, any[]> = {};
      await Promise.all(
        (d || []).map(async (donation) => {
          try {
            const alcs = await allocations.assignmentsForDonation(donation.id);
            allocMap[donation.id] = alcs || [];
          } catch (e) {
            allocMap[donation.id] = [];
          }
        }),
      );
      setDonationAllocations(allocMap);
    } catch (e) {
      console.warn("preload allocations failed", e);
    }
  }, [auth?.user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    const unsub = onEvent("causeUpdated", (payload) => {
      try {
        const id = payload?.id;
        const item = payload?.item;
        if (id && item) {
          setCauseFeeds((prev) => ({
            ...(prev || {}),
            [id]: [item, ...((prev && prev[id]) || [])],
          }));
        }
        // reload donations to pick up journeyStep changes
        load();
      } catch (e) {
        console.warn("my-impact: causeUpdated handler failed", e);
      }
    });
    return () => {
      try {
        unsub();
      } catch (e) {}
    };
  }, [load]);

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <Text style={{ color: "#2563eb", fontWeight: "600" }}>← Back</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.title, { color: text }]}>My Impact</Text>
      <Text style={[styles.sub, { color: secondary }]}>
        See how your donations create measurable impact—from gift to verified
        outcome.
      </Text>

      {!auth?.user ? (
        <Text style={{ color: text }}>
          Sign in to see donations tied to your account.
        </Text>
      ) : rows.length === 0 ? (
        <Text style={{ color: text }}>
          No donations yet. Browse causes and donate to start your trail.
        </Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const pid = item.projectId ? String(item.projectId) : "";
            const since = item.createdAt || new Date().toISOString();
            const allocations = donationAllocations[item.id] || [];
            const feed = causeFeeds[pid] || [];

            // Get allocation categories from this donation's allocations
            const allocationCategories = Array.from(
              new Set(
                allocations.map((a) => a.allocationTitle).filter(Boolean),
              ),
            );

            // Filter feed posts that match this donation's allocation categories
            const relatedPosts = feed.filter(
              (post) =>
                new Date(post.createdAt || post.date).getTime() >=
                  new Date(since).getTime() &&
                (allocationCategories.length === 0 ||
                  allocationCategories.includes(post.allocationTag)),
            );

            return (
              <View style={styles.card}>
                <Text style={[styles.amount, { color: text }]}>
                  ${Number(item.amount || 0).toFixed(2)}
                </Text>
                <Text style={styles.meta}>📍 Cause: {pid || "—"}</Text>
                <Text style={styles.meta}>
                  📅 {new Date(since).toLocaleString()}
                </Text>

                {/* Allocation breakdown for this specific donation */}
                {allocations.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <DonationAllocationBar donation={item} />
                  </View>
                )}

                {/* Journey progress */}
                <View style={{ marginTop: 12 }}>
                  <DonationJourneyBar
                    currentStep={(() => {
                      const latestStage = (feed || []).reduce((s, it) => {
                        const st =
                          typeof it.journeyStage === "number"
                            ? Math.min(Math.max(it.journeyStage, 0), 4)
                            : -1;
                        return Math.max(s, st);
                      }, -1);
                      const known = Number(item.journeyStep || 0);
                      return Math.max(
                        known,
                        latestStage === -1 ? 0 : latestStage,
                      );
                    })()}
                  />
                </View>

                {/* Related transparency posts */}
                {relatedPosts.length > 0 && (
                  <View style={styles.relatedSection}>
                    <Text style={[styles.relatedTitle, { color: text }]}>
                      🎯 Your donation's impact trail ({relatedPosts.length})
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginTop: 8 }}
                    >
                      {relatedPosts.slice(0, 5).map((post) => (
                        <View key={post.id} style={styles.postCard}>
                          <View
                            style={[
                              styles.allocTag,
                              {
                                backgroundColor:
                                  post.allocationTag === "Program"
                                    ? "#dcfce7"
                                    : post.allocationTag === "Staff"
                                      ? "#dbeafe"
                                      : post.allocationTag === "Operations"
                                        ? "#fef3c7"
                                        : "#f3e8ff",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.allocTagText,
                                {
                                  color:
                                    post.allocationTag === "Program"
                                      ? "#166534"
                                      : post.allocationTag === "Staff"
                                        ? "#0c4a6e"
                                        : post.allocationTag === "Operations"
                                          ? "#92400e"
                                          : "#6b21a8",
                                },
                              ]}
                            >
                              {post.allocationTag}
                            </Text>
                          </View>
                          <Text style={styles.postText} numberOfLines={3}>
                            {post.text}
                          </Text>
                          <Text style={styles.postTime}>
                            {post.hoursAgo < 1
                              ? "just now"
                              : post.hoursAgo < 24
                                ? `${Math.round(post.hoursAgo)}h ago`
                                : `${Math.round(post.hoursAgo / 24)}d ago`}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <TouchableOpacity
                  disabled={!pid}
                  style={[styles.cta, !pid && styles.ctaDisabled]}
                  onPress={() =>
                    navigation.navigate(
                      "OrgCauseDetail" as never,
                      { id: pid, sinceIso: since } as never,
                    )
                  }
                >
                  <Text style={styles.ctaText}>
                    All updates from this cause →
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, paddingTop: 12 },
  header: { marginBottom: 12 },
  back: { marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 8 },
  sub: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
  },
  amount: { fontSize: 22, fontWeight: "800" },
  meta: { fontSize: 12, color: "#64748b", marginTop: 4 },
  cta: {
    marginTop: 12,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  ctaDisabled: { backgroundColor: "#94a3b8" },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  relatedSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  relatedTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  postCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    width: 260,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  allocTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  allocTagText: {
    fontSize: 11,
    fontWeight: "700",
  },
  postText: {
    fontSize: 12,
    color: "#374151",
    lineHeight: 16,
  },
  postTime: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 6,
  },
});
