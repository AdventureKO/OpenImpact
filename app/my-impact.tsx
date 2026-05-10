import { DonationJourneyBar } from "@/components/DonationJourneyBar";
import { AuthContext } from "@/context/AuthContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import { on as onEvent } from "@/utils/events";
import * as storage from "@/utils/storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
    FlatList,
    SafeAreaView,
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
};

export default function MyImpactScreen() {
  const navigation = useNavigation();
  const auth = useContext(AuthContext);
  const bg = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");
  const secondary = useThemeColor({}, "secondary");
  const [rows, setRows] = useState<DonationRow[]>([]);
  const [causeFeeds, setCauseFeeds] = useState<Record<string, any[]>>({});

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
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={{ color: "#2563eb", fontWeight: "600" }}>← Back</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: text }]}>My impact</Text>
      <Text style={[styles.sub, { color: secondary }]}>
        See official transparency posts from each cause after your gift—the
        trail from dollars to proof.
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
            return (
              <View style={styles.card}>
                <Text style={[styles.amount, { color: text }]}>
                  ${Number(item.amount || 0).toFixed(2)}
                </Text>
                <Text style={styles.meta}>Cause id: {pid || "—"}</Text>
                <Text style={styles.meta}>
                  {new Date(since).toLocaleString()}
                </Text>
                <View style={{ marginTop: 8 }}>
                  <DonationJourneyBar
                    currentStep={(() => {
                      const feed = causeFeeds[pid] || [];
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
                      Official updates since my gift →
                    </Text>
                  </TouchableOpacity>
                  {pid
                    ? (() => {
                        const feed = causeFeeds[pid] || [];
                        const countSince = (feed || []).filter(
                          (f) =>
                            new Date(f.createdAt).getTime() >=
                            new Date(since).getTime(),
                        ).length;
                        if (countSince > 0)
                          return (
                            <Text
                              style={{
                                marginTop: 8,
                                color: "#374151",
                                fontSize: 13,
                              }}
                            >
                              {countSince} official update
                              {countSince > 1 ? "s" : ""} since your gift
                            </Text>
                          );
                        return null;
                      })()
                    : null}
                </View>
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
});
