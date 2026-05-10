import { USER_ROLE } from "@/constants/userRoles";
import { resetDemoSeedData } from "@/utils/hydrateDemoTransparency";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Linking,
    Modal,
    SafeAreaView,
    Share,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { useThemeColor } from "../hooks/use-theme-color";
import { load, remove } from "../utils/storage";

export default function ProfileScreen() {
  const bg = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");
  const surface = useThemeColor({}, "surface");
  const secondary = useThemeColor({}, "secondary");
  const danger = useThemeColor({}, "danger");
  const primary = useThemeColor({}, "primary");
  const border = useThemeColor({}, "icon");
  const auth = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [receipts, setReceipts] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      const d1 = await load("donations", []);
      const d2 = await load("anonDonations", []);
      if (!mounted) return;
      setDonations(
        [...(d1 || []), ...(d2 || [])].sort(
          (a, b) => (b.date || 0) - (a.date || 0),
        ),
      );
      setLoading(false);
    }
    loadData();

    (async function loadReceipts() {
      try {
        const r1 = await load("receipts", []);
        const r2 = await load("anonReceipts", []);
        if (!mounted) return;
        setReceipts(
          [...(r1 || []), ...(r2 || [])].sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime(),
          ),
        );
      } catch (e) {
        console.warn("load receipts", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const exportAll = async () => {
    try {
      await Share.share({
        message: JSON.stringify(donations, null, 2),
        title: "My Donations (export)",
      });
    } catch (e) {
      Alert.alert("Export failed", e.message || String(e));
    }
  };

  // single destructive action to clear both donations and receipts for testing

  const openPdf = async (pdfUri) => {
    if (!pdfUri)
      return Alert.alert(
        "No PDF",
        "No PDF available for this receipt. Use Save PDF on the receipt page.",
      );
    try {
      const ok = await Linking.canOpenURL(pdfUri);
      if (ok) await Linking.openURL(pdfUri);
      else Alert.alert("Open PDF", `Can't open: ${pdfUri}`);
    } catch (e) {
      console.warn("open pdf", e);
      Alert.alert("Open PDF failed", String(e));
    }
  };

  const navigation = useNavigation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("donations");

  const resetAllLocalData = () => {
    Alert.alert(
      "Reset local data",
      "Remove all local donations and receipts? This cannot be undone locally.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await remove("donations");
            await remove("anonDonations");
            await remove("receipts");
            await remove("anonReceipts");
            setDonations([]);
            setReceipts([]);
            Alert.alert(
              "Reset",
              "Local donations and receipts cleared (test only)",
            );
          },
        },
      ],
    );
  };

  const confirmResetDemoSeeds = () => {
    Alert.alert(
      "Reset demo seed data?",
      "Removes bundled demo transparency posts, sample incoming donations for prj-1…3, and demo integrity scores—then restores them fresh. Your login and personal donations/receipts stay unless you clear those separately.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset demo",
          style: "destructive",
          onPress: async () => {
            try {
              await resetDemoSeedData();
              Alert.alert(
                "Done",
                "Demo seeds refreshed. Organization Funds and demo feeds should match a clean install.",
              );
            } catch (e) {
              Alert.alert(
                "Reset failed",
                e instanceof Error ? e.message : String(e),
              );
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <FlatList
        ListHeaderComponent={
          <View style={{ padding: 16, paddingTop: 12 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                marginBottom: 8,
                color: text,
              }}
            >
              Profile
            </Text>
            <Text style={{ color: secondary, marginBottom: 12, fontSize: 14 }}>
              Manage account settings and view your activity.
            </Text>

            <View
              style={{
                padding: 12,
                backgroundColor: surface,
                borderRadius: 10,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: border,
              }}
            >
              {auth?.user ? (
                <>
                  <Text
                    style={{ color: text, fontWeight: "700", fontSize: 16 }}
                  >
                    {auth.user.name || auth.user.email}
                  </Text>
                  <Text
                    style={{ color: secondary, marginTop: 4, fontSize: 13 }}
                  >
                    {auth.user.role === USER_ROLE.ORGANIZATION
                      ? "Organization account"
                      : "Contributor account"}
                  </Text>
                  <TouchableOpacity
                    onPress={async () => {
                      await auth.signOut();
                      router.replace("/login");
                    }}
                    style={{
                      marginTop: 10,
                      backgroundColor: danger,
                      padding: 10,
                      borderRadius: 8,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      Sign out
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View>
                  <TouchableOpacity
                    onPress={() => setShowLoginModal(true)}
                    style={{
                      backgroundColor: primary,
                      padding: 12,
                      borderRadius: 8,
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      Sign in
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowRegisterModal(true)}
                    style={{
                      backgroundColor: "#34c759",
                      padding: 12,
                      borderRadius: 8,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      Create account
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Modal
              visible={showLoginModal}
              animationType="slide"
              transparent={false}
            >
              <SafeAreaView
                style={{ flex: 1, padding: 16, backgroundColor: bg }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{ fontSize: 20, fontWeight: "700", color: text }}
                  >
                    Sign In
                  </Text>
                  <TouchableOpacity onPress={() => setShowLoginModal(false)}>
                    <Text style={{ fontSize: 16, color: primary }}>Close</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  placeholder="Email"
                  placeholderTextColor={secondary || "#999"}
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  style={{
                    borderWidth: 1,
                    borderColor: "#ddd",
                    padding: 12,
                    marginBottom: 12,
                    borderRadius: 8,
                    color: text,
                    backgroundColor: surface,
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor={secondary || "#999"}
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  style={{
                    borderWidth: 1,
                    borderColor: "#ddd",
                    padding: 12,
                    marginBottom: 12,
                    borderRadius: 8,
                    color: text,
                    backgroundColor: surface,
                  }}
                  secureTextEntry
                />
                <TouchableOpacity
                  onPress={async () => {
                    if (!loginEmail || !loginPassword)
                      return Alert.alert(
                        "Error",
                        "Email and password required",
                      );
                    try {
                      setAuthLoading(true);
                      await auth.signIn(loginEmail, loginPassword);
                      setShowLoginModal(false);
                      setLoginEmail("");
                      setLoginPassword("");
                      Alert.alert("Success", "Signed in!");
                    } catch (e) {
                      Alert.alert("Login failed", e.message || String(e));
                    } finally {
                      setAuthLoading(false);
                    }
                  }}
                  disabled={authLoading}
                  style={{
                    backgroundColor: primary,
                    padding: 14,
                    borderRadius: 8,
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    {authLoading ? "Signing in..." : "Sign In"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowLoginModal(false);
                    setShowRegisterModal(true);
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      color: primary,
                      marginTop: 10,
                    }}
                  >
                    Don't have an account? Create one
                  </Text>
                </TouchableOpacity>
              </SafeAreaView>
            </Modal>

            <Modal
              visible={showRegisterModal}
              animationType="slide"
              transparent={false}
            >
              <SafeAreaView
                style={{ flex: 1, padding: 16, backgroundColor: bg }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{ fontSize: 20, fontWeight: "700", color: text }}
                  >
                    Create Account
                  </Text>
                  <TouchableOpacity onPress={() => setShowRegisterModal(false)}>
                    <Text style={{ fontSize: 16, color: primary }}>Close</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  placeholder="Name"
                  placeholderTextColor={secondary || "#999"}
                  value={registerName}
                  onChangeText={setRegisterName}
                  style={{
                    borderWidth: 1,
                    borderColor: "#ddd",
                    padding: 12,
                    marginBottom: 12,
                    borderRadius: 8,
                    color: text,
                    backgroundColor: surface,
                  }}
                />
                <TextInput
                  placeholder="Email"
                  placeholderTextColor={secondary || "#999"}
                  value={registerEmail}
                  onChangeText={setRegisterEmail}
                  style={{
                    borderWidth: 1,
                    borderColor: "#ddd",
                    padding: 12,
                    marginBottom: 12,
                    borderRadius: 8,
                    color: text,
                    backgroundColor: surface,
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TextInput
                  placeholder="Password (min 10 characters)"
                  placeholderTextColor={secondary || "#999"}
                  value={registerPassword}
                  onChangeText={setRegisterPassword}
                  style={{
                    borderWidth: 1,
                    borderColor: "#ddd",
                    padding: 12,
                    marginBottom: 12,
                    borderRadius: 8,
                    color: text,
                    backgroundColor: surface,
                  }}
                  secureTextEntry
                />
                <TouchableOpacity
                  onPress={async () => {
                    if (!registerEmail || !registerPassword)
                      return Alert.alert(
                        "Error",
                        "Email and password required",
                      );
                    if (registerPassword.length < 10)
                      return Alert.alert(
                        "Error",
                        "Password must be at least 10 characters",
                      );
                    try {
                      setAuthLoading(true);
                      await auth.signUp({
                        email: registerEmail,
                        password: registerPassword,
                        name: registerName || registerEmail,
                        role: "contributor",
                      });
                      setShowRegisterModal(false);
                      setRegisterEmail("");
                      setRegisterPassword("");
                      setRegisterName("");
                      Alert.alert("Success", "Account created!");
                    } catch (e) {
                      Alert.alert(
                        "Registration failed",
                        e.message || String(e),
                      );
                    } finally {
                      setAuthLoading(false);
                    }
                  }}
                  disabled={authLoading}
                  style={{
                    backgroundColor: "#34c759",
                    padding: 14,
                    borderRadius: 8,
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    {authLoading ? "Creating..." : "Create Account"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowRegisterModal(false);
                    setShowLoginModal(true);
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      color: primary,
                      marginTop: 10,
                    }}
                  >
                    Already have an account? Sign in
                  </Text>
                </TouchableOpacity>
              </SafeAreaView>
            </Modal>

            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              <TouchableOpacity
                onPress={exportAll}
                style={{
                  flex: 1,
                  minWidth: 120,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  backgroundColor: surface,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: border,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: text,
                    fontWeight: "700",
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  📥 Export
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={resetAllLocalData}
                style={{
                  flex: 1,
                  minWidth: 120,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  backgroundColor: "#cc0000",
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "700",
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  🗑 Clear
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={confirmResetDemoSeeds}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 14,
                backgroundColor: "#c2410c",
                borderRadius: 8,
                marginBottom: 14,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "800",
                  textAlign: "center",
                }}
              >
                Reset demo seed data (rehearsal)
              </Text>
              <Text
                style={{
                  color: "#ffedd5",
                  fontSize: 11,
                  marginTop: 4,
                  textAlign: "center",
                }}
              >
                Restores bundled feeds, incoming totals & demo ratings — keeps
                your account
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => setActiveTab("donations")}
                style={{
                  padding: 10,
                  backgroundColor:
                    activeTab === "donations" ? "#2980b9" : "#f1f1f1",
                  borderRadius: 8,
                  marginRight: 8,
                  minWidth: 120,
                }}
              >
                <Text
                  style={{
                    color: activeTab === "donations" ? "#fff" : text,
                    fontWeight: "700",
                  }}
                >
                  Donations ({donations.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab("receipts")}
                style={{
                  padding: 10,
                  backgroundColor:
                    activeTab === "receipts" ? "#2980b9" : "#f1f1f1",
                  borderRadius: 8,
                  minWidth: 120,
                }}
              >
                <Text
                  style={{
                    color: activeTab === "receipts" ? "#fff" : text,
                    fontWeight: "700",
                  }}
                >
                  Receipts ({receipts.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        data={activeTab === "donations" ? donations : receipts}
        keyExtractor={(item, i) =>
          activeTab === "donations"
            ? item.id?.toString() || String(i)
            : item.id?.toString() || String(i)
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 160 }}
        ListEmptyComponent={
          <Text
            style={{ color: secondary, textAlign: "center", marginTop: 20 }}
          >
            {activeTab === "donations"
              ? "No donations recorded yet. Make a donation to see receipts here."
              : "No receipts available. Completed donations will create receipts."}
          </Text>
        }
        renderItem={({ item }) =>
          activeTab === "donations" ? (
            <View
              style={{
                padding: 12,
                backgroundColor: surface,
                borderRadius: 8,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: border,
              }}
            >
              <Text style={{ fontWeight: "700", color: text }}>
                {item.cause || item.title || "Donation"}
              </Text>
              <Text style={{ color: secondary, marginTop: 4 }}>
                {new Date(item.date || Date.now()).toLocaleString()}
              </Text>
              <Text style={{ marginTop: 6, color: text }}>
                Amount: ${item.amount || item.total || 0}
              </Text>
              {item.receiptId && (
                <Text style={{ fontSize: 12, color: primary, marginTop: 6 }}>
                  Receipt: {item.receiptId}
                </Text>
              )}
              <View style={{ flexDirection: "row", marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() =>
                    Share.share({
                      message: JSON.stringify(item, null, 2),
                      title: "Donation Receipt",
                    })
                  }
                  style={{
                    padding: 8,
                    backgroundColor: surface,
                    borderRadius: 6,
                    marginRight: 8,
                    borderWidth: 1,
                    borderColor: border,
                  }}
                >
                  <Text style={{ color: text }}>Export JSON</Text>
                </TouchableOpacity>
                {item.receiptId ? (
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("Receipt", { id: item.receiptId })
                    }
                    style={{
                      padding: 8,
                      backgroundColor: primary,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: "#fff" }}>View Receipt</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ) : (
            <View
              style={{
                padding: 12,
                backgroundColor: surface,
                borderRadius: 8,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: border,
              }}
            >
              <Text style={{ fontWeight: "700", color: text }}>
                Receipt {item.id}
              </Text>
              <Text style={{ color: secondary, marginTop: 4 }}>
                {new Date(item.createdAt || Date.now()).toLocaleString()}
              </Text>
              <Text style={{ marginTop: 6, color: text }}>
                Amount: ${item.amount}
              </Text>
              <View style={{ flexDirection: "row", marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("Receipt", { id: item.id })
                  }
                  style={{
                    padding: 8,
                    backgroundColor: "#2980b9",
                    borderRadius: 6,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: "#fff" }}>Open</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openPdf(item.pdfUri)}
                  style={{
                    padding: 8,
                    backgroundColor: surface,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: border,
                  }}
                >
                  <Text style={{ color: text }}>Open PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
