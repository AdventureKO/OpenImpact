/**
 * BottomTabNavigator.js
 *
 * Example Bottom Tab Navigator using React Navigation.
 * This file is a self-contained example you can plug into a non-expo-router React Native app,
 * or use as a reference if you want to migrate parts of your app to a standard
 * React Navigation structure.
 *
 * IMPORTANT: Your project currently uses Expo Router. If you want to keep using
 * Expo Router's file-based tabs (app/(tabs)/_layout.tsx), you do NOT need this file.
 * Use this only if you want a React Navigation-based tab bar.
 *
 * Install required packages:
 *
 * npm install @react-navigation/native @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context
 * npx expo install react-native-gesture-handler react-native-reanimated @expo/vector-icons
 *
 * Wrap your app entry (App.js) with NavigationContainer and render <BottomTabNavigator />.
 *
 */

import React, { useContext } from 'react';
import { View, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationContext } from '../context/NotificationContext';

// Import actual app screens where possible
import DashboardScreen from '../app/dashboard';
import TrackScreen from '../app/track';
import ProjectsScreen from '../app/projects';
import ProfileScreen from '../app/profile';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator({ initialRouteName = 'Dashboard' }) {
  const { notifications } = useContext(NotificationContext || React.createContext({ notifications: [] }));
  const unread = (notifications || []).filter(n => !n.read).length;

  return (
    <NavigationContainer independent>
      <Tab.Navigator
        initialRouteName={initialRouteName}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#ff7a59',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarShowLabel: true,
          tabBarLabelStyle: { fontSize: 12, marginBottom: Platform.OS === 'ios' ? 4 : 2 },
          tabBarStyle: {
            height: 62,
            backgroundColor: '#0b1220',
            borderTopWidth: 0,
            elevation: 8,
            shadowColor: '#000',
            shadowOpacity: 0.12,
            paddingBottom: Platform.OS === 'ios' ? 12 : 8,
            paddingTop: 6,
          },
          tabBarIcon: ({ color, size, focused }) => {
            let iconName = 'home-outline';
            if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
            else if (route.name === 'Track') iconName = focused ? 'repeat' : 'repeat-outline';
            else if (route.name === 'Projects') iconName = focused ? 'search' : 'search-outline';
            else if (route.name === 'Profile') iconName = focused ? 'person-circle' : 'person-circle-outline';

            return <Ionicons name={iconName} size={24} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Explore' }} />
        <Tab.Screen name="Track" component={TrackScreen} options={{ title: 'Track' }} />
        <Tab.Screen name="Projects" component={ProjectsScreen} options={{ title: 'Projects' }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile', tabBarBadge: unread > 0 ? unread : undefined }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

