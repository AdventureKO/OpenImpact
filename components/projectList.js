import React, { useMemo, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useThemeColor } from '../hooks/use-theme-color';

export default function FundraiserList({ projects = [], query = '', onSelect, selectedIds = [], onToggleSelect, favoritesSet = new Set(), addToFavorites, removeFromFavorites, saveToMyprojects, savedSet = new Set() }) {
  const filtered = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    let list = projects;
    if (q) list = projects.filter(r => 
      r.name.toLowerCase().includes(q) || 
      (r.tags || []).some(t => t.toLowerCase().includes(q))
    );
    return list;
  }, [projects, query]);

  // When a query is present, sort matches so the most relevant appear first
  const displayed = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    if (!q) return filtered;
    const scored = (filtered || []).map(r => {
      const name = (r.name || '').toLowerCase();
      let score = 0;
      if (name === q) score += 100; // exact match highest
      else if (name.startsWith(q)) score += 50;
      else if (name.includes(q)) score += 20;
      const tags = (r.tags || []).map(t => (t || '').toLowerCase());
      if (tags.some(t => t === q)) score += 10;
      else if (tags.some(t => t.includes(q))) score += 5;
      return { item: r, score };
    });
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.item.name.localeCompare(b.item.name);
    });
    return scored.map(s => s.item);
  }, [filtered, query]);

  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const border = useThemeColor({}, 'icon');

  useEffect(() => {
    console.log('FundraiserList mounted, onSelect type=', typeof onSelect);
  }, [onSelect]);
  const router = useRouter();
  const navigation = useNavigation();

  const isSelected = (id) => selectedIds && selectedIds.includes(id);
  const isFavorite = (id) => favoritesSet && favoritesSet.has && favoritesSet.has(id);

  return (
    <FlatList
      data={displayed}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.item, { backgroundColor: bg, borderColor: border }]}
            onPress={() => {
            console.log('FundraiserList: item pressed', item.id, item.name);
            if (!onSelect) console.warn('FundraiserList: onSelect not provided');
            try {
              onSelect && onSelect(item);
            } catch (err) {
              console.warn('projectList: onSelect threw', err);
            }
            // Ensure navigation even if parent handler misses it
            try { navigation && navigation.navigate && navigation.navigate('FundraiserDetail', { id: item.id }); } catch (err) { console.warn('FundraiserList: navigation.navigate failed', err); }
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {/* thumbnail */}
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, { backgroundColor: '#ffffff' }]} />
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.name, { color: text }]}>{item.name || item.title || item.displayName || 'Untitled'}</Text>
                {item.tags && item.tags.length > 0 && (
                  <Text style={[styles.tags, { color: text }]}>{item.tags.join(', ')}</Text>
                )}
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => {
                console.log('FundraiserList: star pressed', item.id);
                if (isFavorite(item.id)) { removeFromFavorites && removeFromFavorites(item); } else { addToFavorites && addToFavorites(item); }
              }} style={{ padding: 8 }}>
                <Text style={{ fontSize: 18, color: text }}>{isFavorite(item.id) ? '★' : '☆'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={() => (
        <View style={styles.empty}><Text style={[styles.emptyText, { color: text }]}>No causes found</Text></View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  item: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 10,
    borderColor: '#eee',
    borderWidth: 1
  },
  thumb: { width: 72, height: 56, borderRadius: 6, backgroundColor: '#eee' },
  name: { fontSize: 16, fontWeight: '600' },
  tags: { marginTop: 6, color: '#666' },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#666' }
});

