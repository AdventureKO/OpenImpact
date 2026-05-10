import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { ALLOCATION_TAGS } from "../constants/allocationTags";
import { AuthContext } from "../context/AuthContext";
import { useThemeColor } from "../hooks/use-theme-color";
import * as storage from "../utils/storage";

export default function FormComponent({
  onSaved,
  onRequireAuth,
  initialproject = null,
} = {}) {
  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [catPickerVisible, setCatPickerVisible] = useState(false);
  const [catPickerIndex, setCatPickerIndex] = useState(null);
  const [method, setMethod] = useState("");
  const [lastImage, setLastImage] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  const bg = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");
  const primary = useThemeColor({}, "primary");
  const secondary = useThemeColor({}, "secondary");
  const danger = useThemeColor({}, "danger");
  const success = useThemeColor({}, "success");
  const auth = useContext(AuthContext);

  useEffect(() => {
    (async () => {
      const uri = await storage.load("lastPickedFundraiserImage", null);
      if (uri) setLastImage(uri);
      if (initialproject) {
        setEditing(true);
        setName(initialproject.name || "");
        setTags((initialproject.tags || []).join(", "));
        setAllocations(initialproject.allocations || []);
        setIngredients(
          (initialproject.ingredients || []).map((i) => ({
            name: i.name || "",
            amount: i.amount || "",
            unit: i.unit || "",
            category: i.category || "Uncategorized",
            type: i.type || "dry",
          })),
        );
        setMethod(initialproject.method || "");
        setLastImage(initialproject.image || null);
      }
    })();
  }, []);

  const isLocked = !!(initialproject && initialproject.published);

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted)
        return Alert.alert(
          "Permission",
          "Permission to access photos is required",
        );
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (!result) return;
      const canceled = result.cancelled || result.canceled;
      if (canceled) return;
      const uri = result.assets ? result.assets[0].uri : result.uri;
      if (uri) {
        setLastImage(uri);
        await storage.save("lastPickedFundraiserImage", uri);
      }
    } catch (err) {
      console.warn("Image pick error", err);
    }
  };

  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted)
        return Alert.alert(
          "Permission",
          "Permission to access camera is required",
        );
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (!result) return;
      const canceled = result.cancelled || result.canceled;
      if (canceled) return;
      const uri = result.assets ? result.assets[0].uri : result.uri;
      if (uri) {
        setLastImage(uri);
        await storage.save("lastPickedFundraiserImage", uri);
      }
    } catch (err) {
      console.warn("take photo error", err);
    }
  };

  const removeImage = async () => {
    setLastImage(null);
    await storage.remove("lastPickedFundraiserImage");
  };

  const CATEGORY_OPTIONS = [
    "Fresh Produce",
    "Dairy and Eggs",
    "Meat and Seafood",
    "Pasta, Rice & Grains",
    "Soups and Cans",
    "Oils and Condiments",
    "Bakery",
    "Frozen",
    "Beverages",
    "Spices & Seasonings",
    "Uncategorized",
  ];

  const addIngredient = () => {
    setIngredients((s) => [
      ...(s || []),
      {
        name: "",
        amount: "",
        unit: "",
        category: "Uncategorized",
        type: "dry",
      },
    ]);
  };

  const updateIngredient = (index, field, value) => {
    setIngredients((s) => {
      const next = (s || []).slice();
      if (!next[index]) return next;
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeIngredientAt = (index) => {
    setIngredients((s) => (s || []).filter((_, i) => i !== index));
  };

  const openCategoryPicker = (index) => {
    setCatPickerIndex(index);
    setCatPickerVisible(true);
  };

  const selectCategory = (cat) => {
    if (Number.isInteger(catPickerIndex))
      updateIngredient(catPickerIndex, "category", cat);
    setCatPickerVisible(false);
    setCatPickerIndex(null);
  };

  const submit = async () => {
    if (!name.trim())
      return Alert.alert("Validation", "Please enter a cause name");

    // require authentication to save (if an AuthContext exists)
    if (!auth || !auth.user) {
      return Alert.alert(
        "Sign in required",
        "You must sign in to save causes",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign in",
            onPress: () => {
              if (typeof onRequireAuth === "function") {
                onRequireAuth();
              } else {
                router.push("/login");
              }
            },
          },
        ],
      );
    }
    // use structured ingredients array
    const ingredientsClean = (ingredients || [])
      .map((it) => ({
        name: (it.name || "").trim(),
        amount: it.amount || "",
        unit: it.unit || "",
        category: it.category || "Uncategorized",
        type: it.type || "dry",
      }))
      .filter((i) => (i.name || "").trim());

    if (editing && initialproject) {
      // update existing project
      const existing =
        (await storage.loadForUser(
          auth && auth.user ? auth.user : null,
          "myFundraisers",
          [],
        )) || [];
      const updated = {
        ...initialproject,
        name: name.trim(),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        allocations: allocations || [],
        ingredients: ingredientsClean,
        method,
        image: lastImage || null,
      };
      const nextStored = (existing || []).map((r) =>
        r.id === initialproject.id ? updated : r,
      );
      await storage.saveForUser(
        auth && auth.user ? auth.user : null,
        "myFundraisers",
        nextStored,
      );
      Alert.alert("Saved", "Cause updated");
      if (typeof onSaved === "function") {
        try {
          onSaved();
        } catch (err) {
          console.warn("onSaved callback error", err);
        }
      }
      return;
    }

    // create new project
    const newproject = {
      id: `local-${Date.now()}`,
      name: name.trim(),
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      allocations: allocations || [],
      ingredients: ingredientsClean,
      method,
      writer: "You",
      image: lastImage || null,
    };

    const existing = await storage.loadForUser(
      auth && auth.user ? auth.user : null,
      "myFundraisers",
      [],
    );
    // prevent duplicates by trimmed lowercase name
    const nameKey = (newproject.name || "").trim().toLowerCase();
    if (
      (existing || []).some(
        (r) => (r.name || "").trim().toLowerCase() === nameKey,
      )
    ) {
      Alert.alert(
        "Saved",
        "A cause with this name already exists in My Causes",
      );
      router.push("/my-fundraisers");
      return;
    }
    const next = [newproject, ...(existing || [])];
    // ensure uniqueness
    const uniq = [];
    const seen = new Set();
    for (const r of next) {
      const k = (r.name || "").trim().toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        uniq.push(r);
      }
    }
    await storage.saveForUser(
      auth && auth.user ? auth.user : null,
      "myFundraisers",
      uniq,
    );
    Alert.alert("Saved", "Cause saved locally");
    if (typeof onSaved === "function") {
      try {
        onSaved();
      } catch (err) {
        console.warn("onSaved callback error", err);
      }
    } else {
      router.push("/my-fundraisers");
    }
  };

  const handlePublish = async () => {
    if (!name.trim())
      return Alert.alert("Validation", "Please enter a cause name");
    if (!auth || !auth.user) {
      return Alert.alert(
        "Sign in required",
        "You must sign in to publish. Would you like to sign in now?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign in",
            onPress: () => {
              if (typeof onRequireAuth === "function") {
                onRequireAuth();
              } else {
                router.push("/login");
              }
            },
          },
        ],
      );
    }

    Alert.alert(
      "Publish Cause",
      "Publishing will make this cause public and lock it from editing. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Publish",
          style: "destructive",
          onPress: async () => {
            // build ingredients from structured inputs when present, otherwise parse free-text
            const publishedIngredients =
              ingredients && (ingredients || []).length
                ? (ingredients || [])
                    .map((it) => ({
                      name: (it.name || "").trim(),
                      amount: it.amount || "",
                      unit: it.unit || "",
                      category: it.category || "Uncategorized",
                      type: it.type || "dry",
                    }))
                    .filter((i) => (i.name || "").trim())
                : (ingredientsText || "")
                    .split("\n")
                    .map((line) => {
                      const trimmed = (line || "").trim();
                      if (!trimmed) return null;
                      const m = trimmed.match(/^([\d\/\.]+)\s*(\S+)?\s*(.*)$/);
                      if (m) {
                        return {
                          amount: m[1] || "",
                          unit: m[2] || "",
                          name: (m[3] || "").trim() || (m[2] ? m[2] : trimmed),
                          type: "dry",
                        };
                      }
                      return {
                        name: trimmed,
                        amount: "",
                        unit: "",
                        type: "dry",
                      };
                    })
                    .filter(Boolean);

            if (editing && initialproject) {
              // update existing project to published
              const updated = {
                ...initialproject,
                name: name.trim(),
                tags: tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
                ingredients: publishedIngredients,
                method,
                published: true,
                publishedAt: new Date().toISOString(),
                image: lastImage || null,
              };
              const stored =
                (await storage.loadForUser(
                  auth && auth.user ? auth.user : null,
                  "myFundraisers",
                  [],
                )) || [];
              const nextStored = (stored || []).map((r) =>
                r.id === initialproject.id ? updated : r,
              );
              await storage.saveForUser(
                auth && auth.user ? auth.user : null,
                "myFundraisers",
                nextStored,
              );
              // sync updated published fundraiser into global publicFundraisers list
              try {
                const globalPub = await storage.load("publicFundraisers", []);
                const byId = (globalPub || []).reduce((acc, r) => {
                  acc[String(r.id)] = r;
                  return acc;
                }, {});
                byId[String(updated.id)] = updated;
                const merged = Object.values(byId).sort((a, b) =>
                  (b.publishedAt || "") > (a.publishedAt || "") ? 1 : -1,
                );
                await storage.save("publicFundraisers", merged);
              } catch (err) {
                console.warn(
                  "publish:update - failed to sync publicFundraisers",
                  err,
                );
              }
              Alert.alert("Published!", "Your cause is now public");
              if (typeof onSaved === "function") {
                try {
                  onSaved();
                } catch (err) {
                  console.warn("onSaved callback error", err);
                }
              }
              return router.push("/");
            }

            // create published project (not editing)
            const published = {
              id: `local-${Date.now()}`,
              name: name.trim(),
              tags: tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
              allocations: allocations || [],
              ingredients: publishedIngredients,
              method,
              writer: "You",
              published: true,
              publishedAt: new Date().toISOString(),
              image: lastImage || null,
            };

            const existing = await storage.loadForUser(
              auth && auth.user ? auth.user : null,
              "myFundraisers",
              [],
            );
            const next = [published, ...(existing || [])];
            // uniqueness by name
            const uniq = [];
            const seen = new Set();
            for (const r of next) {
              const k = (r.name || "").trim().toLowerCase();
              if (!seen.has(k)) {
                seen.add(k);
                uniq.push(r);
              }
            }
            await storage.saveForUser(
              auth && auth.user ? auth.user : null,
              "myFundraisers",
              uniq,
            );
            // also publish to global publicFundraisers so all users see it
            try {
              const globalPub = await storage.load("publicFundraisers", []);
              const nextGlobal = [published, ...(globalPub || [])];
              // dedupe by id (keep first occurrence)
              const seenLocal = new Set();
              const uniqGlobal = [];
              for (const r of nextGlobal) {
                const k = String(r.id);
                if (!seenLocal.has(k)) {
                  seenLocal.add(k);
                  uniqGlobal.push(r);
                }
              }
              const ok = await storage.save("publicFundraisers", uniqGlobal);
              console.log(
                "publish: saved to publicFundraisers ok=",
                ok,
                "count=",
                (uniqGlobal || []).length,
              );
              try {
                Alert.alert(
                  "Shared to public",
                  `Public causes count: ${(uniqGlobal || []).length}`,
                );
              } catch (e) {
                /* ignore */
              }
            } catch (err) {
              console.warn("publish: failed to save to publicFundraisers", err);
            }
            Alert.alert("Published!", "Your cause is now public");
            try {
              if (typeof onSaved === "function") onSaved();
            } catch (err) {
              console.warn("onSaved callback error", err);
            }
            router.push("/");
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={[styles.wrap, { backgroundColor: bg }]}
      contentContainerStyle={{ padding: 12 }}
    >
      <TextInput
        placeholder="Cause name"
        placeholderTextColor={text}
        value={name}
        onChangeText={setName}
        editable={!isLocked}
        style={[styles.input, { color: text, opacity: isLocked ? 0.6 : 1 }]}
      />
      <TextInput
        placeholder="Tags (comma separated)"
        placeholderTextColor={text}
        value={tags}
        onChangeText={setTags}
        editable={!isLocked}
        style={[styles.input, { color: text, opacity: isLocked ? 0.6 : 1 }]}
      />
      <View style={{ marginBottom: 8 }}>
        <View>
          {lastImage ? (
            <Image
              source={{ uri: lastImage }}
              style={{
                width: 160,
                height: 100,
                borderRadius: 8,
                marginBottom: 8,
              }}
            />
          ) : (
            <View
              style={{
                width: 160,
                height: 100,
                borderRadius: 8,
                marginBottom: 8,
                backgroundColor: "#ffffff",
              }}
            />
          )}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={pickImage}
              disabled={isLocked}
              style={[
                styles.pbtn,
                {
                  backgroundColor: primary,
                  marginRight: 8,
                  opacity: isLocked ? 0.5 : 1,
                },
              ]}
            >
              <Text style={styles.pbtnText}>Change Image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={takePhoto}
              disabled={isLocked}
              style={[
                styles.pbtn,
                {
                  backgroundColor: secondary,
                  marginRight: 8,
                  opacity: isLocked ? 0.5 : 1,
                },
              ]}
            >
              <Text style={styles.pbtnText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={removeImage}
              disabled={isLocked}
              style={[
                styles.pbtn,
                {
                  backgroundColor: danger,
                  marginRight: 8,
                  opacity: isLocked ? 0.5 : 1,
                },
              ]}
            >
              <Text style={styles.pbtnText}>
                {lastImage ? "Remove" : "Detach"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Allocation plan: allow organization to set planned amounts per category */}
      <View style={{ marginBottom: 8 }}>
        <Text style={{ color: text, fontWeight: "700", marginBottom: 8 }}>
          Allocation plan (optional)
        </Text>
        {(allocations || []).map((a, idx) => (
          <View
            key={`alloc-${idx}`}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <View
              style={{
                padding: 8,
                backgroundColor: "#f1f5f9",
                borderRadius: 8,
                marginRight: 8,
              }}
            >
              <Text style={{ fontWeight: "700" }}>{a.tag}</Text>
            </View>
            <TextInput
              placeholder="Planned amount (USD)"
              value={String(a.planned || "")}
              onChangeText={(v) => {
                const num = parseFloat(v) || 0;
                setAllocations((prev) => {
                  const next = (prev || []).slice();
                  next[idx] = { ...next[idx], planned: num };
                  return next;
                });
              }}
              keyboardType="numeric"
              style={[styles.ingredientInputSmall, { marginRight: 8 }]}
            />
            <TouchableOpacity
              onPress={() =>
                setAllocations((prev) =>
                  (prev || []).filter((_, i) => i !== idx),
                )
              }
              style={{ padding: 8 }}
            >
              <Text style={{ color: "crimson" }}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
          >
            {ALLOCATION_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                onPress={() =>
                  setAllocations((prev) => [
                    ...(prev || []),
                    { tag, planned: 0, spent: 0 },
                  ])
                }
                style={{
                  padding: 8,
                  backgroundColor: "#eef2ff",
                  borderRadius: 8,
                  marginRight: 8,
                }}
              >
                <Text style={{ fontWeight: "700" }}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Ingredients editor: structured rows with amount, unit, name, category */}
      <View style={{ marginBottom: 8 }}>
        <Text style={{ color: text, fontWeight: "700", marginBottom: 8 }}>
          Details
        </Text>
        {(ingredients || []).map((ing, idx) => (
          <View
            key={`ing-${idx}`}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <TextInput
              placeholder="Item"
              placeholderTextColor={text}
              value={ing.name || ""}
              onChangeText={(v) => updateIngredient(idx, "name", v)}
              editable={!isLocked}
              style={[
                styles.ingredientInput,
                { color: text, opacity: isLocked ? 0.6 : 1 },
              ]}
            />
            <TextInput
              placeholder="Amt"
              placeholderTextColor={text}
              value={String(ing.amount || "")}
              onChangeText={(v) => updateIngredient(idx, "amount", v)}
              editable={!isLocked}
              style={[
                styles.ingredientInputSmall,
                { color: text, marginLeft: 8, opacity: isLocked ? 0.6 : 1 },
              ]}
            />
            <TextInput
              placeholder="Unit"
              placeholderTextColor={text}
              value={ing.unit || ""}
              onChangeText={(v) => updateIngredient(idx, "unit", v)}
              editable={!isLocked}
              style={[
                styles.ingredientInputSmall,
                { color: text, marginLeft: 8, opacity: isLocked ? 0.6 : 1 },
              ]}
            />
            <TouchableOpacity
              onPress={() => openCategoryPicker(idx)}
              disabled={isLocked}
              style={[
                styles.catButton,
                { marginLeft: 8, opacity: isLocked ? 0.6 : 1 },
              ]}
            >
              <Text style={{ color: "#fff" }}>
                {ing.category || "Category"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => removeIngredientAt(idx)}
              disabled={isLocked}
              style={{ marginLeft: 8, opacity: isLocked ? 0.6 : 1 }}
            >
              <Text style={{ color: "crimson" }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          onPress={addIngredient}
          disabled={isLocked}
          style={[
            styles.btn,
            {
              marginTop: 8,
              alignSelf: "flex-start",
              opacity: isLocked ? 0.6 : 1,
            },
          ]}
        >
          <Text style={[styles.btnText]}>+ Add Item</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        placeholder="Updates / Description"
        placeholderTextColor={text}
        value={method}
        onChangeText={setMethod}
        editable={!isLocked}
        style={[styles.textarea, { color: text, opacity: isLocked ? 0.6 : 1 }]}
        multiline
      />
      <View style={{ height: 12 }} />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {!isLocked ? (
          <>
            <TouchableOpacity
              onPress={submit}
              style={[
                styles.saveBtn,
                { flex: 1, marginRight: 8, backgroundColor: primary },
              ]}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                Save Cause
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePublish}
              style={[styles.saveBtn, { flex: 1, backgroundColor: success }]}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                Publish Cause
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View
            style={[styles.saveBtn, { flex: 1, backgroundColor: "#95a5a6" }]}
          >
            <Text
              style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}
            >
              View Only (Published)
            </Text>
          </View>
        )}
      </View>
      {/* Category picker modal */}
      <Modal visible={catPickerVisible} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <View
            style={{
              backgroundColor: bg,
              borderRadius: 8,
              padding: 12,
              maxHeight: "70%",
            }}
          >
            <Text style={{ fontWeight: "700", marginBottom: 8, color: text }}>
              Select Category
            </Text>
            <ScrollView>
              {CATEGORY_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => selectCategory(c)}
                  style={{ paddingVertical: 8 }}
                >
                  <Text style={{ color: text }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginTop: 8,
              }}
            >
              <TouchableOpacity
                onPress={() => setCatPickerVisible(false)}
                style={[styles.btn, { backgroundColor: "#95a5a6" }]}
              >
                <Text style={styles.btnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  ingredientInput: {
    borderWidth: 1,
    borderColor: "#888",
    padding: 8,
    borderRadius: 8,
    flex: 1,
  },
  ingredientInputSmall: {
    borderWidth: 1,
    borderColor: "#888",
    padding: 8,
    borderRadius: 8,
    width: 64,
  },
  catButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#34495e",
    borderRadius: 6,
  },
  btn: {
    padding: 8,
    backgroundColor: "#2ecc71",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#888",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  textarea: {
    borderWidth: 1,
    borderColor: "#888",
    padding: 8,
    borderRadius: 8,
    height: 120,
    textAlignVertical: "top",
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  saveBtn: {
    padding: 12,
    backgroundColor: "#2ecc71",
    borderRadius: 8,
    alignItems: "center",
  },
  pbtn: { padding: 8, borderRadius: 8, marginRight: 8, alignItems: "center" },
  pbtnText: { color: "#fff", fontWeight: "700" },
});
