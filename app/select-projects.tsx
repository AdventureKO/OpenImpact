import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput, SafeAreaView, Modal, Alert, Image, Pressable } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import FinalList from '../components/FinalList';
import FundraiserDetail from '../components/FundraiserDetail';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import LoginScreen from './login';
import { useRouter, useFocusEffect } from 'expo-router';
import projectsData from '../fundraisers.json';
import * as storage from '../utils/storage';
import { useThemeColor } from '../hooks/use-theme-color';

export default function SelectprojectsScreen() {
  const router = useRouter();
  const [published, setPublished] = useState([]);
  const [local, setLocal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [filter, setFilter] = useState<'my'|'favorites'|'published'>('my');
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState(new Set());
  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  // compute a safe text color if theme hook returns falsy or background is very dark
  const safeTextColor = (() => {
    try {
      if (text) return text;
      if (!bg || typeof bg !== 'string') return '#000';
      const hex = bg.replace('#','');
      if (hex.length === 3) {
        const r = parseInt(hex[0]+hex[0],16);
        const g = parseInt(hex[1]+hex[1],16);
        const b = parseInt(hex[2]+hex[2],16);
        const lum = (0.2126*r + 0.7152*g + 0.0722*b)/255;
        return lum < 0.5 ? '#fff' : '#000';
      }
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0,2),16);
        const g = parseInt(hex.substring(2,4),16);
        const b = parseInt(hex.substring(4,6),16);
        const lum = (0.2126*r + 0.7152*g + 0.0722*b)/255;
        return lum < 0.5 ? '#fff' : '#000';
      }
      return '#000';
    } catch (e) { return '#000'; }
  })();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [modalCategories, setModalCategories] = useState({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [detailproject, setDetailproject] = useState(null);
  const primary = useThemeColor({}, 'primary');
  const success = useThemeColor({}, 'success');
  const secondary = useThemeColor({}, 'secondary');

  const auth = useContext(AuthContext);
  const loadData = useCallback(async () => {
    const rawPub = (projectsData && projectsData.projects) || [];
    // also include any runtime-published fundraisers saved to AsyncStorage
    const runtimePub = await storage.load('publicFundraisers', []);
    console.log('select-projects: runtime public fundraisers count=', (runtimePub || []).length);
    const combinedRaw = [...(runtimePub || []), ...(rawPub || [])];
    // normalize bundled/public projects to ensure consistent ingredient objects
    const pub = (combinedRaw || []).map(r => {
    const copy = { ...r };
    copy.name = r.name || r.title || r.projectName || r.displayName || 'Untitled Cause';
      copy.ingredients = (r.ingredients || []).map(ing => {
        if (!ing) return { name: '', amount: '', unit: '', category: 'Uncategorized', type: 'dry' };
        if (typeof ing === 'string') {
          const trimmed = ing.trim();
          const m = trimmed.match(/^([\d\/\.]+)\s*(\S+)?\s*(.*)$/);
          if (m) return { amount: m[1] || '', unit: m[2] || '', name: (m[3]||'').trim() || m[2] || trimmed, category: ing.category || 'Uncategorized', type: 'dry' };
          return { name: trimmed, amount: '', unit: '', category: 'Uncategorized', type: 'dry' };
        }
        // object case: ensure keys exist
        return {
          name: ing.name || ing.item || ing.ingredient || '',
          amount: (ing.amount !== undefined && ing.amount !== null) ? String(ing.amount) : (ing.qty || ing.quantity || ''),
          unit: ing.unit || ing.u || '',
          category: ing.category || ing.cat || 'Uncategorized',
          type: ing.type || 'dry',
          label: ing.label || ing.original || ''
        };
      });
      return copy;
    });
    const mys = await storage.loadForUser(auth && auth.user ? auth.user : null, 'myFundraisers', []);
    const favs = await storage.loadForUser(auth && auth.user ? auth.user : null, 'favorites', []);
    // include user-published projects at the front of published list
    const userPublished = (mys || []).filter(r => r.published);
    // merge user-published and runtime public projects, dedupe by id (userPublished wins)
    const mergedMap = {};
    (userPublished || []).forEach(r => { mergedMap[String(r.id)] = r; });
    (pub || []).forEach(r => { if (!mergedMap[String(r.id)]) mergedMap[String(r.id)] = r; });
    const merged = Object.values(mergedMap).sort((a,b) => (b.publishedAt||'') > (a.publishedAt||'') ? 1 : -1);
    console.log('select-projects: merged published count=', merged.length, 'userPublished=', (userPublished||[]).length, 'runtimePub=', (pub||[]).length);
    setPublished(merged || []);
    setLocal(mys || []);
    setFavorites(new Set((favs || []).map(f => f.id)));
    setLoading(false);
  }, [auth]);

  useEffect(() => { loadData(); }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const all = useMemo(() => {
    const list = [...(local || []), ...(published || [])];
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter(r => (r.name || '').toLowerCase().includes(q) || (r.tags||[]).some(t => t.toLowerCase().includes(q)));
  }, [local, published, query]);

  const visible = useMemo(() => {
    // start from the appropriate base list depending on the selected filter
    let base = [];
    if (filter === 'my') base = (local || []).filter(r => !r.savedFromPublished);
    else if (filter === 'favorites') base = (published || []).filter(r => favorites.has(r.id));
    else base = published || [];

    if (!query) return base;
    const q = query.toLowerCase();
    return base.filter(r => (r.name || '').toLowerCase().includes(q) || (r.tags || []).some(t => (t || '').toLowerCase().includes(q)));
  }, [all, local, published, filter, favorites]);


  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const generate = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    // gather selected projects from both sources
    const items = [...(local||[]), ...(published||[])].filter(r => ids.includes(String(r.id)) || ids.includes(r.id));
    console.log('generate fired, selected items:', items.length);
    const categories = {};
    items.forEach(project => {
      (project.ingredients || []).forEach(ing => {
        const cat = ing.category || 'Uncategorized';
        if (!categories[cat]) categories[cat] = [];
        const amountParsed = parseFloat(String(ing.amount).replace(/[^0-9.\-]/g, ''));
        const amt = Number.isFinite(amountParsed) ? amountParsed : ing.amount;
        const unit = ing.unit || '';
        const originalText = ing.original || ing.raw || `${amt}${unit ? ' ' + unit : ''} ${ing.name}`.trim();
        const rname = project.name || project.title || project.projectName || project.displayName || '';
        categories[cat].push({
          name: ing.name,
          amount: amt,
          unit: unit || '',
          type: ing.type || 'dry',
          // include project context so consolidated sources can show where each item came from
          projectName: rname,
          projectId: project.id || null,
          ingredientLabel: ing.label || '',
          originalText,
        });
      });
    });
    await storage.saveForUser(auth && auth.user ? auth.user : null, 'currentCategories', categories);
    console.log('categories saved, opening overlay');
    setModalCategories(categories);
    setShowGenerateModal(true);
  };

  if (loading) return <SafeAreaView style={{flex:1, justifyContent:'center'}}><ActivityIndicator /></SafeAreaView>;

  const renderItem = ({ item }) => {
    console.log('select-projects renderItem:', item && item.id, 'name=', item && item.name, 'safeTextColor=', safeTextColor);
    const id = String(item.id);
    const is = selected.has(id) || selected.has(item.id);
    return (
      <View style={[styles.item, { backgroundColor: bg, borderColor: '#ddd' }]}> 
        <Pressable onPress={() => setDetailproject(item)} style={{ flex: 1 }} android_ripple={{ color: '#eee' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
            {item.image ? (
                <Image source={{ uri: item.image }} style={styles.thumbSmall} />
            ) : (
              <View style={[styles.thumbSmall, { backgroundColor: '#ffffff' }]} />
            )}
            <View style={{ marginLeft: 12, flex: 1, flexDirection: 'column', backgroundColor: 'transparent', minWidth: 120 }}>
                {/* Title: allow wrapping, shrink as needed, show up to 2 lines */}
                  <Text
                  style={[styles.name, { color: text || '#fff', flexShrink: 1, flexWrap: 'wrap' }]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {item.name || item.title || item.projectName || item.displayName || `#${item.id}`}
                </Text>
                {item.tags && <Text style={{ color: secondary, fontSize: 12, marginTop: 2 }}>{(item.tags || []).join(', ')}</Text>}
            </View>
          </View>
        </Pressable>
        <TouchableOpacity onPress={() => toggle(id)} style={{ marginLeft: 12 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <View style={[styles.checkbox, is ? styles.checked : null]}>
            {is ? <Text style={styles.checkboxText}>✓</Text> : null}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Close detail modal
  const closeDetail = () => setDetailproject(null);

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: bg }]}> 
            <View style={styles.controls}>
        <View style={styles.filters}>
              <TouchableOpacity onPress={() => setFilter('my')} style={[styles.filterBtn, filter==='my' && { backgroundColor: primary }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Text style={[styles.filterText, filter==='my' && { color: '#fff' }]}>My</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setFilter('favorites')} style={[styles.filterBtn, filter==='favorites' && { backgroundColor: primary }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Text style={[styles.filterText, filter==='favorites' && { color: '#fff' }]}>Favorites</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setFilter('published')} style={[styles.filterBtn, filter==='published' && { backgroundColor: primary }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Text style={[styles.filterText, filter==='published' && { color: '#fff' }]}>Public</Text></TouchableOpacity>
        </View>
        <TextInput placeholder="Search causes" placeholderTextColor="#ccc" value={query} onChangeText={setQuery} style={[styles.search, { color: '#fff' }]} />
      </View>

      {filter === 'my' && !auth?.user ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: text, marginBottom: 12 }}>Create an account to save and manage your causes.</Text>
          <TouchableOpacity onPress={() => router.push('/register')} style={{ backgroundColor: '#27ae60', padding: 10, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Create account</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList data={visible} keyExtractor={i => String(i.id)} renderItem={renderItem} contentContainerStyle={{ padding: 12, paddingBottom: 100 }} />
      )}

      <View style={[styles.footer, { paddingBottom: 20 }]}>
        <Text style={{ color: text, marginRight: 12 }}>{selected.size} selected</Text>
        <TouchableOpacity
          onPress={() => { console.log('generate button pressed'); generate(); }}
          activeOpacity={0.7}
          style={[styles.generateBtn, { backgroundColor: primary }]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Generate Donation List</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={showGenerateModal} animationType="slide">
        <SafeAreaView style={[styles.wrap, { backgroundColor: bg }]}> 
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12 }}>
            <Text style={{ fontWeight: '700', fontSize: 18, color: text }}>Generated Donation List</Text>
            <TouchableOpacity onPress={() => setShowGenerateModal(false)} style={{ padding: 8 }}><Text style={{ color: '#fff' }}>Close</Text></TouchableOpacity>
          </View>
          <FinalList categories={modalCategories || {}} handleSavedLists={async (cats) => {
            const title = `Donation List ${new Date().toLocaleString()}`;
            const lists = await storage.loadForUser(auth && auth.user ? auth.user : null, 'savedLists', []);
            const newLists = [{ title, categories: cats }, ...(lists || [])];
            await storage.saveForUser(auth && auth.user ? auth.user : null, 'savedLists', newLists);
            Alert.alert('Saved', `List saved as "${title}"`);
            setShowGenerateModal(false);
          }} onRequireAuth={() => setShowLoginModal(true)} />
        </SafeAreaView>
      </Modal>
      <Modal visible={!!detailproject} animationType="slide">
        <SafeAreaView style={[styles.wrap, { backgroundColor: bg }]}> 
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12 }}>
            <Text style={{ fontWeight: '700', fontSize: 18, color: text }}>{detailproject ? (detailproject.name || 'project') : 'project'}</Text>
            <TouchableOpacity onPress={closeDetail} style={{ padding: 8 }}><Text style={{ color: '#fff' }}>Close</Text></TouchableOpacity>
          </View>
          {detailproject && <FundraiserDetail project={detailproject} onBack={closeDetail} />}
        </SafeAreaView>
      </Modal>
      <Modal visible={showLoginModal} animationType="slide">
        <SafeAreaView style={[styles.wrap, { backgroundColor: bg }]}> 
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12 }}>
            <Text style={{ fontWeight: '700', fontSize: 18, color: text }}>Login</Text>
            <TouchableOpacity onPress={() => setShowLoginModal(false)} style={{ padding: 8 }}><Text style={{ color: '#fff' }}>Close</Text></TouchableOpacity>
          </View>
          <LoginScreen onSuccess={() => setShowLoginModal(false)} onRegister={() => { setShowLoginModal(false); setShowRegisterModal(true); }} />
        </SafeAreaView>
      </Modal>
      <Modal visible={showRegisterModal} animationType="slide">
        <SafeAreaView style={[styles.wrap, { backgroundColor: bg }]}> 
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12 }}>
            <Text style={{ fontWeight: '700', fontSize: 18, color: text }}>Create account</Text>
            <TouchableOpacity onPress={() => setShowRegisterModal(false)} style={{ padding: 8 }}><Text style={{ color: '#fff' }}>Close</Text></TouchableOpacity>
          </View>
          {React.createElement(require('./register').default)}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  controls: { padding: 12 },
  filters: { flexDirection: 'row', marginBottom: 8 },
  filterBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, marginRight: 8, backgroundColor: '#eee' },
  filterActive: { backgroundColor: '#3498db' },
  filterText: { color: '#222' },
  search: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 8 },
  item: { padding: 12, borderWidth: 1, borderRadius: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leftRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: '#999', alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: '#2ecc71', borderColor: '#2ecc71' },
  checkboxText: { color: '#fff', fontWeight: '700' },
  name: { fontSize: 16, fontWeight: '700' },
  thumb: { width: 72, height: 56, borderRadius: 8, backgroundColor: '#eee' },
  thumbSmall: { width: 56, height: 44, borderRadius: 8, backgroundColor: '#eee' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#2c3e50' },
  generateBtn: { padding: 12, backgroundColor: '#27ae60', borderRadius: 8 }
});

