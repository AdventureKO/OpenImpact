import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useContext, useEffect, useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import ShareImpactButton from "../components/ShareImpactButton";
import { AuthContext } from "../context/AuthContext";
import { useThemeColor } from "../hooks/use-theme-color";
import * as storage from "../utils/storage";

export default function ReceiptScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params || {};
  const [receipt, setReceipt] = useState(null);

  const auth = useContext(AuthContext);

  useEffect(() => {
    (async () => {
      try {
        const all = (await storage.loadForUser(null, "receipts", [])) || [];
        const anon = (await storage.load("anonReceipts", [])) || [];
        const found =
          (all || []).find((r) => String(r.id) === String(id)) ||
          (anon || []).find((r) => String(r.id) === String(id));
        setReceipt(found || null);
      } catch (e) {
        console.warn("load receipt failed", e);
      }
    })();
  }, [id]);

  const exportJson = async () => {
    try {
      const s = JSON.stringify(receipt || {}, null, 2);
      console.log("Receipt JSON:\n", s);
      Alert.alert("Export", "Receipt JSON printed to console. Copy from logs.");
    } catch (e) {
      console.warn("export failed", e);
      Alert.alert("Export failed");
    }
  };

  const savePdf = async () => {
    try {
      const Print = require("expo-print");
      const Sharing = require("expo-sharing");
      const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1" /><style>body{font-family: -apple-system,BlinkMacSystemFont,'Segoe UI', Roboto, 'Helvetica Neue', Arial; padding:20px; color:#111} .header{display:flex;align-items:center;justify-content:space-between} h1{font-size:22px;margin:0} .meta{margin-top:12px} .row{margin-bottom:8px} .box{border:1px solid #e6e6e6;padding:12px;border-radius:8px;margin-top:12px} table{width:100%;border-collapse:collapse;margin-top:8px} td{padding:6px;border-bottom:1px solid #f1f1f1}</style></head><body><div class="header"><h1>Charity with Confidence</h1><div><strong>Receipt</strong><div style="font-size:12px;color:#666">${receipt.createdAt}</div></div></div><div class="meta"><div class="row"><strong>Receipt ID:</strong> ${receipt.id}</div><div class="row"><strong>Donation ID:</strong> ${receipt.donationId}</div><div class="row"><strong>Project:</strong> ${receipt.projectId || "—"}</div></div><div class="box"><h3 style="margin-top:0">Donation Details</h3><table><tr><td><strong>Amount</strong></td><td>$${receipt.amount}</td></tr><tr><td><strong>Donor</strong></td><td>${(receipt.donor && (receipt.donor.name || receipt.donor.id)) || "Anonymous"}</td></tr><tr><td><strong>Message</strong></td><td>${receipt.note || "—"}</td></tr></table></div><div style="margin-top:18px;font-size:12px;color:#666">Thank you for supporting causes through Charity with Confidence. This receipt is for your records.</div></body></html>`;
      const { uri } = await Print.printToFileAsync({ html });
      if (!uri) return Alert.alert("PDF", "Could not generate PDF");
      // Attach the PDF path to the stored receipt record so it can be re-used later
      const pdfUri = uri;

      // Update receipt in storage (user receipts or anonReceipts)
      try {
        // if current auth user matches receipt donor id/email, update their receipts
        const user = auth && auth.user;
        let updated = false;
        if (user) {
          const existing =
            (await storage.loadForUser(user, "receipts", [])) || [];
          const next = existing.map((r) => {
            if (String(r.id) === String(receipt.id)) {
              updated = true;
              return { ...r, pdfUri };
            }
            return r;
          });
          if (updated) await storage.saveForUser(user, "receipts", next);
        }

        if (!updated) {
          const anon = (await storage.load("anonReceipts", [])) || [];
          const nextAnon = anon.map((r) =>
            String(r.id) === String(receipt.id) ? { ...r, pdfUri } : r,
          );
          const foundInAnon = nextAnon.some(
            (r) => String(r.id) === String(receipt.id),
          );
          if (foundInAnon) {
            await storage.save("anonReceipts", nextAnon);
            updated = true;
          }
        }

        // Fallback: if not found in either list, try to update generic 'receipts' key
        if (!updated) {
          const generic =
            (await storage.loadForUser(null, "receipts", [])) || [];
          const nextGen = generic.map((r) =>
            String(r.id) === String(receipt.id) ? { ...r, pdfUri } : r,
          );
          if (nextGen.some((r) => String(r.id) === String(receipt.id))) {
            await storage.saveForUser(null, "receipts", nextGen);
            updated = true;
          }
        }
      } catch (e) {
        console.warn("attach pdf to receipt failed", e);
      }

      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("PDF ready", `PDF saved to: ${uri}`);
      }
    } catch (err) {
      console.warn("pdf export failed", err);
      Alert.alert(
        "PDF failed",
        `${err && err.message ? err.message : String(err)}`,
      );
    }
  };

  const bg = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");

  if (!receipt)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        <View style={{ padding: 16 }}>
          <Text style={{ color: text }}>No receipt found.</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.btn, { marginTop: 12 }]}
          >
            <Text style={{ color: "#fff" }}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: "#10b981" }]}>
          <Text style={styles.headerEmoji}>✅</Text>
          <Text style={styles.headerTitle}>Donation Complete!</Text>
          <Text style={styles.headerSubtitle}>
            Thank you for giving with impact
          </Text>
        </View>

        {/* Receipt Details Card */}
        <View style={styles.container}>
          <View style={styles.receiptCard}>
            <Text style={[styles.sectionTitle, { color: text }]}>
              Receipt Details
            </Text>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Donation Amount</Text>
              <Text style={[styles.amount, { color: text }]}>
                ${receipt.amount}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Project</Text>
              <Text style={[styles.value, { color: text }]}>
                {receipt.projectId || "—"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Receipt ID</Text>
              <Text style={[styles.value, { color: text }, styles.mono]}>
                {receipt.id}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Donation ID</Text>
              <Text style={[styles.value, { color: text }, styles.mono]}>
                {receipt.donationId}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Donor</Text>
              <Text style={[styles.value, { color: text }]}>
                {(receipt.donor && (receipt.donor.name || receipt.donor.id)) ||
                  "Anonymous"}
              </Text>
            </View>

            {receipt.note && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Message</Text>
                <Text style={[styles.value, { color: text }]}>
                  {receipt.note}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.label}>Date</Text>
              <Text style={[styles.value, { color: text }]}>
                {new Date(receipt.createdAt).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Social Share Section */}
          <View style={styles.shareSection}>
            <ShareImpactButton
              donationAmount={parseFloat(receipt.amount)}
              causeName={receipt.projectId || "a cause"}
              causeId={receipt.projectId}
              impact={{
                meals: Math.round(parseFloat(receipt.amount) * 2),
                trees: parseFloat(receipt.amount) * 0.1,
                families: parseFloat(receipt.amount) * 0.02,
              }}
            />
          </View>

          {/* Action Buttons */}
          <View style={{ marginTop: 16 }}>
            <TouchableOpacity
              onPress={exportJson}
              style={[
                styles.btn,
                { backgroundColor: "#8b5cf6", marginBottom: 8 },
              ]}
            >
              <Text style={styles.btnText}>📋 Export JSON</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={savePdf}
              style={[
                styles.btn,
                { backgroundColor: "#2563eb", marginBottom: 8 },
              ]}
            >
              <Text style={styles.btnText}>📄 Save PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.btn, { backgroundColor: "#6b7280" }]}
            >
              <Text style={styles.btnText}>✕ Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  container: {
    padding: 16,
  },
  receiptCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  detailRow: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  label: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
  },
  amount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#10b981",
  },
  mono: {
    fontFamily: "monospace",
    fontSize: 12,
  },
  shareSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  btn: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
