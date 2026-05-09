import React, { useEffect, useState, useContext, useCallback } from 'react';
import { View, ActivityIndicator, Alert, TextInput, Button, StyleSheet, Modal, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import FinalList from '../components/FinalList';
import * as storage from '../utils/storage';
import { AuthContext } from '../context/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';

export default function FinalListPage() {
  const [categories, setCategories] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(null);
  const [showTitleInput, setShowTitleInput] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const router = useRouter();
  const auth = useContext(AuthContext);

  const loadFromStorage = useCallback(async () => {
    try {
      // Try to load user-scoped categories first, fall back to global transient keys
      let data = await storage.loadForUser(auth && auth.user ? auth.user : null, 'currentCategories', null);
      if (!data) data = await storage.load('currentCategories', null);
      console.log('final-list: loaded currentCategories keys present=', !!data);
      setCategories(data || {});

      // check if we were navigated here to edit an existing saved list; support both user-scoped and global transient keys
      let edit = await storage.loadForUser(auth && auth.user ? auth.user : null, 'editingTitle', null);
      if (!edit) edit = await storage.load('editingTitle', null);
      console.log('final-list: loaded editingTitle=', edit);
      if (edit) {
        setEditingTitle(edit);
        // clear both user-scoped and transient flags so they don't persist
        await storage.removeForUser(auth && auth.user ? auth.user : null, 'editingTitle');
        await storage.remove('editingTitle');
      }
      // also clear transient categories key if present
      await storage.remove('currentCategories');
    } catch (e) {
      console.warn('final-list load error', e);
      setCategories({});
    } finally {
      setLoading(false);
    }
  }, [auth && auth.user]);

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  useFocusEffect(
    useCallback(() => {
      loadFromStorage();
    }, [loadFromStorage])
  );

  const saveAsNew = async (cats, title) => {
    const lists = await storage.loadForUser(auth && auth.user ? auth.user : null, 'savedLists', []);
    const newLists = [{ title, categories: cats }, ...(lists || [])];
    await storage.saveForUser(auth && auth.user ? auth.user : null, 'savedLists', newLists);
    Alert.alert('Saved', `List saved as "${title}"`);
    router.replace('/NavigationRoot');
  };

  const updateExisting = async (cats, title) => {
    const lists = await storage.loadForUser(auth && auth.user ? auth.user : null, 'savedLists', []);
    const updated = (lists || []).map(l => (l.title === title ? { ...l, categories: cats } : l));
    await storage.saveForUser(auth && auth.user ? auth.user : null, 'savedLists', updated);
    Alert.alert('Updated', `${title} updated`);
    router.replace('/NavigationRoot');
  };

  const handleSavedLists = async (cats) => {
    if (editingTitle) {
      await updateExisting(cats, editingTitle);
      return;
    }
    // otherwise prepare a default title and show the modal input
    setTitleInput(`Donation List ${new Date().toLocaleString()}`);
    setShowTitleInput(true);
  };

  const confirmTitleSave = async () => {
    const title = (titleInput || '').trim() || `Saved ${new Date().toLocaleString()}`;
    const lists = await storage.loadForUser(auth && auth.user ? auth.user : null, 'savedLists', []);
    const exists = (lists || []).find(l => l.title === title);
    if (exists) {
      // allow overwrite or rename (open modal again with existing title)
      Alert.alert('Title exists', 'A list with this title already exists.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Overwrite', onPress: async () => { await updateExisting(categories, title); } },
        { text: 'Rename', onPress: () => {
          // reopen modal with current title prefilled so user can edit
          setTitleInput(title + ' (1)');
          setShowTitleInput(true);
        } },
      ]);
      setShowTitleInput(false);
      return;
    }
    await saveAsNew(categories, title);
    setShowTitleInput(false);
  };

  if (loading) return <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Wrap app with AuthProvider in root layout if not already done; we'll show a Login button in header if needed */}
      <Modal visible={showTitleInput} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalWrap}>
          <View style={styles.modalInner}>
            <TextInput
              value={titleInput}
              onChangeText={setTitleInput}
              placeholder="List title"
              style={styles.input}
              autoFocus
            />
            <View style={styles.row}>
              <Button title="Cancel" onPress={() => setShowTitleInput(false)} />
              <Button title="Save" onPress={confirmTitleSave} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <View style={{ flex: 1, paddingBottom: 20 }}>
        <FinalList categories={categories || {}} onChange={setCategories} handleSavedLists={handleSavedLists} onRequireAuth={() => router.push('/login')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleBox: {
    padding: 12,
    backgroundColor: '#fff8',
  },
  modalWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  modalInner: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});

