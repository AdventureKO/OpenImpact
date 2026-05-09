import React, { useState } from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { useThemeColor } from '../hooks/use-theme-color';

export default function EditableTextItem({ initialText = '', onSave }) {
  const [value, setValue] = useState(initialText);
  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const border = useThemeColor({}, 'icon');

  return (
    <TextInput
      value={value}
      onChangeText={setValue}
      onEndEditing={() => onSave && onSave(value)}
      style={[styles.input, { backgroundColor: bg, color: text, borderColor: border }]}
    />
  )
}

const styles = StyleSheet.create({ input: { borderWidth: 1, padding: 6, borderRadius: 6, minWidth: 80 } });

