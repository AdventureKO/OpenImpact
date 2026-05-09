import React, { useContext } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { NotificationContext } from '../context/NotificationContext';
import { useNavigation } from '@react-navigation/native';
import { useThemeColor } from '../hooks/use-theme-color';

export default function NotificationsScreen() {
  const { notifications, markRead, clearAll } = useContext(NotificationContext);
  const navigation = useNavigation();
  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');

  const renderItem = ({ item }) => (
    <View style={[styles.row, item.read ? { opacity: 0.6 } : {}]}>
      <TouchableOpacity onPress={() => { markRead(item.id); Alert.alert(item.title || 'Notification', item.body || ''); }} style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700' }}>{item.title || 'Notice'}</Text>
        <Text>{item.body || ''}</Text>
        <Text style={{ fontSize: 12, color: '#666' }}>{new Date(item.createdAt).toLocaleString()}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={async () => {
        try {
          if (item.link && (String(item.link).startsWith('http://') || String(item.link).startsWith('https://'))) {
            await Linking.openURL(item.link);
          } else if (item.link) {
            // try navigation by route name
            try { navigation.navigate(item.link); } catch (e) { Alert.alert('Open', `Can't open: ${item.link}`); }
          } else {
            Alert.alert('Notification', 'No link available');
          }
        } catch (e) { console.warn('open notification link', e); Alert.alert('Open failed', String(e)); }
      }} style={styles.openBtn}><Text style={{ color: '#fff' }}>Open</Text></TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ padding: 16, paddingTop: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
              <Text style={{ color: '#007aff' }}>← Back</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 22, fontWeight: '700', color: text }}>Notifications</Text>
          </View>
          <TouchableOpacity onPress={() => clearAll()} style={{ backgroundColor: '#95a5a6', padding: 8, borderRadius: 8 }}><Text style={{ color: '#fff' }}>Clear</Text></TouchableOpacity>
        </View>
        {(!notifications || notifications.length === 0) ? <Text style={{ color: text }}>No notifications</Text> : (
          <FlatList data={notifications} keyExtractor={n => n.id} renderItem={renderItem} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  openBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2980b9',
    borderRadius: 6,
  }
});

