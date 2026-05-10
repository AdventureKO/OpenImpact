import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useContext, useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { useThemeColor } from "../hooks/use-theme-color";

const IMPACT_METRICS = {
  meals: { factor: 2, emoji: "🍽️", label: "Meals provided" },
  trees: { factor: 0.1, emoji: "🌱", label: "Trees planted" },
  hours: { factor: 0.5, emoji: "⏱️", label: "Hours of service" },
  families: { factor: 0.02, emoji: "👨‍👩‍👧", label: "Families reached" },
};

export default function DonateScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params || {};
  const auth = useContext(AuthContext);
  const bg = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");
  const primary = useThemeColor({}, "primary");

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const donationAmount =
    parseFloat(String(amount).replace(/[^0-9.]/g, "")) || 0;

  const impacts = {
    meals: Math.round(donationAmount * IMPACT_METRICS.meals.factor),
    trees: Math.round(donationAmount * IMPACT_METRICS.trees.factor * 10) / 10,
    hours: Math.round(donationAmount * IMPACT_METRICS.hours.factor * 10) / 10,
    families:
      Math.round(donationAmount * IMPACT_METRICS.families.factor * 10) / 10,
  };

  const handleDonate = async () => {
    const n = parseFloat(String(amount).replace(/[^0-9.]/g, ""));
    if (!n || n <= 0)
      return Alert.alert("Validation", "Please enter a valid donation amount");
    setProcessing(true);
    try {
      navigation.navigate("DonateConfirm", {
        projectId: id || null,
        amount: String(n),
        note: String(note || ""),
      });
    } catch (e) {
      console.warn("donate failed", e);
      Alert.alert("Error", "Could not record donation");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: bg }, styles.wrap]}>
      <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: text }]}>Donate to Impact</Text>
        <Text style={{ color: text, marginBottom: 16, opacity: 0.8 }}>
          Project ID: {id || "—"}
        </Text>

        {/* Amount Input */}
        <Text style={[styles.label, { color: text }]}>Donation Amount</Text>
        <View style={styles.amountInputContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#999"
            value={amount}
            onChangeText={setAmount}
            style={[styles.amountInput, { color: text }]}
          />
        </View>

        {/* Impact Preview */}
        {donationAmount > 0 && (
          <View style={styles.impactPreview}>
            <Text style={[styles.impactTitle, { color: text }]}>
              ✨ Your Impact: ${donationAmount.toFixed(2)}
            </Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metric}>
                <Text style={styles.metricEmoji}>
                  {IMPACT_METRICS.meals.emoji}
                </Text>
                <Text style={[styles.metricValue, { color: text }]}>
                  {impacts.meals}
                </Text>
                <Text style={styles.metricLabel}>
                  {IMPACT_METRICS.meals.label}
                </Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricEmoji}>
                  {IMPACT_METRICS.trees.emoji}
                </Text>
                <Text style={[styles.metricValue, { color: text }]}>
                  {impacts.trees}
                </Text>
                <Text style={styles.metricLabel}>
                  {IMPACT_METRICS.trees.label}
                </Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricEmoji}>
                  {IMPACT_METRICS.hours.emoji}
                </Text>
                <Text style={[styles.metricValue, { color: text }]}>
                  {impacts.hours}
                </Text>
                <Text style={styles.metricLabel}>
                  {IMPACT_METRICS.hours.label}
                </Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricEmoji}>
                  {IMPACT_METRICS.families.emoji}
                </Text>
                <Text style={[styles.metricValue, { color: text }]}>
                  {impacts.families}
                </Text>
                <Text style={styles.metricLabel}>
                  {IMPACT_METRICS.families.label}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Amount Presets */}
        <Text style={[styles.label, { color: text, marginTop: 16 }]}>
          Quick Amount
        </Text>
        <View style={styles.presetsRow}>
          {[25, 50, 100, 250].map((preset) => (
            <TouchableOpacity
              key={preset}
              onPress={() => setAmount(String(preset))}
              style={[
                styles.preset,
                amount === String(preset) && styles.presetActive,
              ]}
            >
              <Text
                style={[
                  styles.presetText,
                  amount === String(preset) && styles.presetTextActive,
                ]}
              >
                ${preset}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Message */}
        <Text style={[styles.label, { color: text, marginTop: 16 }]}>
          Message (optional)
        </Text>
        <TextInput
          placeholder="Add a note for the organization..."
          placeholderTextColor="#888"
          value={note}
          onChangeText={setNote}
          style={[styles.textarea, { color: text }]}
          multiline
        />

        {/* Action Buttons */}
        <View style={{ height: 16 }} />
        <TouchableOpacity
          onPress={handleDonate}
          disabled={processing || donationAmount <= 0}
          style={[
            styles.donateBtn,
            {
              backgroundColor: donationAmount > 0 ? primary : "#ccc",
              opacity: processing ? 0.7 : 1,
            },
          ]}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
            {processing
              ? "Processing..."
              : `Donate $${donationAmount.toFixed(2)}`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.btn, { backgroundColor: "#95a5a6" }]}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  title: { fontSize: 26, fontWeight: "800", marginBottom: 4 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2563eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: "rgba(37, 99, 235, 0.05)",
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2563eb",
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: "700",
    padding: 12,
  },
  impactPreview: {
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#2563eb",
  },
  impactTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metric: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  metricEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  metricLabel: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  presetsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  preset: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  presetActive: {
    borderColor: "#2563eb",
    backgroundColor: "#dbeafe",
  },
  presetText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  presetTextActive: {
    color: "#0369a1",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  textarea: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    height: 100,
    textAlignVertical: "top",
    backgroundColor: "transparent",
  },
  donateBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  btn: { padding: 14, borderRadius: 8, alignItems: "center" },
});
