import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Modal } from 'react-native';
import FormComponent from '../components/FormComponent';
import LoginScreen from './login';
import projectsData from '../fundraisers.json';
import RenderListItem from '../components/RenderListItem';
import { useRouter } from 'expo-router';
import { AuthContext } from '../context/AuthContext';
import { useThemeColor } from '../hooks/use-theme-color';

export default function MyFundraisersScreen() {
  const [myprojects, setMyprojects] = useState([]);
  const router = useRouter();
  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');

  const auth = useContext(AuthContext);
  useEffect(() => {
    (async () => {
      const storage = await import('../utils/storage');
      const stored = await storage.loadForUser(auth && auth.user ? auth.user : null, 'myFundraisers', []);
      setMyprojects(stored || []);
    })();
  }, [auth && auth.user]);

  const handleEdit = (id) => {
    console.log('my-projects: handleEdit', id);
    const found = myprojects.find(r => String(r.id) === String(id));
    if (found) {
      setEditproject(found);
      setShowEditModal(true);
    } else {
      // fallback to route if not present in local state
      router.push(`/edit-project/${id}`);
    }
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editproject, setEditproject] = useState(null);

  const handleAdd = () => {
    console.log('handleAdd fired - opening modal');
    setShowAddModal(true);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Are you sure you want to delete?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const storage = await import('../utils/storage');
        const stored = await storage.loadForUser(auth && auth.user ? auth.user : null, 'myFundraisers', []);
        const toDelete = (stored || []).find(r => r.id === id);
        const nextStored = (stored || []).filter(r => r.id !== id);
        await storage.saveForUser(auth && auth.user ? auth.user : null, 'myFundraisers', nextStored);
        setMyprojects(nextStored);
        // if the deleted project was published, also remove it from global publicFundraisers
        try {
          if (toDelete && toDelete.published) {
            const pub = await storage.load('publicFundraisers', []);
            const nextPub = (pub || []).filter(r => String(r.id) !== String(id));
            await storage.save('publicFundraisers', nextPub);
            console.log('my-projects: removed deleted published fundraiser from publicFundraisers id=', id);
          }
        } catch (e) {
          console.warn('Failed to remove deleted fundraiser from publicFundraisers', e);
        }
      } }
    ]);
  };

  return (
    <>
    <SafeAreaView style={[styles.wrap, { backgroundColor: bg }]}> 
      <View style={styles.rowTop}>
        <Text style={{ color: text, fontWeight: '700' }}>My Fundraisers</Text>
      </View>
      <View style={styles.content}>
        {myprojects.length > 0 ? (
          <FlatList data={myprojects} keyExtractor={i => String(i.id)} contentContainerStyle={{ padding: 12 }} renderItem={({ item }) => (
            <RenderListItem item={item} />
          )} />
        ) : (
          <Text style={{ color: text }}>No items yet.</Text>
        )}
      </View>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({ wrap: { flex: 1 }, rowTop: { padding: 12 }, content: { flex: 1 } });

