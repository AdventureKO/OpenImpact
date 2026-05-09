import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, SafeAreaView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useThemeColor } from '../hooks/use-theme-color';
import * as storage from '../utils/storage';

export default function DonateScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = (route.params || {});
  const auth = useContext(AuthContext);
  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const primary = useThemeColor({}, 'primary');

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleDonate = async () => {
    const n = parseFloat(String(amount).replace(/[^0-9.]/g, ''));
    if (!n || n <= 0) return Alert.alert('Validation', 'Please enter a valid donation amount');
    setProcessing(true);
    try {
      // Route to mock payment confirmation screen with params
      navigation.navigate('DonateConfirm', { projectId: id || null, amount: String(n), note: String(note || '') });
    } catch (e) {
      console.warn('donate failed', e);
      Alert.alert('Error', 'Could not record donation');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: bg }, styles.wrap]}>
      <View style={{ padding: 16 }}>
        <Text style={[styles.title, { color: text }]}>Donate</Text>
        <Text style={{ color: text, marginBottom: 8 }}>Project ID: {id || '—'}</Text>
        <TextInput keyboardType="numeric" placeholder="Amount (e.g. 50)" placeholderTextColor="#888" value={amount} onChangeText={setAmount} style={[styles.input, { color: text }]} />
        <TextInput placeholder="Message (optional)" placeholderTextColor="#888" value={note} onChangeText={setNote} style={[styles.textarea, { color: text }]} multiline />
        <View style={{ height: 12 }} />
        <TouchableOpacity onPress={handleDonate} disabled={processing} style={[styles.donateBtn, { backgroundColor: primary }]}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{processing ? 'Processing...' : 'Donate (mock)'}</Text>
        </TouchableOpacity>
        <View style={{ height: 12 }} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.btn, { backgroundColor: '#95a5a6' }]}>
          <Text style={{ color: '#fff' }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginBottom: 8, backgroundColor: 'transparent' },
  textarea: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, height: 120, textAlignVertical: 'top', backgroundColor: 'transparent' },
  donateBtn: { padding: 12, borderRadius: 8, alignItems: 'center' },
  btn: { padding: 10, borderRadius: 8, alignItems: 'center' }
});

