import React from 'react';
import { View, SafeAreaView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState, useEffect } from 'react';
import projectList from '@/components/projectList';
import Navbar from '@/components/Navbar';
import projectsData from '@/fundraisers.json';
import * as storage from '@/utils/storage';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import localStore from '@/utils/localStorage';
import { useThemeColor } from '@/hooks/use-theme-color';

interface project {
  id: string;
  name: string;
  tags?: string[];
  ingredients?: Array<{ amount: string; unit: string; name: string }>;
  method?: string;
  image?: string;
  published?: boolean;
  favorite?: boolean;
}

export default function ExplorePublicScreen() {
  const router = useRouter();
  const rawBundled = (projectsData && projectsData.projects) || [];
  // normalize bundled projects ingredients to consistent shape
  const bundledprojects = (rawBundled || []).map(r => {
    const copy: any = { ...r };
    copy.name = r.name || r.title || r.projectName || r.displayName || 'Untitled Cause';
    copy.ingredients = (r.ingredients || []).map((ing: any) => {
      if (!ing) return { name: '', amount: '', unit: '', category: 'Uncategorized', type: 'dry' };
      if (typeof ing === 'string') {
        const trimmed = ing.trim();
        const m = trimmed.match(/^([\d\/\.]+)\s*(\S+)?\s*(.*)$/);
        if (m) return { amount: m[1] || '', unit: m[2] || '', name: (m[3]||'').trim() || m[2] || trimmed, category: 'Uncategorized', type: 'dry' };
        return { name: trimmed, amount: '', unit: '', category: 'Uncategorized', type: 'dry' };
      }
      return {
        name: ing.name || ing.item || ing.ingredient || '',
        amount: (ing.amount !== undefined && ing.amount !== null) ? String(ing.amount) : (ing.qty || ing.quantity || ''),
        unit: ing.unit || ing.u || '',
        category: ing.category || ing.cat || 'Uncategorized',
        type: ing.type || 'dry'
      };
    });
    return copy;
  });
  const [userPublished, setUserPublished] = useState<project[]>([]);
  const [globalPublished, setGlobalPublished] = useState<project[]>([]);
  const [query, setQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoritesSet, setFavoritesSet] = useState(new Set<string>());
  const bg = useThemeColor({}, 'background');
  const auth = useContext(AuthContext);

  const loadUserPublished = useCallback(async () => {
    const favs = (await localStore.getFavoritesFromStore()) || [];
    setFavoritesSet(new Set(favs.map((f: any) => f.id)));
    const myprojects = (await storage.loadForUser(auth && auth.user ? auth.user : null, 'myFundraisers', null)) || [];
    const published = (myprojects as project[]).filter((r: project) => r.published);
    setUserPublished(published);
  }, [auth]);

  const loadGlobalPublished = useCallback(async () => {
    try {
      const raw = (await storage.load('publicFundraisers', [])) || [];
      console.log('ExplorePublic: runtime public fundraisers count=', (raw || []).length);
      // normalize like bundledprojects
      const normalized = (raw || []).map((r: any) => {
        const copy: any = { ...r };
        copy.name = r.name || r.title || r.projectName || r.displayName || 'Untitled Cause';
        copy.ingredients = (r.ingredients || []).map((ing: any) => {
          if (!ing) return { name: '', amount: '', unit: '', category: 'Uncategorized', type: 'dry' };
          if (typeof ing === 'string') {
            const trimmed = ing.trim();
            const m = trimmed.match(/^([\d\/\.]+)\s*(\S+)?\s*(.*)$/);
            if (m) return { amount: m[1] || '', unit: m[2] || '', name: (m[3]||'').trim() || m[2] || trimmed, category: 'Uncategorized', type: 'dry' };
            return { name: trimmed, amount: '', unit: '', category: 'Uncategorized', type: 'dry' };
          }
          return {
            name: ing.name || ing.item || ing.ingredient || '',
            amount: (ing.amount !== undefined && ing.amount !== null) ? String(ing.amount) : (ing.qty || ing.quantity || ''),
            unit: ing.unit || ing.u || '',
            category: ing.category || ing.cat || 'Uncategorized',
            type: ing.type || 'dry'
          };
        });
        return copy;
      });
      setGlobalPublished(normalized || []);
    } catch (err) {
      console.warn('ExplorePublic: failed to load publicFundraisers', err);
      setGlobalPublished([]);
    }
  }, []);

  useEffect(() => { loadUserPublished(); loadGlobalPublished(); }, [loadUserPublished, loadGlobalPublished]);

  useFocusEffect(
    useCallback(() => {
      loadUserPublished();
      loadGlobalPublished();
    }, [loadUserPublished])
  );

  // merge lists and dedupe by id: userPublished > globalPublished > bundledprojects
  const projects: project[] = (() => {
    const map: Record<string, project> = {};
    (userPublished || []).forEach(r => { map[String(r.id)] = r; });
    (globalPublished || []).forEach(r => { if (!map[String(r.id)]) map[String(r.id)] = r; });
    (bundledprojects || []).forEach(r => { if (!map[String(r.id)]) map[String(r.id)] = r; });
    const out = Object.values(map) as project[];
    out.sort((a,b) => (b.publishedAt||'') > (a.publishedAt||'') ? 1 : -1);
    console.log('ExplorePublic: merged projects count=', out.length, 'userPublished=', (userPublished||[]).length, 'globalPublished=', (globalPublished||[]).length, 'bundled=', (bundledprojects||[]).length);
    return out;
  })();

  const addToFavorites = async (item: any) => {
    try {
      await localStore.addFavoritesToStore(item);
      setFavoritesSet(prev => new Set([...Array.from(prev), item.id]));
    } catch (err) {
      if (err && err.message === 'not-authenticated') {
        Alert.alert('Sign in required', 'Sign in or create an account to save favorites', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign in', onPress: () => router.push('/login') },
        ]);
        return;
      }
      console.warn('addToFavorites error', err);
    }
  };

  const removeFromFavorites = async (item: any) => {
    try {
      const favs = (await localStore.getFavoritesFromStore()) || [];
      const filtered = favs.filter((f: any) => f.id !== item.id);
      await localStore.removeFavoritesFromStore(filtered);
      const next = new Set(filtered.map((f: any) => f.id) as string[]);
      setFavoritesSet(next);
    } catch (err) {
      if (err && err.message === 'not-authenticated') {
        Alert.alert('Sign in required', 'Sign in or create an account to manage favorites', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign in', onPress: () => router.push('/login') },
        ]);
        return;
      }
      console.warn('removeFromFavorites error', err);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <Navbar query={query} onQueryChange={setQuery} favoritesOnly={favoritesOnly} onToggleFavorites={() => setFavoritesOnly(s => !s)} onLogout={() => setFavoritesSet(new Set())} />
      <View style={{ flex: 1, paddingBottom: 20 }}>
        <projectList
          projects={projects.filter((r: project) => !favoritesOnly || favoritesSet.has(r.id)) as any}
          query={query}
          onSelect={(r: any) => {
            try {
              console.log('ExplorePublic: onSelect called for', r.id, r.name);
              router.push(`/fundraiser/${r.id}`);
            } catch (err) {
              console.warn('ExplorePublic: onSelect navigation error', err);
            }
          }}
          selectedIds={[]}
          onToggleSelect={() => {}}
          favoritesSet={favoritesSet}
          addToFavorites={addToFavorites}
          removeFromFavorites={removeFromFavorites}
          saveToMyprojects={() => {}}
          savedSet={new Set()}
        />
      </View>
    </SafeAreaView>
  );
}

