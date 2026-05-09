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

export default function MyprojectsScreen() {
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
      router.push(`/edit-fundraiser/${id}`);
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
        <TouchableOpacity onPress={() => router.replace('/NavigationRoot')} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={{ color: text }}>◀ Back</Text>
        </TouchableOpacity>
        <Text style={{ color: text, fontWeight: '700' }}>My Causes</Text>
        <TouchableOpacity
          onPress={() => { console.log('button pressed'); handleAdd(); }}
          activeOpacity={0.6}
          style={[styles.btnAdd, { borderColor: tint, borderWidth: 1 }]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={{ color: text, fontWeight: '600' }}>Add Cause</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, paddingBottom: 20 }}>
        {myprojects.length > 0 ? (
          <FlatList data={myprojects} keyExtractor={i => String(i.id)} contentContainerStyle={{ padding: 12 }} renderItem={({ item }) => (
            <RenderListItem item={item} owned={true} deleteItem={() => handleDelete(item.id)} handleEdit={() => handleEdit(item.id)} addToFavorites={() => {}} removeFromFavorites={() => {}} onPress={(r) => router.push(`/fundraiser/${r.id}`)} />
          )} />
        ) : (
          <Text style={{ color: text, padding: 12 }}>No causes available.</Text>
        )}
      </View>
    </SafeAreaView>
    <Modal visible={showAddModal} animationType="slide">
      <SafeAreaView style={[styles.wrap, { backgroundColor: bg }]}> 
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12 }}>
          <Text style={{ fontWeight: '700', fontSize: 18, color: text }}>Add Cause</Text>
          <TouchableOpacity onPress={() => setShowAddModal(false)} style={{ padding: 8 }}><Text style={{ color: tint }}>Close</Text></TouchableOpacity>
        </View>
        <FormComponent onSaved={async () => {
          setShowAddModal(false);
          try {
            const storage = await import('../utils/storage');
            const stored = await storage.loadForUser(auth && auth.user ? auth.user : null, 'myFundraisers', []);
            setMyprojects(stored || []);
          } catch (err) {
            console.warn('Failed reloading myFundraisers after save', err);
          }
        }} onRequireAuth={() => setShowLoginModal(true)} />
      </SafeAreaView>
    </Modal>
    <Modal visible={showEditModal} animationType="slide">
      <SafeAreaView style={[styles.wrap, { backgroundColor: bg }]}> 
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12 }}>
          <Text style={{ fontWeight: '700', fontSize: 18, color: text }}>Edit Cause</Text>
          <TouchableOpacity onPress={() => setShowEditModal(false)} style={{ padding: 8 }}><Text style={{ color: tint }}>Close</Text></TouchableOpacity>
        </View>
        <FormComponent initialproject={editproject} onSaved={async () => {
          setShowEditModal(false);
          setEditproject(null);
          try {
            const storage = await import('../utils/storage');
            const stored = await storage.loadForUser(auth && auth.user ? auth.user : null, 'myFundraisers', []);
            setMyprojects(stored || []);
          } catch (err) {
            console.warn('Failed reloading myFundraisers after edit', err);
          }
        }} onRequireAuth={() => { setShowEditModal(false); setShowLoginModal(true); }} />
      </SafeAreaView>
    </Modal>
    <Modal visible={showLoginModal} animationType="slide">
      <SafeAreaView style={[styles.wrap, { backgroundColor: bg }]}> 
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12 }}>
          <Text style={{ fontWeight: '700', fontSize: 18, color: text }}>Login</Text>
          <TouchableOpacity onPress={() => setShowLoginModal(false)} style={{ padding: 8 }}><Text style={{ color: tint }}>Close</Text></TouchableOpacity>
        </View>
        <LoginScreen onSuccess={() => setShowLoginModal(false)} onRegister={() => { setShowLoginModal(false); setShowRegisterModal(true); }} />
      </SafeAreaView>
    </Modal>
    <Modal visible={showRegisterModal} animationType="slide">
      <SafeAreaView style={[styles.wrap, { backgroundColor: bg }]}> 
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12 }}>
          <Text style={{ fontWeight: '700', fontSize: 18, color: text }}>Create account</Text>
          <TouchableOpacity onPress={() => setShowRegisterModal(false)} style={{ padding: 8 }}><Text style={{ color: tint }}>Close</Text></TouchableOpacity>
        </View>
        {React.createElement(require('./register').default)}
      </SafeAreaView>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  btn: { marginLeft: 8 },
  backBtn: { paddingHorizontal: 8, paddingVertical: 6 }
  ,
  tabBtn: { paddingHorizontal: 12, paddingVertical: 6, marginHorizontal: 4, borderRadius: 6, borderWidth: 1, borderColor: 'transparent' },
  tabActive: { backgroundColor: '#e6e6e6' },
  btnAdd: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }
});

