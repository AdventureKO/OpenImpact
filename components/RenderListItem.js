import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useThemeColor } from '../hooks/use-theme-color';
import { Fonts } from '../constants/theme';

export default function RenderListItem({ item, isFavorite, deleteItem, addToFavorites, removeFromFavorites, handleEdit, onPress, deleteLabel = '✕', owned = false }) {
  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');
  const border = useThemeColor({}, 'icon');
  const primary = useThemeColor({}, 'primary');
  const surface = useThemeColor({}, 'surface');

  return (
    <TouchableOpacity onPress={() => onPress && onPress(item)} style={[styles.container, { backgroundColor: surface, borderColor: border, ...(Platform.OS === 'android' ? { elevation: 3 } : {}), }]}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, { backgroundColor: '#ffffff' }]} />
      )}
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={[styles.name, { color: text, fontFamily: Fonts.rounded || undefined }]} numberOfLines={1}>{item.name}</Text>
        {item.tags && (item.tags || []).length > 0 ? (
          <Text style={{ color: useThemeColor({}, 'secondary'), fontSize: 12, marginTop: 4 }}>{(item.tags || []).slice(0,3).join(', ')}</Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        {handleEdit && (!item.published || owned) ? (
          <TouchableOpacity onPress={() => { console.log('RenderListItem: edit pressed', item.id); handleEdit && handleEdit(item.id); }} style={[styles.actionBtn, styles.editBtn]}><Text style={[styles.actionText, { color: tint, fontSize: 20 }]}>✎</Text></TouchableOpacity>
        ) : isFavorite ? (
          <TouchableOpacity onPress={() => removeFromFavorites && removeFromFavorites(item)} style={styles.actionBtn}><Text style={[styles.actionText, { color: primary }]}>★</Text></TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => addToFavorites && addToFavorites(item)} style={styles.actionBtn}><Text style={[styles.actionText, { color: primary }]}>☆</Text></TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => deleteItem && deleteItem(item.id)} style={styles.actionBtn}><Text style={[styles.actionText, { color: 'crimson' }]}>{deleteLabel}</Text></TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderWidth: 1, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 4 },
  thumb: { width: 56, height: 44, borderRadius: 6, resizeMode: 'cover' },
  name: { fontSize: 17, fontWeight: '700', flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { marginLeft: 12 },
  editBtn: { padding: 8, borderRadius: 8 },
  actionText: { fontSize: 16 }
});

