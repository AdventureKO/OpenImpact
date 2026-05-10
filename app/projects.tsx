import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import MOCK_SERVER_URL from "../constants/api";
import seedData from "../data/seedFundraisers.json";
import { useThemeColor } from "../hooks/use-theme-color";

export default function ProjectsScreen() {
  const [fundraisers, setFundraisers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const bg = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");
  const surface = useThemeColor({}, "surface");
  const secondary = useThemeColor({}, "secondary");
  const navigation = useNavigation();

  useEffect(() => {
    setLoading(true);
    fetch(`${MOCK_SERVER_URL}/api/fundraisers`)
      .then((r) => r.json())
      .then(setFundraisers)
      .catch(() => {
        try {
          setFundraisers(seedData.fundraisers || []);
        } catch (e) {
          setFundraisers([]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (fundraisers || []).forEach((f) => {
      const k = f.organizer || f.writer || "Uncategorized";
      set.add(String(k));
    });
    return Array.from(set).slice(0, 12);
  }, [fundraisers]);

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );

  const results = (fundraisers || []).filter((f) => {
    if (!query) return true;
    const q = String(query || "")
      .toLowerCase()
      .trim();
    return (
      String(f.name || "")
        .toLowerCase()
        .includes(q) ||
      String(f.organizer || f.writer || "")
        .toLowerCase()
        .includes(q) ||
      String(f.id || "")
        .toLowerCase()
        .includes(q)
    );
  });

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: bg,
        padding: 16,
        paddingTop: 12,
        paddingBottom: 160,
      }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          marginBottom: 8,
          color: text,
        }}
      >
        Browse Causes
      </Text>
      <Text style={{ color: text, marginBottom: 12, fontSize: 14 }}>
        Search and discover projects to support.
      </Text>

      <View style={{ marginBottom: 16 }}>
        <TextInput
          placeholder="Search causes or organizers"
          value={query}
          onChangeText={setQuery}
          style={{
            borderWidth: 1,
            borderColor: "#e0e0e0",
            padding: 10,
            borderRadius: 8,
            backgroundColor: surface || bg,
            color: text,
          }}
          placeholderTextColor={secondary || "#999"}
        />
      </View>

      <Text style={{ fontWeight: "700", marginBottom: 8, color: text }}>
        Results ({results.length})
      </Text>
      <FlatList
        data={results}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 140 }}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 12,
              borderRadius: 8,
              backgroundColor: surface || "#fff",
              marginBottom: 8,
              borderWidth: 1,
              borderColor: "#e0e0e0",
            }}
          >
            <Text style={{ fontWeight: "700", color: text }}>{item.name}</Text>
            <Text style={{ color: secondary, marginTop: 4, fontSize: 13 }}>
              {item.organizer || item.writer}
            </Text>
            <Text style={{ fontSize: 12, color: secondary, marginTop: 6 }}>
              {Math.round(((item.current || 0) / (item.goal || 1)) * 100)}% • $
              {item.current || 0} raised
            </Text>
            <View style={{ flexDirection: "row", marginTop: 8 }}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("FundraiserDetail", { id: item.id })
                }
                style={{
                  padding: 8,
                  backgroundColor: "#eee",
                  borderRadius: 6,
                  marginRight: 8,
                }}
              >
                <Text style={{ color: text }}>Open</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("Donate", { id: item.id })}
                style={{
                  padding: 8,
                  backgroundColor: "#ffd39b",
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: "#333" }}>Donate</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
