import { Colors } from "@/constants/theme";
import { USER_ROLE } from "@/constants/userRoles";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  hydrateDemoTransparencyFeeds,
  hydrateOrgDemoCausesIfNeeded,
} from "@/utils/hydrateDemoTransparency";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import FundraiserDetail from "../components/FundraiserDetail";
import { AuthContext } from "../context/AuthContext";
import * as storage from "../utils/storage";
import Achievements from "./achievements";
import Analytics from "./analytics";
import AnalyticsDashboard from "./analytics-dashboard";
import Budget from "./budget";
import CharityRatings from "./charity-ratings";
import Collections from "./collections";
import Dashboard from "./dashboard";
import Donate from "./donate";
import DonateConfirm from "./donate/confirm";
import DonationHistory from "./donation-history";
import ExportImpact from "./export-impact";
import ImpactGoals from "./impact-goals";
import Leaderboard from "./leaderboard";
import Milestones from "./milestones";
import MonthlyRecap from "./monthly-recap";
import MyImpact from "./my-impact";
import Notifications from "./notifications";
import OrgCauseDetail from "./org-cause-detail";
import OrgCauses from "./org-causes";
import OrgDashboard from "./org-dashboard";
import OrgFunds from "./org-funds";
import Profile from "./profile";
import Projects from "./projects";
import Receipt from "./receipt";
import Track from "./track";
import Upload from "./upload";
import Uploads from "./uploads";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabsNavigator() {
  const colorScheme = useColorScheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          height: 78,
          paddingBottom: 18,
          paddingTop: 10,
          backgroundColor: Colors[colorScheme ?? "light"].background,
          borderTopWidth: 1,
          borderTopColor: Colors[colorScheme ?? "light"].tabIconDefault,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap = "home";
          if (route.name === "Dashboard") iconName = "home";
          else if (route.name === "Track") iconName = "map-marker-path";
          else if (route.name === "Projects") iconName = "magnify";
          else if (route.name === "Profile") iconName = "account-circle";
          return (
            <MaterialCommunityIcons name={iconName} size={size} color={color} />
          );
        },
        tabBarLabel: ({ color }) => {
          const labels: Record<string, string> = {
            Dashboard: "Home",
            Track: "Track",
            Projects: "Browse",
            Profile: "Profile",
          };
          return (
            <Text style={{ color, fontSize: 12, fontWeight: "600" }}>
              {labels[route.name] || ""}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{ title: "Home" }}
      />
      <Tab.Screen name="Track" component={Track} options={{ title: "Track" }} />
      <Tab.Screen
        name="Projects"
        component={Projects}
        options={{ title: "Projects" }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}

function OrgTabsNavigator() {
  const colorScheme = useColorScheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          height: 78,
          paddingBottom: 18,
          paddingTop: 10,
          backgroundColor: Colors[colorScheme ?? "light"].background,
          borderTopWidth: 1,
          borderTopColor: Colors[colorScheme ?? "light"].tabIconDefault,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap =
            "view-dashboard";
          if (route.name === "OrgHome") iconName = "view-dashboard";
          else if (route.name === "OrgFunds") iconName = "cash-multiple";
          else if (route.name === "OrgCauses") iconName = "bullhorn";
          else if (route.name === "Profile") iconName = "account-circle";
          return (
            <MaterialCommunityIcons name={iconName} size={size} color={color} />
          );
        },
        tabBarLabel: ({ color }) => {
          const labels: Record<string, string> = {
            OrgHome: "Home",
            OrgFunds: "Funds",
            OrgCauses: "Causes",
            Profile: "Profile",
          };
          return (
            <Text style={{ color, fontSize: 12, fontWeight: "600" }}>
              {labels[route.name] || ""}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen
        name="OrgHome"
        component={OrgDashboard}
        options={{ title: "Home" }}
      />
      <Tab.Screen
        name="OrgFunds"
        component={OrgFunds}
        options={{ title: "Funds" }}
      />
      <Tab.Screen
        name="OrgCauses"
        component={OrgCauses}
        options={{ title: "Causes" }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}

export default function RootLayout() {
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    if (!loading) {
      hydrateDemoTransparencyFeeds();
    }
  }, [loading]);

  useEffect(() => {
    if (!loading && user?.role === USER_ROLE.ORGANIZATION) {
      hydrateOrgDemoCausesIfNeeded(user);
    }
  }, [loading, user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  const Tabbed =
    user?.role === USER_ROLE.ORGANIZATION ? OrgTabsNavigator : TabsNavigator;
  return (
    <Stack.Navigator
      key={`${user?.email || "anon"}-${user?.role || USER_ROLE.CONTRIBUTOR}`}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Tabs" component={Tabbed} />
      <Stack.Screen name="FundraiserDetail" component={ProjectDetailWrapper} />
      <Stack.Screen name="Budget" component={Budget} />
      <Stack.Screen name="Analytics" component={Analytics} />
      <Stack.Screen name="Milestones" component={Milestones} />
      <Stack.Screen name="Upload" component={Upload} />
      <Stack.Screen name="Uploads" component={Uploads} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="Donate" component={Donate} />
      <Stack.Screen name="DonateConfirm" component={DonateConfirm} />
      <Stack.Screen name="Receipt" component={Receipt} />
      <Stack.Screen
        name="Browse"
        component={Projects}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="MyImpact" component={MyImpact} />
      <Stack.Screen name="ExportImpact" component={ExportImpact} />
      <Stack.Screen name="ImpactGoals" component={ImpactGoals} />
      <Stack.Screen name="AnalyticsDashboard" component={AnalyticsDashboard} />
      <Stack.Screen name="Achievements" component={Achievements} />
      <Stack.Screen name="MonthlyRecap" component={MonthlyRecap} />
      <Stack.Screen name="Collections" component={Collections} />
      <Stack.Screen name="CharityRatings" component={CharityRatings} />
      <Stack.Screen name="DonationHistory" component={DonationHistory} />
      <Stack.Screen name="Leaderboard" component={Leaderboard} />
      <Stack.Screen name="OrgCauseDetail" component={OrgCauseDetail} />
    </Stack.Navigator>
  );
}

function ProjectDetailWrapper({
  route,
  navigation,
}: {
  route: { params?: { id?: string } };
  navigation: { goBack: () => void };
}) {
  const { params } = route || {};
  const id = params?.id;
  const auth = useContext(AuthContext);
  const [project, setproject] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const bundled = (await import("../fundraisers.json")).projects || [];
    const local = await storage.loadForUser(
      auth && auth.user ? auth.user : null,
      "myFundraisers",
      [],
    );
    const globalPub = await storage.load("publicFundraisers", []);
    const all = [...(local || []), ...(globalPub || []), ...(bundled || [])];
    let found = all.find((r) => String(r.id) === String(id));
    // fallback: check fundraisers seed data and map to project-like shape
    if (!found) {
      try {
        const fund =
          (await import("../data/seedFundraisers.json")).fundraisers || [];
        const f = (fund || []).find((x) => String(x.id) === String(id));
        if (f) {
          // map fundraiser -> project-like object expected by projectDetail
          found = {
            id: f.id,
            name: f.name || f.title || "Untitled Cause",
            image: f.image || null,
            tags: f.tags || [],
            ingredients: [],
            method:
              f.description || `Organizer: ${f.organizer || f.writer || ""}`,
            milestones: f.milestones || [],
            current: f.current || 0,
            goal: f.goal || 0,
            organizer: f.organizer || f.writer || "",
          };
        }
      } catch (e) {
        console.warn("projectDetailWrapper: no fundraisers fallback", e);
      }
    }
    setproject(found || null);
    setLoading(false);
  }, [id, auth]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  if (!project) return <View />;
  return (
    <FundraiserDetail project={project} onBack={() => navigation.goBack()} />
  );
}
