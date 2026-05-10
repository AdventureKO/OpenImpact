import * as storage from "@/utils/storage";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  causeId: string;
  canRate?: boolean;
  /** One-line explainer for demo / trust copy */
  showExplanation?: boolean;
};

async function loadAvg(
  causeId: string,
): Promise<{ avg: number; count: number }> {
  const all = (await storage.load("integrityRatings", {})) || {};
  const row = all[causeId];
  if (!row || !row.count) return { avg: 0, count: 0 };
  return { avg: row.sum / row.count, count: row.count };
}

export async function submitIntegrityRating(causeId: string, stars: number) {
  const all = { ...((await storage.load("integrityRatings", {})) || {}) };
  const prev = all[causeId] || { sum: 0, count: 0 };
  all[causeId] = { sum: prev.sum + stars, count: prev.count + 1 };
  await storage.save("integrityRatings", all);
  return all[causeId].sum / all[causeId].count;
}

export function IntegrityStars({
  causeId,
  canRate = true,
  showExplanation = false,
}: Props) {
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { avg: a, count: c } = await loadAvg(String(causeId));
      if (mounted) {
        setAvg(a);
        setCount(c);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [causeId]);

  const display = count ? avg.toFixed(1) : "—";

  const onPick = async (n: number) => {
    if (!canRate) return;
    try {
      const next = await submitIntegrityRating(String(causeId), n);
      setAvg(next);
      setCount((c) => c + 1);
      Alert.alert("Thanks", `You rated integrity ${n}/5.`);
    } catch (e) {
      Alert.alert("Could not save rating", String(e));
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>Integrity score</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity
              key={n}
              onPress={() => onPick(n)}
              disabled={!canRate}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Text
                style={[
                  styles.star,
                  n <= Math.round(avg) ? styles.starOn : styles.starOff,
                ]}
              >
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.meta}>
          {display} {count ? `(${count})` : "(no ratings yet)"}
        </Text>
      </View>
      {showExplanation ? (
        <Text style={styles.explain}>
          Integrity score from donor ratings after tracked delivery.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 0,
    gap: 6,
  },
  label: { fontWeight: "700", marginRight: 4, fontSize: 13 },
  stars: { flexDirection: "row" },
  star: { fontSize: 18, marginRight: 2 },
  starOn: { color: "#f1c40f" },
  starOff: { color: "#ddd" },
  meta: { fontSize: 12, color: "#666", marginLeft: 4 },
  explain: { fontSize: 11, color: "#64748b", marginTop: 6, lineHeight: 15 },
});
