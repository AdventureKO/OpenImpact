import { ALLOCATION_TAGS } from "@/constants/allocationTags";
import { JOURNEY_STEP_LABELS } from "@/constants/donationJourney";
import { USER_ROLE } from "@/constants/userRoles";
import { AuthContext } from "@/context/AuthContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import { emit } from "@/utils/events";
import {
    loadIncomingDonations,
    sumIncomingForCause,
} from "@/utils/fundTracking";
import * as storage from "@/utils/storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    Alert,
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export type CauseFeedItem = {
  id: string;
  text: string;
  createdAt: string;
  authorName?: string;
  /** Which shipment-style stage this update relates to (0–4). */
  journeyStage?: number;
  /** Program | Staff | Operations | Infrastructure */
  allocationTag?: string;
  imageUri?: string | null;
};

function feedKey(causeId: string) {
  return `causeFeed_${causeId}`;
}

export default function OrgCauseDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const auth = useContext(AuthContext);
  const bg = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");
  const border = useThemeColor({}, "icon");

  const params = (route.params || {}) as { id?: string; sinceIso?: string };
  const id = String(params?.id || "");
  const sinceIso = params?.sinceIso;

  const [cause, setCause] = useState<any>(null);
  const [raised, setRaised] = useState(0);
  const [feed, setFeed] = useState<CauseFeedItem[]>([]);
  const [body, setBody] = useState("");
  const [journeyStage, setJourneyStage] = useState(0);
  const [allocationTag, setAllocationTag] = useState<string | null>(null);
  const [postImageUri, setPostImageUri] = useState<string | null>(null);
  const [amountSpent, setAmountSpent] = useState<string>("");

  const isOrg = auth.user?.role === USER_ROLE.ORGANIZATION;

  const filteredFeed = useMemo(() => {
    if (!sinceIso) return feed;
    const cut = new Date(sinceIso).getTime();
    return feed.filter((item) => new Date(item.createdAt).getTime() >= cut);
  }, [feed, sinceIso]);

  const loadCause = useCallback(async () => {
    const mine =
      (await storage.loadForUser(auth?.user ?? null, "myFundraisers", [])) ||
      [];
    let found: any = mine.find((c: any) => String(c.id) === id);
    if (!found) {
      const pub = (await storage.load("publicFundraisers", [])) || [];
      found = pub.find((c: any) => String(c.id) === id);
    }
    if (!found) {
      try {
        const bundled = (await import("../fundraisers.json")).projects || [];
        found = bundled.find((c: any) => String(c.id) === id);
      } catch {
        /* ignore */
      }
    }
    if (!found) {
      try {
        const fund =
          (await import("../data/seedFundraisers.json")).fundraisers || [];
        const f = fund.find((x: any) => String(x.id) === id);
        if (f) {
          found = {
            id: f.id,
            name: f.name || f.title || "Cause",
            method:
              f.description || `Organizer: ${f.organizer || f.writer || ""}`,
          };
        }
      } catch {
        /* ignore */
      }
    }
    setCause(found || null);
    const incoming = await loadIncomingDonations();
    setRaised(sumIncomingForCause(incoming, id));
  }, [auth?.user, id]);

  const loadFeed = useCallback(async () => {
    const items = ((await storage.load(feedKey(id), [])) ||
      []) as CauseFeedItem[];
    setFeed(
      items.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );
  }, [id]);

  useEffect(() => {
    loadCause();
    loadFeed();
  }, [loadCause, loadFeed]);

  const pickPostImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission", "Photo access is needed to attach proof.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.75,
      });
      if (!res || res.canceled) return;
      const uri = res.assets
        ? res.assets[0].uri
        : (res as { uri?: string }).uri;
      setPostImageUri(uri || null);
    } catch {
      Alert.alert("Error", "Could not pick image");
    }
  };

  const postUpdate = async () => {
    if (!isOrg) {
      Alert.alert(
        "Organizations only",
        "Sign in as an organization to post to this feed.",
      );
      return;
    }
    const t = body.trim();
    if (!t && !postImageUri) {
      Alert.alert("Add content", "Write an update or attach a photo.");
      return;
    }
    const stage = Math.min(
      Math.max(journeyStage, 0),
      JOURNEY_STEP_LABELS.length - 1,
    );
    const item: CauseFeedItem = {
      id: `feed-${Date.now()}`,
      text: t || "(Photo update)",
      createdAt: new Date().toISOString(),
      authorName: auth.user?.name || auth.user?.email || "Organization",
      journeyStage: stage,
      allocationTag: allocationTag || undefined,
      imageUri: postImageUri || null,
    };
    const next = [item, ...feed];
    await storage.save(feedKey(id), next);
    setFeed(next);
    // notify in-memory listeners so UI updates immediately
    try {
      emit("causeUpdated", { id, item });
    } catch (e) {
      /* ignore */
    }
    setBody("");
    setPostImageUri(null);

    // If the org included an amountSpent and selected an allocationTag, update stored cause allocations
    const spent = parseFloat(String(amountSpent || "").trim()) || 0;
    if (spent > 0 && allocationTag) {
      try {
        const myKey = await storage.loadForUser(
          auth?.user ?? null,
          "myFundraisers",
          [],
        );
        if (myKey) {
          const arr = myKey || [];
          const updated = (arr || []).map((c) => {
            if (String(c.id) !== String(id)) return c;
            const allocs = (c.allocations || []).slice();
            const idx = allocs.findIndex((a) => a.tag === allocationTag);
            if (idx >= 0)
              allocs[idx] = {
                ...allocs[idx],
                spent: (Number(allocs[idx].spent || 0) || 0) + spent,
              };
            else allocs.push({ tag: allocationTag, planned: 0, spent });
            return { ...c, allocations: allocs };
          });
          await storage.saveForUser(
            auth?.user ?? null,
            "myFundraisers",
            updated,
          );
        }
        const pub = (await storage.load("publicFundraisers", [])) || [];
        const pubUpdated = (pub || []).map((c) => {
          if (String(c.id) !== String(id)) return c;
          const allocs = (c.allocations || []).slice();
          const idx = allocs.findIndex((a) => a.tag === allocationTag);
          if (idx >= 0)
            allocs[idx] = {
              ...allocs[idx],
              spent: (Number(allocs[idx].spent || 0) || 0) + spent,
            };
          else allocs.push({ tag: allocationTag, planned: 0, spent });
          return { ...c, allocations: allocs };
        });
        await storage.save("publicFundraisers", pubUpdated);
      } catch (err) {
        console.warn("update allocations failed", err);
      }
      setAmountSpent("");
    }

    // Propagate journey stage to stored incoming donations and device donations
    try {
      const incoming = (await storage.load("incomingDonations", [])) || [];
      const updatedIncoming = (incoming || []).map((r) => {
        if (String(r.projectId) !== String(id)) return r;
        const prevStep = Number(r.journeyStep || 0);
        const nextStep = Math.max(prevStep, stage);
        return { ...r, journeyStep: nextStep };
      });
      await storage.save("incomingDonations", updatedIncoming);

      const anon = (await storage.load("anonDonations", [])) || [];
      const updatedAnon = (anon || []).map((d) => {
        if (String(d.projectId) !== String(id)) return d;
        const prev = Number(d.journeyStep || 0);
        return { ...d, journeyStep: Math.max(prev, stage) };
      });
      await storage.save("anonDonations", updatedAnon);

      try {
        const allForUser =
          (await storage.loadForUser(auth?.user ?? null, "donations", [])) ||
          [];
        const updatedForUser = (allForUser || []).map((d) => {
          if (String(d.projectId) !== String(id)) return d;
          const prev = Number(d.journeyStep || 0);
          return { ...d, journeyStep: Math.max(prev, stage) };
        });
        await storage.saveForUser(
          auth?.user ?? null,
          "donations",
          updatedForUser,
        );
      } catch (e) {
        /* ignore user-specific update errors */
      }
    } catch (err) {
      console.warn("propagate journey stage failed", err);
    }
  };

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: bg, flex: 1 }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={{ color: "#2563eb", fontWeight: "600" }}>← Back</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: text }]}>
        {cause?.name || "Cause"}
      </Text>
      <Text style={[styles.meta, { color: text }]}>
        Raised (on-device):{" "}
        <Text style={{ fontWeight: "800" }}>${raised.toFixed(2)}</Text>
      </Text>
      {cause?.method ? (
        <Text style={[styles.desc, { color: text }]}>{cause.method}</Text>
      ) : null}

      {cause?.allocations && (cause.allocations || []).length > 0 ? (
        <View
          style={{
            marginTop: 10,
            padding: 10,
            backgroundColor: "#f8fafc",
            borderRadius: 8,
          }}
        >
          <Text style={{ fontWeight: "800", marginBottom: 6 }}>
            Allocation plan
          </Text>
          {(cause.allocations || []).map((a: any, i: number) => (
            <View
              key={`a-${i}`}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <Text style={{ fontWeight: "700" }}>{a.tag}</Text>
              <Text style={{ color: "#334155" }}>
                {`Planned: $${(Number(a.planned || 0) || 0).toFixed(2)}`}{" "}
                {a.spent
                  ? ` • Spent: $${(Number(a.spent || 0) || 0).toFixed(2)}`
                  : null}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {sinceIso ? (
        <View style={styles.sinceBanner}>
          <Text style={styles.sinceBannerTitle}>Updates since your gift</Text>
          <Text style={styles.sinceBannerSub}>
            Showing official posts on or after{" "}
            {new Date(sinceIso).toLocaleString()}.
          </Text>
        </View>
      ) : null}

      {isOrg ? (
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.h2, { color: text }]}>
            Post a transparency update
          </Text>
          <Text style={[styles.helper, { color: text }]}>
            Tie each post to a journey stage and (optionally) where funds
            went—donors see this on their impact timeline.
          </Text>

          <Text style={[styles.miniLabel, { color: text }]}>Journey stage</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
          >
            {JOURNEY_STEP_LABELS.map((label, idx) => (
              <TouchableOpacity
                key={label}
                onPress={() => setJourneyStage(idx)}
                style={[styles.chip, journeyStage === idx && styles.chipOn]}
              >
                <Text
                  style={[
                    styles.chipText,
                    journeyStage === idx && styles.chipTextOn,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.miniLabel, { color: text, marginTop: 10 }]}>
            Use of funds (optional)
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
          >
            <TouchableOpacity
              onPress={() => setAllocationTag(null)}
              style={[styles.chip, allocationTag === null && styles.chipOn]}
            >
              <Text
                style={[
                  styles.chipText,
                  allocationTag === null && styles.chipTextOn,
                ]}
              >
                —
              </Text>
            </TouchableOpacity>
            {ALLOCATION_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                onPress={() => setAllocationTag(tag)}
                style={[styles.chip, allocationTag === tag && styles.chipOn]}
              >
                <Text
                  style={[
                    styles.chipText,
                    allocationTag === tag && styles.chipTextOn,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput
            placeholder="Receipt narrative, milestone, staff note…"
            placeholderTextColor="#888"
            value={body}
            onChangeText={setBody}
            multiline
            style={[styles.input, { borderColor: border, color: text }]}
          />
          <TextInput
            placeholder="Amount spent (optional)"
            placeholderTextColor="#888"
            value={amountSpent}
            onChangeText={setAmountSpent}
            keyboardType="numeric"
            style={[
              styles.input,
              { borderColor: border, color: text, marginTop: 8 },
            ]}
          />
          {postImageUri ? (
            <View style={{ marginBottom: 10 }}>
              <Image source={{ uri: postImageUri }} style={styles.previewImg} />
              <TouchableOpacity onPress={() => setPostImageUri(null)}>
                <Text style={{ color: "#b91c1c", fontWeight: "600" }}>
                  Remove photo
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <TouchableOpacity style={styles.secondaryBtn} onPress={pickPostImage}>
            <Text style={styles.secondaryBtnText}>
              Attach photo (optional proof)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.postBtn} onPress={postUpdate}>
            <Text style={styles.postBtnText}>Publish update</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={[styles.hint, { color: text }]}>
          Organizations publish proof-backed updates here. Open from Track →
          Transparency feed or My impact.
        </Text>
      )}

      <Text style={[styles.h2, { color: text, marginTop: 18 }]}>
        {sinceIso ? "Filtered cause feed" : "Cause feed"}
      </Text>
      <FlatList
        style={{ flex: 1 }}
        data={filteredFeed}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={{ paddingVertical: 12 }}>
            <Text style={{ color: "#888", marginTop: 8 }}>
              {sinceIso
                ? "No official posts yet since your donation time. Try the full feed, or post a new update from the org account."
                : "No updates yet."}
            </Text>
            {sinceIso ? (
              <TouchableOpacity
                style={{
                  marginTop: 14,
                  alignSelf: "flex-start",
                  backgroundColor: "#e0e7ff",
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                }}
                onPress={() =>
                  navigation.navigate(
                    "OrgCauseDetail" as never,
                    { id } as never,
                  )
                }
              >
                <Text style={{ fontWeight: "700", color: "#3730a3" }}>
                  Show full transparency feed
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          const stageIdx =
            typeof item.journeyStage === "number"
              ? Math.min(
                  Math.max(item.journeyStage, 0),
                  JOURNEY_STEP_LABELS.length - 1,
                )
              : null;
          return (
            <View style={styles.card}>
              <View style={styles.badgeRow}>
                {stageIdx !== null ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {JOURNEY_STEP_LABELS[stageIdx]}
                    </Text>
                  </View>
                ) : null}
                {item.allocationTag ? (
                  <View style={[styles.badge, styles.badgeMuted]}>
                    <Text style={styles.badgeAlloc}>{item.allocationTag}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.cardDate}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
              {item.authorName ? (
                <Text style={styles.cardAuthor}>{item.authorName}</Text>
              ) : null}
              {item.imageUri ? (
                <Image source={{ uri: item.imageUri }} style={styles.cardImg} />
              ) : null}
              {/* Verified checkpoint badge when a photo or allocation tag is present */}
              {item.imageUri ||
              item.allocationTag ||
              (stageIdx !== null && stageIdx >= 1) ? (
                <View style={{ marginTop: 8 }}>
                  <View
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: "#e6fffa",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: "#065f46",
                        fontWeight: "800",
                        fontSize: 12,
                      }}
                    >
                      Verified checkpoint
                    </Text>
                  </View>
                </View>
              ) : null}
              <Text style={[styles.cardBody, { color: text }]}>
                {item.text}
              </Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, paddingTop: 12 },
  back: { marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 6 },
  meta: { fontSize: 14, marginBottom: 8 },
  desc: { fontSize: 14, opacity: 0.9 },
  h2: { fontWeight: "700", marginBottom: 8, fontSize: 16 },
  hint: { fontSize: 13, opacity: 0.85, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 88,
    textAlignVertical: "top",
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  postBtn: {
    backgroundColor: "#059669",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  postBtnText: { color: "#fff", fontWeight: "700" },
  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
  },
  cardDate: { fontSize: 11, color: "#64748b" },
  cardAuthor: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginTop: 4,
  },
  cardBody: { marginTop: 6, fontSize: 15, lineHeight: 22 },
  helper: { fontSize: 13, opacity: 0.85, marginBottom: 10, lineHeight: 18 },
  miniLabel: { fontSize: 12, fontWeight: "700", marginBottom: 6 },
  chipScroll: { marginBottom: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  chipOn: { backgroundColor: "#dbeafe", borderColor: "#2563eb" },
  chipText: { fontSize: 12, fontWeight: "600", color: "#475569" },
  chipTextOn: { color: "#1d4ed8" },
  secondaryBtn: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    marginBottom: 10,
  },
  secondaryBtnText: { fontWeight: "700", color: "#334155" },
  previewImg: { width: "100%", height: 160, borderRadius: 10, marginBottom: 6 },
  cardImg: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 6,
    resizeMode: "cover",
  },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 },
  badge: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeMuted: { backgroundColor: "#fef3c7" },
  badgeText: { fontSize: 11, fontWeight: "800", color: "#065f46" },
  badgeAlloc: { fontSize: 11, fontWeight: "800", color: "#92400e" },
  sinceBanner: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  sinceBannerTitle: { fontWeight: "800", color: "#1e3a8a", marginBottom: 4 },
  sinceBannerSub: { fontSize: 13, color: "#1e40af" },
});
