import React, { useState, useContext } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useThemeColor } from '../../hooks/use-theme-color';
import { AuthContext } from '../../context/AuthContext';
import * as storage from '../../utils/storage';
import { NotificationContext } from '../../context/NotificationContext';

export default function ConfirmDonation() {
  const route = useRoute();
  const navigation = useNavigation();
  const { projectId, amount, note } = (route.params || {});
  const auth = useContext(AuthContext);
  const { pushNotification } = React.useContext(NotificationContext);
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [name, setName] = useState((auth && auth.user && (auth.user.name || auth.user.email)) || 'Donor');
  const [processing, setProcessing] = useState(false);
  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const border = useThemeColor({}, 'icon');

  const doPayment = async () => {
    setProcessing(true);
    try {
      // Mock payment delay
      await new Promise(res => setTimeout(res, 1500));
      // On success, record donation and receipt (similar to previous logic)
      const donation = {
        id: `don-${Date.now()}`,
        projectId: projectId || null,
        amount: parseFloat(String(amount || '0')) || 0,
        note: note || '',
        createdAt: new Date().toISOString(),
        donor: auth && auth.user ? { id: auth.user.id || auth.user.email || 'user', name: auth.user.name || auth.user.email } : { id: 'anon', name }
      };

      if (auth && auth.user) {
        const existing = (await storage.loadForUser(auth.user, 'donations', [])) || [];
        await storage.saveForUser(auth.user, 'donations', [donation, ...existing]);
      } else {
        const anon = (await storage.load('anonDonations', [])) || [];
        await storage.save('anonDonations', [donation, ...anon]);
      }

      const receipt = {
        id: `rcpt-${Date.now()}`,
        donationId: donation.id,
        projectId: donation.projectId,
        amount: donation.amount,
        donor: donation.donor,
        note: donation.note,
        createdAt: donation.createdAt
      };

      if (auth && auth.user) {
        const existingReceipts = (await storage.loadForUser(auth.user, 'receipts', [])) || [];
        await storage.saveForUser(auth.user, 'receipts', [receipt, ...existingReceipts]);
      } else {
        const anonReceipts = (await storage.load('anonReceipts', [])) || [];
        await storage.save('anonReceipts', [receipt, ...anonReceipts]);
      }

      Alert.alert('Payment successful', `Recorded donation of $${donation.amount}`);
      try {
        pushNotification({ title: 'Donation received', body: `Thank you for donating $${donation.amount}`, link: `/receipt?id=${receipt.id}` });
      } catch (e) { console.warn('push notification failed', e); }
      navigation.replace('Receipt', { id: receipt.id });
    } catch (e) {
      console.warn('mock payment failed', e);
      Alert.alert('Payment failed', 'Mock payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ padding: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 12 }}>
          <Text style={{ color: '#007aff' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 8, color: text }}>Confirm Payment</Text>
        <Text style={{ marginBottom: 6, color: text }}>Project: {projectId || '—'}</Text>
        <Text style={{ marginBottom: 6, color: text }}>Amount: ${amount || '0'}</Text>
        <TextInput value={cardNumber} onChangeText={setCardNumber} placeholder="Card number" placeholderTextColor={'#888'} style={{ borderWidth: 1, borderColor: border, padding: 8, borderRadius: 8, marginBottom: 8, color: text, backgroundColor: bg }} />
        <TextInput value={name} onChangeText={setName} placeholder="Name on card" placeholderTextColor={'#888'} style={{ borderWidth: 1, borderColor: border, padding: 8, borderRadius: 8, marginBottom: 8, color: text, backgroundColor: bg }} />
        <TouchableOpacity onPress={doPayment} disabled={processing} style={{ backgroundColor: '#27ae60', padding: 12, borderRadius: 8, alignItems: 'center' }}>
          {processing ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Confirm Payment (mock)</Text>}
        </TouchableOpacity>
        <View style={{ height: 12 }} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: '#95a5a6', padding: 10, borderRadius: 8, alignItems: 'center' }}><Text style={{ color: '#fff' }}>Cancel</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

