import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as storage from "../utils/storage";

interface Milestone {
  id: string;
  title: string;
  note: string;
  completed: boolean;
  date: number;
}

export default function MilestonesScreen() {
  const navigation = useNavigation();
  const [list, setList] = useState<Milestone[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const m = (await storage.load("milestones", null)) as
          | Milestone[]
          | null;
        setList(m || []);
      } catch (e) {
        console.warn("load milestones", e);
      }
    })();
  }, []);

  const addSample = async () => {
    const s = {
      id: Date.now().toString(),
      title: "Build classroom",
      note: "Phase 1 completed",
      completed: false,
      date: Date.now(),
    };
    const next = [s, ...list];
    await storage.save("milestones", next);
    setList(next);
  };

  const toggle = async (id: string) => {
    const next = list.map((i) =>
      i.id === id ? { ...i, completed: !i.completed } : i,
    );
    await storage.save("milestones", next);
    setList(next);
  };

  const clearAll = () => {
    Alert.alert("Clear milestones", "Remove all local milestones?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await storage.remove("milestones");
          setList([]);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginBottom: 12 }}
        >
          <Text style={{ color: "#007aff" }}>← Back</Text>
        </TouchableOpacity>
      </View>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 8 }}>
          Milestones
        </Text>
        <Text style={{ color: "#666", marginBottom: 12 }}>
          Track cause milestones and mark progress. Stored locally for demo.
        </Text>

        <View style={{ flexDirection: "row", marginBottom: 12 }}>
          <Button title="Add Sample" onPress={addSample} />
          <View style={{ width: 12 }} />
          <Button title="Clear" color="#cc0000" onPress={clearAll} />
        </View>

        {list.length === 0 ? (
          <Text style={{ color: "#666" }}>
            No milestones yet. Add a sample or create one on a cause detail
            page.
          </Text>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <View
                style={{
                  padding: 10,
                  backgroundColor: "#fff",
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View>
                    <Text style={{ fontWeight: "700" }}>{item.title}</Text>
                    <Text style={{ color: "#666", fontSize: 12 }}>
                      {item.note || ""}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => toggle(item.id)}
                    style={{ padding: 8 }}
                  >
                    <Text
                      style={{ color: item.completed ? "green" : "#007aff" }}
                    >
                      {item.completed ? "Completed" : "Mark"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
