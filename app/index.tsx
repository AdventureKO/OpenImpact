import { Redirect } from 'expo-router';

/** Root `/` opens the main tab navigator (React Navigation shell). */
export default function Index() {
  return <Redirect href="/NavigationRoot" />;
}
