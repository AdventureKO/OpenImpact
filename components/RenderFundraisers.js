import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import RenderListItem from './RenderListItem';
import * as localStore from '../utils/localStorage';
import { useThemeColor } from '../hooks/use-theme-color';
import { useRouter } from 'expo-router';

export default function RenderFundraisers({ projects = [], createIngredientsList, handleDeleteproject, handleAddToFavorites, handleRemoveFromFavorites, handleSavedLists, isFavorite }) {
  const [savedLists, setSavedLists] = useState([]);
  const [show, setShow] = useState(false);
  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const lists = await localStore.getSavedListsFromStore();
      setSavedLists(lists || []);
    })();
  }, [show]);

  const openSaved = async (title) => {
    const found = savedLists.find(s => s.title === title);
    if (found) {
      await handleSavedLists(found.categories);
      router.push('/final-list');
    }
  };

  const deleteSaved = async (title) => {
    const filtered = await localStore.deleteListFromStore(title);
    setSavedLists(filtered || []);
  };

  return (
    <View style={{ flex: 1 }}>
      <Modal visible={show} animationType="slide" transparent>
        <View style={[styles.modalWrap, { backgroundColor: bg }]}> 
          <View style={styles.modalInner}>
            <Text style={[styles.modalTitle, { color: text }]}>Saved Donation Lists</Text>
            <FlatList
              data={savedLists}
              keyExtractor={i => i.title}
              renderItem={({ item }) => (
              <View style={styles.savedRow}>
                <Text style={{ color: text }}>{item.title}</Text>
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity onPress={() => openSaved(item.title)} style={styles.iconBtn}><Text style={{ color: text }}>Open</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteSaved(item.title)} style={styles.iconBtn}><Text style={{ color: 'crimson' }}>Delete</Text></TouchableOpacity>
                </View>
              </View>
            )}
              ListEmptyComponent={() => <Text style={{ color: text }}>No saved donation lists</Text>}
            />
            <TouchableOpacity onPress={() => setShow(false)} style={styles.close}><Text style={{ color: text }}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/')}>
        <Text style={{ color: text }}>◀ Add More</Text>
      </TouchableOpacity>

      <FlatList data={projects} keyExtractor={(i) => String(i.id)} contentContainerStyle={{ padding: 12 }} renderItem={({ item }) => (
        <RenderListItem item={item} isFavorite={isFavorite ? isFavorite(item.id) : false} deleteItem={handleDeleteproject} addToFavorites={() => handleAddToFavorites && handleAddToFavorites(item)} removeFromFavorites={() => handleRemoveFromFavorites && handleRemoveFromFavorites(item)} />
      )} />

      <View style={styles.footerRow}>
        <TouchableOpacity style={[styles.footerBtn, { backgroundColor: '#2ecc71' }]} onPress={() => { createIngredientsList && createIngredientsList(projects); router.push('/final-list'); }}><Text style={{ color: '#fff' }}>Generate Donation List</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.footerBtn, { backgroundColor: '#f39c12' }]} onPress={() => setShow(true)}><Text style={{ color: '#fff' }}>Saved Donation Lists</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalInner: { width: 320, maxHeight: 420, padding: 12, borderRadius: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  savedRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#ddd' },
  iconBtn: { marginLeft: 12 },
  close: { marginTop: 12, alignSelf: 'center' },
  backBtn: { padding: 12 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  footerBtn: { padding: 12, borderRadius: 8, width: '48%', alignItems: 'center' }
});

