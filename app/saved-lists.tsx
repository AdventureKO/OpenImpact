import React, { useEffect, useState, useContext, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Platform, Modal, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as storage from '../utils/storage';
import { AuthContext } from '../context/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { useThemeColor } from '../hooks/use-theme-color';
import FinalList from '../components/FinalList';

export default function SavedListsScreen() {
  const [lists, setLists] = useState([]);
  const router = useRouter();
  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const auth = useContext(AuthContext);

  const loadSaved = useCallback(async () => {
    try {
      console.log('saved-lists: loading saved lists for', auth && auth.user ? (auth.user.email || auth.user.id || auth.user.name) : 'guest');
      let saved = await storage.loadForUser(auth && auth.user ? auth.user : null, 'savedLists', null);
      if (!saved) {
        // fallback to global/transient key
        saved = await storage.load('savedLists', []);
        if (saved && saved.length) console.log('saved-lists: loaded fallback global savedLists count=', saved.length);
      } else {
        console.log('saved-lists: loaded user savedLists count=', (saved || []).length);
      }
      setLists(saved || []);
    } catch (e) {
      console.warn('saved-lists: load error', e);
      setLists([]);
    }
  }, [auth && auth.user]);

  useEffect(() => { loadSaved(); }, [loadSaved]);

  useFocusEffect(
    useCallback(() => {
      loadSaved();
    }, [loadSaved])
  );

  const openList = async (item) => {
    console.log('saved-lists: openList saving editingTitle and categories for', item && item.title);
    // mark that we're editing an existing saved list so final-list can update instead of create
    await storage.saveForUser(auth && auth.user ? auth.user : null, 'editingTitle', item.title);
    await storage.saveForUser(auth && auth.user ? auth.user : null, 'currentCategories', item.categories);
    // also write transient global keys so navigation works regardless of user scoping
    await storage.save('editingTitle', item.title);
    await storage.save('currentCategories', item.categories);
    console.log('saved-lists: opening inline editor for', item.title);
    // open inline modal editor (safer than navigating to ensure focus)
    setEditTitle(item.title);
    setEditCategories(item.categories || {});
    setEditVisible(true);
  };

  const deleteList = async (title) => {
    const filtered = lists.filter(l => l.title !== title);
    await storage.saveForUser(auth && auth.user ? auth.user : null, 'savedLists', filtered);
    setLists(filtered);
    Alert.alert('Deleted', `${title} deleted`);
  };

  const [renameVisible, setRenameVisible] = useState(false);
  const [renameTargetTitle, setRenameTargetTitle] = useState(null);
  const [renameInput, setRenameInput] = useState('');
  const [editVisible, setEditVisible] = useState(false);
  const [editCategories, setEditCategories] = useState({});
  const [editTitle, setEditTitle] = useState(null);

  const openRename = (item) => {
    setRenameTargetTitle(item.title);
    setRenameInput(item.title || '');
    setRenameVisible(true);
  };

  const openTitleActions = (item) => {
    Alert.alert(item.title || 'List', undefined, [
      { text: 'Edit', onPress: () => openList(item) },
      { text: 'Rename', onPress: () => openRename(item) },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const confirmRename = async () => {
    const newTitle = (renameInput || '').trim();
    if (!newTitle) return Alert.alert('Validation', 'Please enter a title');
    try {
      const listsUser = await storage.loadForUser(auth && auth.user ? auth.user : null, 'savedLists', []);
      // check for conflict
      if ((listsUser || []).some(l => l.title === newTitle && l.title !== renameTargetTitle)) {
        return Alert.alert('Conflict', 'A list with that title already exists');
      }
      const updated = (listsUser || []).map(l => l.title === renameTargetTitle ? { ...l, title: newTitle } : l);
      await storage.saveForUser(auth && auth.user ? auth.user : null, 'savedLists', updated);
      // also update global/transient savedLists if present
      const globalLists = await storage.load('savedLists', []);
      const updatedGlobal = (globalLists || []).map(l => l.title === renameTargetTitle ? { ...l, title: newTitle } : l);
      await storage.save('savedLists', updatedGlobal);
      // update any transient editingTitle keys
      const editUser = await storage.loadForUser(auth && auth.user ? auth.user : null, 'editingTitle', null);
      if (editUser === renameTargetTitle) await storage.saveForUser(auth && auth.user ? auth.user : null, 'editingTitle', newTitle);
      const editGlobal = await storage.load('editingTitle', null);
      if (editGlobal === renameTargetTitle) await storage.save('editingTitle', newTitle);
      setRenameVisible(false);
      setRenameTargetTitle(null);
      setRenameInput('');
      await loadSaved();
      Alert.alert('Renamed', `List renamed to "${newTitle}"`);
    } catch (e) {
      console.warn('saved-lists: rename error', e);
      Alert.alert('Error', 'Could not rename list');
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{flex:1, backgroundColor: bg}}>
      <View style={{ padding: 12, paddingTop: Platform.OS === 'android' ? 24 : 12 }}>
        <Text style={{fontSize:18, fontWeight:'700', marginBottom:8, color: '#fff'}}>Saved Lists</Text>
      <FlatList
        data={lists}
        keyExtractor={(i) => i.title}
        renderItem={({item}) => (
          <View style={{flexDirection:'row', alignItems:'center', paddingVertical:8}}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <TouchableOpacity onPress={() => openTitleActions(item)} style={{ flex: 1 }}>
                <Text numberOfLines={1} ellipsizeMode="tail" style={{fontSize:16, color: text}}>{item.title}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 80, justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => deleteList(item.title)}>
                <Text style={{color:'#ff6666'}}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={() => <Text style={{color:'#fff'}}>No saved lists</Text>}
      />
      {/* Rename modal */}
      <Modal visible={renameVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontWeight: '700', marginBottom: 8 }}>Rename List</Text>
            <TextInput value={renameInput} onChangeText={setRenameInput} placeholder="New title" style={styles.renameInput} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
              <TouchableOpacity onPress={() => { setRenameVisible(false); setRenameTargetTitle(null); setRenameInput(''); }} style={{ marginRight: 8 }}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={confirmRename}><Text style={{ fontWeight: '700' }}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Inline edit modal */}
      <Modal visible={editVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12 }}>
            <Text style={{ fontWeight: '700', fontSize: 18 }}>Edit List</Text>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity onPress={async () => { setEditVisible(false); setEditTitle(null); setEditCategories({}); await loadSaved(); }} style={{ padding: 8 }}><Text style={{ color: '#fff' }}>Close</Text></TouchableOpacity>
            </View>
          </View>
          <FinalList
            categories={editCategories || {}}
            onChange={(c) => setEditCategories(c)}
            handleSavedLists={async (cats) => {
              try {
                const lists = await storage.loadForUser(auth && auth.user ? auth.user : null, 'savedLists', []);
                const updated = (lists || []).map(l => (l.title === editTitle ? { ...l, categories: cats } : l));
                await storage.saveForUser(auth && auth.user ? auth.user : null, 'savedLists', updated);
                // also update global
                const g = await storage.load('savedLists', []);
                const ug = (g || []).map(l => (l.title === editTitle ? { ...l, categories: cats } : l));
                await storage.save('savedLists', ug);
                setEditVisible(false);
                setEditTitle(null);
                setEditCategories({});
                await loadSaved();
                Alert.alert('Updated', `${editTitle} updated`);
              } catch (e) {
                console.warn('saved-lists: inline save error', e);
                Alert.alert('Error', 'Could not save list');
              }
            }}
            onRequireAuth={() => router.push('/login')}
          />
        </SafeAreaView>
      </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { width: '90%', maxWidth: 520, padding: 16, backgroundColor: '#fff', borderRadius: 8 },
  renameInput: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6 },
});

