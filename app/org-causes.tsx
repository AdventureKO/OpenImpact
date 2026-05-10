import React, { useCallback, useContext, useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, StyleSheet, Alert, Modal, ScrollView } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { AuthContext } from '@/context/AuthContext';
import * as storage from '@/utils/storage';
import FormComponent from '@/components/FormComponent';
import RenderListItem from '@/components/RenderListItem';

export default function OrgCausesScreen() {
  const auth = useContext(AuthContext);
  const navigation = useNavigation();
  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const [causes, setCauses] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    const stored = (await storage.loadForUser(auth?.user ?? null, 'myFundraisers', [])) || [];
    setCauses(stored);
  }, [auth?.user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = (id: string | number) => {
    Alert.alert('Delete cause', 'Remove this cause from your list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const stored = (await storage.loadForUser(auth?.user ?? null, 'myFundraisers', [])) || [];
          const toDelete = stored.find((r: any) => String(r.id) === String(id));
          const next = stored.filter((r: any) => String(r.id) !== String(id));
          await storage.saveForUser(auth?.user ?? null, 'myFundraisers', next);
          setCauses(next);
          try {
            if (toDelete?.published) {
              const pub = (await storage.load('publicFundraisers', [])) || [];
              await storage.save(
                'publicFundraisers',
                pub.filter((r: any) => String(r.id) !== String(id))
              );
            }
          } catch (e) {
            console.warn(e);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: bg }]}>
      <View style={styles.top}>
        <Text style={[styles.title, { color: text }]}>My causes</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ New cause</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={causes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={<Text style={{ color: text, padding: 12 }}>No causes yet. Tap “New cause” to create one.</Text>}
        renderItem={({ item }) => (
          <RenderListItem
            item={item}
            owned
            deleteLabel="✕"
            deleteItem={handleDelete}
            handleEdit={(editId) =>
              navigation.navigate('OrgCauseDetail' as never, { id: String(editId) } as never)
            }
            onPress={() => navigation.navigate('OrgCauseDetail' as never, { id: String(item.id) } as never)}
          />
        )}
      />

      <Modal visible={showAdd} animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
          <View style={styles.modalBar}>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={{ color: '#2563eb', fontWeight: '700' }}>Close</Text>
            </TouchableOpacity>
            <Text style={{ fontWeight: '700', color: text }}>Create cause</Text>
            <View style={{ width: 48 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 12 }}>
            <FormComponent
              onSaved={async () => {
                await load();
                setShowAdd(false);
              }}
              onRequireAuth={() => Alert.alert('Sign in required')}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12 },
  title: { fontSize: 20, fontWeight: '800' },
  addBtn: { backgroundColor: '#2563eb', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  modalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
});
