import { Redirect } from 'expo-router';

/** Legacy `/(tabs)` entry → main app shell. */
export default function TabsLegacyIndex() {
  return <Redirect href="/NavigationRoot" />;
}
