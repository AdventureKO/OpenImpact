import React, { useEffect, useCallback, useState, useContext } from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import Dashboard from './dashboard';
import Track from './track';
import Projects from './projects';
import Profile from './profile';
import Budget from './budget';
import Analytics from './analytics';
import Milestones from './milestones';
import Upload from './upload';
import Uploads from './uploads';
import Donate from './donate';
import DonateConfirm from './donate/confirm';
import Receipt from './receipt';
import Notifications from './notifications';
import FundraiserDetail from '../components/FundraiserDetail';
import { AuthContext } from '../context/AuthContext';
import * as storage from '../utils/storage';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabsNavigator() {
  const colorScheme = useColorScheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          height: 78,
          paddingBottom: 18,
          paddingTop: 10,
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          borderTopWidth: 1,
          borderTopColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'home';
          if (route.name === 'Dashboard') iconName = 'home';
          else if (route.name === 'Track') iconName = 'map-marker-path';
          else if (route.name === 'Projects') iconName = 'magnify';
          else if (route.name === 'Profile') iconName = 'account-circle';
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarLabel: ({ color }) => {
          const labels: Record<string, string> = {
            Dashboard: 'Home',
            Track: 'Track',
            Projects: 'Browse',
            Profile: 'Profile',
          };
          return (
            <Text style={{ color, fontSize: 12, fontWeight: '600' }}>
              {labels[route.name] || ''}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} options={{ title: 'Home' }} />
      <Tab.Screen name="Track" component={Track} options={{ title: 'Track' }} />
      <Tab.Screen name="Projects" component={Projects} options={{ title: 'Projects' }} />
      <Tab.Screen name="Profile" component={Profile} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function RootLayout() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabsNavigator} />
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
    </Stack.Navigator>
  );
}

function ProjectDetailWrapper({ route, navigation }: { route: { params?: { id?: string } }; navigation: { goBack: () => void } }) {
  const { params } = route || {};
  const id = params?.id;
  const auth = useContext(AuthContext);
  const [project, setproject] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const bundled = (await import('../fundraisers.json')).projects || [];
    const local = await storage.loadForUser(auth && auth.user ? auth.user : null, 'myFundraisers', []);
    const globalPub = await storage.load('publicFundraisers', []);
    const all = [...(local || []), ...(globalPub || []), ...(bundled || [])];
    let found = all.find(r => String(r.id) === String(id));
    // fallback: check fundraisers seed data and map to project-like shape
    if (!found) {
      try {
        const fund = (await import('../data/seedFundraisers.json')).fundraisers || [];
        const f = (fund || []).find(x => String(x.id) === String(id));
        if (f) {
          // map fundraiser -> project-like object expected by projectDetail
          found = {
            id: f.id,
            name: f.name || f.title || 'Untitled Cause',
            image: f.image || null,
            tags: f.tags || [],
            ingredients: [],
            method: (f.description || `Organizer: ${f.organizer || f.writer || ''}`),
            milestones: f.milestones || [],
            current: f.current || 0,
            goal: f.goal || 0,
            organizer: f.organizer || f.writer || ''
          };
        }
      } catch (e) {
        console.warn('projectDetailWrapper: no fundraisers fallback', e);
      }
    }
    setproject(found || null);
    setLoading(false);
  }, [id, auth]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={{ flex:1, justifyContent:'center' }}><Text>Loading...</Text></View>;
  if (!project) return <View />;
  return <FundraiserDetail project={project} onBack={() => navigation.goBack()} />;
}

