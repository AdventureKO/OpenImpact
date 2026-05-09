import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { View, Text, TouchableOpacity, Image, Modal, StyleSheet, Alert, SafeAreaView, TextInput } from 'react-native';
import * as localStore from '../utils/localStorage';
import * as storage from '../utils/storage';
import projectsData from '../fundraisers.json';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColor } from '../hooks/use-theme-color';
import themePref from '../hooks/theme-pref';
// clipboard package removed to avoid build-time dependency; users can copy manually from modal

export default function ProfileDropdown({ onLogout }) {
  const [visible, setVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const primary = useThemeColor({}, 'primary');
  const secondary = useThemeColor({}, 'secondary');
  const danger = useThemeColor({}, 'danger');

  const auth = useContext(AuthContext);
  useEffect(() => {
    (async () => {
      const u = auth && auth.user ? auth.user : await localStore.getUser();
      const img = await localStore.getImage();
      setUser(u);
      setAvatar(img);
      const t = await themePref.getTheme();
      setThemeSelection(t || 'system');
    })();
  }, [visible, auth && auth.user]);

  const [themeSelection, setThemeSelection] = useState('system');

  const pickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return Alert.alert('Permission', 'Permission to access photos is required');
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      if (!result) return;
      const canceled = result.cancelled || result.canceled;
      if (canceled) return;
      const uri = result.assets ? result.assets[0].uri : result.uri;
      if (uri) {
        await localStore.saveImage(uri);
        setAvatar(uri);
        Alert.alert('Saved', 'Profile image updated');
      }
    } catch (err) {
      console.warn('pick avatar', err);
    }
  };

  const takePhotoAvatar = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return Alert.alert('Permission', 'Permission to access camera is required');
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (!result) return;
      const canceled = result.cancelled || result.canceled;
      if (canceled) return;
      const uri = result.assets ? result.assets[0].uri : result.uri;
      if (uri) {
        await localStore.saveImage(uri);
        setAvatar(uri);
        Alert.alert('Saved', 'Profile image updated');
      }
    } catch (err) {
      console.warn('take avatar photo', err);
    }
  };

  const dumpPublicStorage = async () => {
    try {
      const pub = await storage.load('publicFundraisers', []);
      const SecureStore = require('expo-secure-store');
      const usersRaw = await SecureStore.getItemAsync('auth_users');
      console.log('DEBUG dumpPublicStorage: publicFundraisers count=', (pub||[]).length);
      console.log('DEBUG dumpPublicStorage: publicFundraisers=', pub);
      console.log('DEBUG dumpPublicStorage: usersRaw=', usersRaw);
      Alert.alert('Debug', `publicFundraisers: ${(pub||[]).length}\nusers: ${usersRaw ? JSON.parse(usersRaw) && Object.keys(JSON.parse(usersRaw)).length : 0}`);
    } catch (e) {
      console.warn('dumpPublicStorage failed', e);
      Alert.alert('Debug failed', `${e && e.message ? e.message : String(e)}`);
    }
  };

  const resetPublicprojects = async () => {
    try {
      if (!auth || !auth.user || !auth.user.isAdmin) {
        return Alert.alert('Permission', 'Only admin can reset public fundraisers');
      }
      const raw = (projectsData && projectsData.projects) || [];
      // normalize ingredients similar to ExplorePublic
      const normalized = (raw || []).map(r => {
        const copy = { ...r };
        copy.name = r.name || r.title || r.projectName || r.displayName || 'Untitled Cause';
        copy.ingredients = (r.ingredients || []).map(ing => {
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
            type: ing.type || 'dry',
            label: ing.label || ing.original || ''
          };
        });
        return copy;
      });
      await storage.save('publicFundraisers', normalized || []);
      Alert.alert('Reset', `publicFundraisers replaced with bundled list (${(normalized||[]).length} items)`);
    } catch (e) {
      console.warn('resetPublicprojects failed', e);
      Alert.alert('Reset failed', `${e && e.message ? e.message : String(e)}`);
    }
  };

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportJson, setExportJson] = useState('');

  const exportPublicToJson = async () => {
    try {
      if (!auth || !auth.user || !auth.user.isAdmin) return Alert.alert('Permission', 'Only admin can export public fundraisers');
      const raw = (await storage.load('publicFundraisers', [])) || [];
      const obj = { fundraisers: raw };
      const s = JSON.stringify(obj, null, 2);
      console.log('Export Public JSON:\n', s);
      setExportJson(s);
      setShowExportModal(true);
      Alert.alert('Export ready', 'Public fundraisers JSON is available in the modal and console logs. Copy and paste into fundraisers.json in your project.');
    } catch (e) {
      console.warn('exportPublicToJson failed', e);
      Alert.alert('Export failed', `${e && e.message ? e.message : String(e)}`);
    }
  };

  const exportSavedListsToJson = async () => {
    try {
      if (!auth || !auth.user) return Alert.alert('Permission', 'Please sign in to export your saved lists');
      const raw = (await storage.loadForUser(auth.user, 'savedLists', [])) || [];
      const obj = { savedLists: raw };
      const s = JSON.stringify(obj, null, 2);
      console.log('Export Saved Lists JSON:\n', s);
      setExportJson(s);
      setShowExportModal(true);
      Alert.alert('Export ready', 'Your saved lists JSON is available in the modal and console logs. Copy and paste as needed.');
    } catch (e) {
      console.warn('exportSavedListsToJson failed', e);
      Alert.alert('Export failed', `${e && e.message ? e.message : String(e)}`);
    }
  };

  const handleLogout = async () => {
    if (auth && auth.signOut) {
      await auth.signOut();
    }
    await localStore.setUser(null);
    await localStore.setJwt(null);
    onLogout && onLogout();
    setVisible(false);
  };

  const removeAvatar = async () => {
    await localStore.saveImage(null);
    setAvatar(null);
    Alert.alert('Removed', 'Profile image removed');
  };

  const seedMyprojects = async () => {
    const seed = [
      {
        id: "my-1",
        name: "Food Relief Drive",
        favorite: false,
        tags: ["food", "relief"],
        ingredients: [
          { name: "canned goods (various)", amount: "50", unit: "items", type: "dry", category: "Food" },
          { name: "rice (1kg bags)", amount: "20", unit: "bags", type: "dry", category: "Food" }
        ],
        method: "Collect and distribute non-perishable food items to local shelters.",
        published: false
      },
      {
        id: "my-2",
        name: "Community Garden Project",
        favorite: false,
        tags: ["community", "gardening"],
        ingredients: [
          { name: "seed packets", amount: "30", unit: "packets", type: "dry", category: "Supplies" },
          { name: "gardening tools (shared)", amount: "10", unit: "sets", type: "dry", category: "Supplies" }
        ],
        method: "Establish a community garden plot and recruit volunteers for planting and maintenance.",
        published: false
      },
      {
        id: "my-3",
        name: "School Supplies Fund",
        favorite: false,
        tags: ["education", "fundraising"],
        ingredients: [
          { name: "notebooks", amount: "100", unit: "items", type: "dry", category: "Supplies" },
          { name: "pencils", amount: "200", unit: "items", type: "dry", category: "Supplies" }
        ],
        method: "Raise funds and collect school supplies to distribute to students in need.",
        published: false
      }
    ];
    const userObj = auth && auth.user ? auth.user : null;
    await storage.saveForUser(userObj, 'myFundraisers', seed);
    Alert.alert('Success', 'Added 3 sample fundraisers to My Fundraisers');
  };

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} style={styles.trigger}>
        {avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : <View style={[styles.avatarPlaceholder, { backgroundColor: '#888' }]}><Text style={{ color: '#fff' }}>{(user && user.name && user.name[0]) || 'U'}</Text></View>}
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade">
        <View style={[styles.modalWrap, { backgroundColor: bg }]}> 
          <View style={styles.modalInner}>
            {avatar ? <Image source={{ uri: avatar }} style={styles.largeAvatar} /> : <View style={[styles.largePlaceholder, { backgroundColor: '#888' }]}><Text style={{ color: '#fff' }}>No image</Text></View>}
            <Text style={[styles.username, { color: text }]}>{user ? (user.name || user.email || 'User') : 'Guest'}</Text>
            <View style={styles.row}>
              <TouchableOpacity onPress={pickAvatar} style={[styles.button, { backgroundColor: primary }]}><Text style={{ color: '#fff' }}>Change Image</Text></TouchableOpacity>
              <TouchableOpacity onPress={takePhotoAvatar} style={[styles.button, { backgroundColor: secondary }]}><Text style={{ color: '#fff' }}>Take Photo</Text></TouchableOpacity>
              <TouchableOpacity onPress={removeAvatar} style={[styles.button, { backgroundColor: '#95a5a6' }]}><Text style={{ color: '#fff' }}>Remove Image</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={[styles.button, { backgroundColor: danger }]}><Text style={{ color: '#fff' }}>Logout</Text></TouchableOpacity>
            </View>
            {auth && auth.user && auth.user.isAdmin ? (
              <View style={{ flexDirection: 'column', marginTop: 8, width: '100%' }}>
                <TouchableOpacity onPress={dumpPublicStorage} style={[styles.button, styles.adminButton, { backgroundColor: '#34495e' }]}><Text style={{ color: '#fff' }}>Dump Public Storage</Text></TouchableOpacity>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity onPress={resetPublicprojects} style={[styles.button, styles.adminButtonHalf, { backgroundColor: '#c0392b' }]}><Text style={{ color: '#fff' }}>Reset Public Causes</Text></TouchableOpacity>
                  <TouchableOpacity onPress={exportPublicToJson} style={[styles.button, styles.adminButtonHalf, { backgroundColor: '#8e44ad' }]}><Text style={{ color: '#fff' }}>Export Public Causes JSON</Text></TouchableOpacity>
                </View>
              </View>
            ) : null}
              <View style={{ marginTop: 8, width: '100%' }}>
                <Text style={{ color: text, fontWeight: '700', marginBottom: 6 }}>Theme</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity onPress={async () => { await themePref.setTheme(null); setThemeSelection('system'); }} style={[styles.smallBtn, themeSelection === 'system' ? { backgroundColor: primary } : { backgroundColor: '#eee' }]}><Text style={{ color: themeSelection === 'system' ? '#fff' : '#000' }}>System</Text></TouchableOpacity>
                  <TouchableOpacity onPress={async () => { await themePref.setTheme('light'); setThemeSelection('light'); }} style={[styles.smallBtn, themeSelection === 'light' ? { backgroundColor: primary } : { backgroundColor: '#eee' }]}><Text style={{ color: themeSelection === 'light' ? '#fff' : '#000' }}>Light</Text></TouchableOpacity>
                  <TouchableOpacity onPress={async () => { await themePref.setTheme('dark'); setThemeSelection('dark'); }} style={[styles.smallBtn, themeSelection === 'dark' ? { backgroundColor: primary } : { backgroundColor: '#eee' }]}><Text style={{ color: themeSelection === 'dark' ? '#fff' : '#000' }}>Dark</Text></TouchableOpacity>
                </View>
              </View>
              {auth && auth.user ? (
                <View style={{ marginTop: 8, width: '100%' }}>
                  <TouchableOpacity onPress={exportSavedListsToJson} style={[styles.button, { backgroundColor: '#16a085' }]}><Text style={{ color: '#fff' }}>Export My Saved Lists</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => { setVisible(false); require('expo-router').useRouter().push('/donations'); }} style={[styles.button, { backgroundColor: '#2980b9' }]}><Text style={{ color: '#fff' }}>My Donations</Text></TouchableOpacity>
                </View>
              ) : null}
            
            <TouchableOpacity onPress={() => setVisible(false)} style={styles.close}><Text style={{ color: text }}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={showExportModal} animationType="slide">
        <SafeAreaView style={[{ flex: 1, padding: 12, backgroundColor: bg }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', marginBottom: 8, color: text }}>Exported public causes JSON</Text>
            <TextInput value={exportJson} editable={true} multiline selectTextOnFocus={true} style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 8, color: '#000', backgroundColor: '#fff' }} />
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity onPress={() => { console.log(exportJson); Alert.alert('Copy', 'JSON printed to console. Long-press the text above to copy it, or copy from Metro logs.'); }} style={[styles.button, { backgroundColor: '#27ae60' }]}><Text style={{ color: '#fff' }}>Log & Copy</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowExportModal(false); setExportJson(''); }} style={[styles.button, { backgroundColor: '#95a5a6' }]}><Text style={{ color: '#fff' }}>Close</Text></TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { padding: 4 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  modalWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalInner: { width: '90%', maxWidth: 420, padding: 16, borderRadius: 8, alignItems: 'center' },
  largeAvatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 12 },
  largePlaceholder: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  username: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  button: { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#2ecc71', borderRadius: 8, marginRight: 8, marginBottom: 8, minWidth: 120, alignItems: 'center' },
  adminButton: { width: '100%', minWidth: 0, marginBottom: 8 },
  adminButtonHalf: { flex: 1, minWidth: 0, marginRight: 8 },
  close: { marginTop: 12 },
  smallBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', flex: 1, marginRight: 8 }
});

