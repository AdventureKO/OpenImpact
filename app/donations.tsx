import React, { useContext, useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import DonationAllocationBar from "../components/DonationAllocationBar";
import { AuthContext } from "../context/AuthContext";
import { useThemeColor } from "../hooks/use-theme-color";
import { seedDemoDonations } from "../utils/seedDemoDonations";
import * as storage from "../utils/storage";

export default function DonationsScreen() {
  const bg = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");
  const auth = useContext(AuthContext);
  const [donations, setDonations] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        // Always ensure demo allocations are set up
        await seedDemoDonations();

        if (auth && auth.user) {
          const d =
            (await storage.loadForUser(auth.user, "donations", [])) || [];
          setDonations(d);
        } else {
          const d = (await storage.load("anonDonations", [])) || [];
          setDonations(d);
        }
      } catch (e) {
        console.warn("load donations failed", e);
      }
    })();
  }, [auth && auth.user]);

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.amount, { color: text }]}>${item.amount}</Text>
        <Text style={{ color: text }}>{item.note || "—"}</Text>
        <Text style={{ color: text, fontSize: 12, marginTop: 6 }}>
          Project: {item.projectId || "—"}
        </Text>
        <Text style={{ color: text, fontSize: 12 }}>
          Date: {new Date(item.createdAt).toLocaleString()}
        </Text>
        <DonationAllocationBar donation={item} />
      </View>
      <TouchableOpacity
        onPress={() => {
          Alert.alert(
            "Donation",
            `ID: ${item.id}\nAmount: ${item.amount}\nProject: ${item.projectId || "—"}`,
          );
        }}
        style={[styles.viewBtn]}
      >
        <Text style={{ color: "#fff" }}>View</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: bg }]}>
      <View style={{ padding: 16 }}>
        <Text
          style={[
            { fontSize: 22, fontWeight: "700", marginBottom: 8, color: text },
          ]}
        >
          My Donations
        </Text>
        {donations.length === 0 ? (
          <Text style={{ color: text }}>No donations yet.</Text>
        ) : (
          <FlatList
            data={donations}
            keyExtractor={(d) => d.id}
            renderItem={renderItem}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  amount: { fontSize: 18, fontWeight: "700" },
  viewBtn: { backgroundColor: "#2980b9", padding: 8, borderRadius: 8 },
});
