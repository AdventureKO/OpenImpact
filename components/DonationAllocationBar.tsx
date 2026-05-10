import * as allocations from "@/utils/allocations";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

function colorForId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i);
  const c = (h & 0xffffff).toString(16).padStart(6, "0");
  return `#${c.slice(0, 6)}`;
}

export default function DonationAllocationBar({ donation }) {
  const [parts, setParts] = useState([]);

  useEffect(() => {
    (async () => {
      if (!donation) return;
      console.log("DonationAllocationBar: loading for donation", donation.id);
      const a = await allocations.assignmentsForDonation(donation.id);
      console.log(
        "DonationAllocationBar: found",
        a?.length || 0,
        "assignments for",
        donation.id,
      );
      setParts(a || []);
    })();
  }, [donation && donation.id]);

  const total = Number(donation?.amount) || 0;
  if (!donation) return null;

  const onPressSeg = (p) => {
    Alert.alert(
      p.allocationTitle || "Allocation",
      `Amount: $${p.amount}\nAllocation: ${p.allocationTitle || p.allocationId}\nProject: ${p.projectId || "—"}`,
    );
  };

  return (
    <View style={{ marginTop: 8 }}>
      <View style={styles.barWrap}>
        {parts.length === 0 ? (
          <View
            style={[styles.segment, { flex: 1, backgroundColor: "#f3f4f6" }]}
          />
        ) : (
          parts.map((p) => {
            const w = total > 0 ? (Number(p.amount) || 0) / total : 0.001;
            const color = colorForId(p.allocationId || p.id || "a");
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => onPressSeg(p)}
                style={[styles.segment, { flex: w, backgroundColor: color }]}
              />
            );
          })
        )}
      </View>
      <View style={{ flexDirection: "row", marginTop: 6, flexWrap: "wrap" }}>
        {parts.length === 0 ? (
          <Text style={styles.meta}>Unallocated</Text>
        ) : (
          parts.map((p) => (
            <Text
              key={p.id}
              style={[
                styles.meta,
                { color: colorForId(p.allocationId || p.id || "") },
              ]}
            >{`${p.amount} → ${p.allocationTitle ? p.allocationTitle.slice(0, 24) : (p.allocationId || "").slice(0, 6)}`}</Text>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    height: 14,
    borderRadius: 7,
    overflow: "hidden",
    backgroundColor: "#eee",
    flexDirection: "row",
  },
  segment: { height: "100%" },
  meta: { fontSize: 12, color: "#555", marginRight: 10, marginBottom: 4 },
});
