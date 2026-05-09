import React, { useEffect, useState, useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import recipesData from '../../fundraisers.json';
import FundraiserDetail from '../../components/FundraiserDetail';
import * as storage from '../../utils/storage';
import { AuthContext } from '../../context/AuthContext';

export default function ProjectScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = useContext(AuthContext);

  useEffect(() => {
    (async () => {
      console.log('ProjectScreen: loading project id=', id, 'auth=', !!auth?.user);
      const bundled = (recipesData && (recipesData.projects || recipesData.recipes)) || [];
      const local = await storage.loadForUser(auth && auth.user ? auth.user : null, 'myFundraisers', []);
      const all = [...(local || []), ...bundled];
      const found = all.find(r => String(r.id) === String(id));
      console.log('ProjectScreen: found=', !!found, found && found.name);
      setProject(found || null);
      setLoading(false);
    })();
  }, [id, auth]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>;
  if (!project) return <View />;

  return <FundraiserDetail project={project} onBack={() => router.back()} />;
}
