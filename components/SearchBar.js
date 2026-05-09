import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useThemeColor } from '../hooks/use-theme-color';

export default function SearchBar({ value, onChange, favoritesOnly, onToggleFavorites }) {
  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');
  const favOnColor = tint === '#fff' ? '#f39c12' : tint;
  const placeholderColor = (text === '#000' || text === '#000000') ? '#666' : '#ccc';
  return (
    <View style={[styles.row, { backgroundColor: bg }]}> 
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Search causes..."
        placeholderTextColor={placeholderColor}
        style={[styles.input, { backgroundColor: bg, color: text, borderColor: '#888' }]}
      />
      <TouchableOpacity onPress={onToggleFavorites} style={[styles.favBtn, favoritesOnly ? { backgroundColor: favOnColor } : { backgroundColor: '#888' }] }>
        <Text style={{ color: '#fff' }}>{favoritesOnly ? '★' : '☆'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 8, marginRight: 8, backgroundColor: '#fff' },
  favBtn: { padding: 10, backgroundColor: '#999', borderRadius: 8 },
  favOn: { backgroundColor: '#f39c12' },
});

