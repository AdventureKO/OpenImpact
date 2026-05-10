import { AuthContext } from "@/context/AuthContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import * as storage from "@/utils/storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useContext, useState } from "react";
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

interface CauseCollection {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  causeIds: string[];
  createdAt: string;
}

const PRESET_COLLECTIONS = [
  { name: "Climate Action", emoji: "🌍", color: "#10b981" },
  { name: "Global Health", emoji: "🏥", color: "#ef4444" },
  { name: "Education", emoji: "📚", color: "#3b82f6" },
  { name: "Food Security", emoji: "🍎", color: "#f59e0b" },
  { name: "Housing", emoji: "🏠", color: "#8b5cf6" },
  { name: "Emergency Relief", emoji: "🆘", color: "#ec4899" },
  { name: "Water & Sanitation", emoji: "💧", color: "#06b6d4" },
  { name: "Wildlife", emoji: "🦁", color: "#14b8a6" },
];

export default function CauseCollectionsScreen() {
  const navigation = useNavigation();
  const auth = useContext(AuthContext);
  const bg = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");

  const [collections, setCollections] = useState<CauseCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<
    (typeof PRESET_COLLECTIONS)[0] | null
  >(null);
  const [collectionName, setCollectionName] = useState("");
  const [collectionEmoji, setCollectionEmoji] = useState("📌");
  const [collectionColor, setCollectionColor] = useState("#3b82f6");

  const colors = [
    "#3b82f6",
    "#10b981",
    "#ef4444",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#14b8a6",
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!auth?.user) {
        setCollections([]);
        setLoading(false);
        return;
      }

      const saved =
        (await storage.loadForUser(auth.user, "causeCollections", [])) || [];
      setCollections(saved);
    } catch (e) {
      console.warn("collections load failed", e);
    } finally {
      setLoading(false);
    }
  }, [auth?.user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const createCollection = async () => {
    const name = selectedPreset?.name || collectionName;
    const emoji = selectedPreset?.emoji || collectionEmoji;
    const color = selectedPreset?.color || collectionColor;

    if (!name) {
      Alert.alert("Error", "Please enter a collection name");
      return;
    }

    const collection: CauseCollection = {
      id: `col-${Date.now()}`,
      name,
      description: "",
      emoji,
      color,
      causeIds: [],
      createdAt: new Date().toISOString(),
    };

    try {
      const updated = [...collections, collection];
      await storage.saveForUser(auth.user, "causeCollections", updated);
      setCollections(updated);
      setShowModal(false);
      setSelectedPreset(null);
      setCollectionName("");
      setCollectionEmoji("📌");
      setCollectionColor("#3b82f6");
      Alert.alert("Success", `Collection "${name}" created!`);
    } catch (e) {
      Alert.alert("Error", "Failed to create collection");
    }
  };

  const deleteCollection = async (collectionId: string) => {
    try {
      const updated = collections.filter((c) => c.id !== collectionId);
      await storage.saveForUser(auth.user, "causeCollections", updated);
      setCollections(updated);
    } catch (e) {
      Alert.alert("Error", "Failed to delete collection");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: 16 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginBottom: 16 }}
          >
            <Text style={{ color: "#2563eb", fontWeight: "600" }}>← Back</Text>
          </TouchableOpacity>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <View>
              <Text style={[styles.title, { color: text }]}>Collections</Text>
              <Text style={{ color: "#666", fontSize: 13, marginTop: 4 }}>
                Organize causes by theme
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowModal(true)}
              style={{
                backgroundColor: "#3b82f6",
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>
                + New
              </Text>
            </TouchableOpacity>
          </View>

          {collections.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📚</Text>
              <Text style={[styles.emptyText, { color: text }]}>
                No collections yet
              </Text>
              <Text style={styles.emptySubtext}>
                Create collections to organize causes by theme
              </Text>
            </View>
          ) : (
            <View>
              {collections.map((collection) => (
                <TouchableOpacity
                  key={collection.id}
                  style={[
                    styles.collectionCard,
                    {
                      backgroundColor: collection.color + "15",
                      borderColor: collection.color,
                    },
                  ]}
                  onPress={() => {
                    // Navigate to collection detail
                    // For now, show alert
                    Alert.alert(
                      collection.name,
                      `${collection.causeIds.length} causes\n\nSwipe to delete or tap to edit`,
                      [
                        {
                          text: "Delete",
                          onPress: () => deleteCollection(collection.id),
                          style: "destructive",
                        },
                        { text: "Cancel", style: "cancel" },
                      ],
                    );
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      <Text style={styles.collectionEmoji}>
                        {collection.emoji}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.collectionName, { color: text }]}>
                          {collection.name}
                        </Text>
                        <Text style={styles.collectionMeta}>
                          {collection.causeIds.length} cause
                          {collection.causeIds.length !== 1 ? "s" : ""}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 20 }}>→</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>

      {/* Modal for creating collection */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: bg }]}>
            <Text style={[styles.modalTitle, { color: text }]}>
              Create Collection
            </Text>

            {/* Preset Collections */}
            <Text style={[styles.inputLabel, { color: text }]}>
              Popular Collections
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 16 }}
            >
              {PRESET_COLLECTIONS.map((preset, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setSelectedPreset(preset);
                    setCollectionName(preset.name);
                    setCollectionEmoji(preset.emoji);
                    setCollectionColor(preset.color);
                  }}
                  style={[
                    styles.presetCard,
                    selectedPreset?.name === preset.name && {
                      borderColor: preset.color,
                      borderWidth: 3,
                    },
                  ]}
                >
                  <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                  <Text style={styles.presetName}>{preset.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Or Custom */}
            <Text style={[styles.inputLabel, { color: text, marginTop: 16 }]}>
              Or Create Custom
            </Text>

            <Text style={[styles.inputLabel, { color: text }]}>
              Collection Name
            </Text>
            <TextInput
              placeholder="e.g., 'My Top Priorities'"
              placeholderTextColor="#999"
              value={collectionName}
              onChangeText={setCollectionName}
              style={[styles.input, { color: text }]}
            />

            <Text style={[styles.inputLabel, { color: text }]}>Emoji</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 12 }}
            >
              {["📌", "🌍", "🏥", "📚", "🍎", "🏠", "⭐", "💝", "🎯", "🔥"].map(
                (emoji, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setCollectionEmoji(emoji)}
                    style={[
                      styles.emojiChip,
                      collectionEmoji === emoji && {
                        backgroundColor: "#dbeafe",
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 20 }}>{emoji}</Text>
                  </TouchableOpacity>
                ),
              )}
            </ScrollView>

            <Text style={[styles.inputLabel, { color: text }]}>Color</Text>
            <View style={styles.colorGrid}>
              {colors.map((color, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setCollectionColor(color)}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    collectionColor === color && styles.colorOptionSelected,
                  ]}
                >
                  {collectionColor === color && (
                    <Text style={{ fontSize: 16 }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowModal(false);
                  setSelectedPreset(null);
                  setCollectionName("");
                }}
                style={[
                  styles.modalButton,
                  { backgroundColor: "#e5e7eb", flex: 1 },
                ]}
              >
                <Text style={{ color: "#374151", fontWeight: "700" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={createCollection}
                style={[
                  styles.modalButton,
                  { backgroundColor: "#3b82f6", flex: 1 },
                ]}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 26, fontWeight: "800" },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: "#999" },
  collectionCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
  },
  collectionEmoji: { fontSize: 24, marginRight: 10 },
  collectionName: { fontSize: 15, fontWeight: "700" },
  collectionMeta: { fontSize: 11, color: "#999", marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: { borderRadius: 16, padding: 20, width: "100%" },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  presetCard: {
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    padding: 12,
    marginRight: 8,
    alignItems: "center",
    minWidth: 90,
    borderWidth: 2,
    borderColor: "transparent",
  },
  presetEmoji: { fontSize: 24, marginBottom: 4 },
  presetName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
  },
  emojiChip: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    minWidth: 50,
    alignItems: "center",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  colorOption: {
    width: "18%",
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  colorOptionSelected: { borderWidth: 3, borderColor: "#000" },
  modalButton: { paddingVertical: 12, borderRadius: 8, alignItems: "center" },
});
