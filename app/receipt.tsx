import React, { useState, useEffect, useContext } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as storage from '../utils/storage';
import { AuthContext } from '../context/AuthContext';
import { useThemeColor } from '../hooks/use-theme-color';

export default function ReceiptScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = (route.params || {});
  const [receipt, setReceipt] = useState(null);

  const auth = useContext(AuthContext);

  useEffect(() => {
    (async () => {
      try {
        const all = (await storage.loadForUser(null, 'receipts', [])) || [];
        const anon = (await storage.load('anonReceipts', [])) || [];
        const found = (all || []).find(r => String(r.id) === String(id)) || (anon || []).find(r => String(r.id) === String(id));
        setReceipt(found || null);
      } catch (e) {
        console.warn('load receipt failed', e);
      }
    })();
  }, [id]);

  const exportJson = async () => {
    try {
      const s = JSON.stringify(receipt || {}, null, 2);
      console.log('Receipt JSON:\n', s);
      Alert.alert('Export', 'Receipt JSON printed to console. Copy from logs.');
    } catch (e) {
      console.warn('export failed', e);
      Alert.alert('Export failed');
    }
  };

  const savePdf = async () => {
    try {
      const Print = require('expo-print');
      const Sharing = require('expo-sharing');
      const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1" /><style>body{font-family: -apple-system,BlinkMacSystemFont,'Segoe UI', Roboto, 'Helvetica Neue', Arial; padding:20px; color:#111} .header{display:flex;align-items:center;justify-content:space-between} h1{font-size:22px;margin:0} .meta{margin-top:12px} .row{margin-bottom:8px} .box{border:1px solid #e6e6e6;padding:12px;border-radius:8px;margin-top:12px} table{width:100%;border-collapse:collapse;margin-top:8px} td{padding:6px;border-bottom:1px solid #f1f1f1}</style></head><body><div class="header"><h1>Charity with Confidence</h1><div><strong>Receipt</strong><div style="font-size:12px;color:#666">${receipt.createdAt}</div></div></div><div class="meta"><div class="row"><strong>Receipt ID:</strong> ${receipt.id}</div><div class="row"><strong>Donation ID:</strong> ${receipt.donationId}</div><div class="row"><strong>Project:</strong> ${receipt.projectId || '—'}</div></div><div class="box"><h3 style="margin-top:0">Donation Details</h3><table><tr><td><strong>Amount</strong></td><td>$${receipt.amount}</td></tr><tr><td><strong>Donor</strong></td><td>${receipt.donor && (receipt.donor.name || receipt.donor.id) || 'Anonymous'}</td></tr><tr><td><strong>Message</strong></td><td>${receipt.note || '—'}</td></tr></table></div><div style="margin-top:18px;font-size:12px;color:#666">Thank you for supporting causes through Charity with Confidence. This receipt is for your records.</div></body></html>`;
      const { uri } = await Print.printToFileAsync({ html });
      if (!uri) return Alert.alert('PDF', 'Could not generate PDF');
      // Attach the PDF path to the stored receipt record so it can be re-used later
      const pdfUri = uri;

      // Update receipt in storage (user receipts or anonReceipts)
      try {
        // if current auth user matches receipt donor id/email, update their receipts
        const user = auth && auth.user;
        let updated = false;
        if (user) {
          const existing = (await storage.loadForUser(user, 'receipts', [])) || [];
          const next = existing.map(r => {
            if (String(r.id) === String(receipt.id)) { updated = true; return { ...r, pdfUri }; }
            return r;
          });
          if (updated) await storage.saveForUser(user, 'receipts', next);
        }

        if (!updated) {
          const anon = (await storage.load('anonReceipts', [])) || [];
          const nextAnon = anon.map(r => (String(r.id) === String(receipt.id) ? { ...r, pdfUri } : r));
          const foundInAnon = nextAnon.some(r => String(r.id) === String(receipt.id));
          if (foundInAnon) {
            await storage.save('anonReceipts', nextAnon);
            updated = true;
          }
        }

        // Fallback: if not found in either list, try to update generic 'receipts' key
        if (!updated) {
          const generic = (await storage.loadForUser(null, 'receipts', [])) || [];
          const nextGen = generic.map(r => (String(r.id) === String(receipt.id) ? { ...r, pdfUri } : r));
          if (nextGen.some(r => String(r.id) === String(receipt.id))) {
            await storage.saveForUser(null, 'receipts', nextGen);
            updated = true;
          }
        }

      } catch (e) {
        console.warn('attach pdf to receipt failed', e);
      }

      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('PDF ready', `PDF saved to: ${uri}`);
      }
    } catch (err) {
      console.warn('pdf export failed', err);
      Alert.alert('PDF failed', `${err && err.message ? err.message : String(err)}`);
    }
  };

  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');

  if (!receipt) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ padding: 16 }}>
        <Text style={{ color: text }}>No receipt found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.btn, { marginTop: 12 }]}><Text style={{ color: '#fff' }}>Back</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 8, color: text }}>Donation Receipt</Text>
        <View style={{ marginBottom: 8 }}><Text style={{ fontWeight: '700', color: text }}>Receipt ID:</Text><Text style={{ color: text }}>{receipt.id}</Text></View>
        <View style={{ marginBottom: 8 }}><Text style={{ fontWeight: '700', color: text }}>Donation ID:</Text><Text style={{ color: text }}>{receipt.donationId}</Text></View>
        <View style={{ marginBottom: 8 }}><Text style={{ fontWeight: '700', color: text }}>Project:</Text><Text style={{ color: text }}>{receipt.projectId || '—'}</Text></View>
        <View style={{ marginBottom: 8 }}><Text style={{ fontWeight: '700', color: text }}>Amount:</Text><Text style={{ color: text }}>${receipt.amount}</Text></View>
        <View style={{ marginBottom: 8 }}><Text style={{ fontWeight: '700', color: text }}>Donor:</Text><Text style={{ color: text }}>{receipt.donor && (receipt.donor.name || receipt.donor.id) }</Text></View>
        <View style={{ marginBottom: 8 }}><Text style={{ fontWeight: '700', color: text }}>Message:</Text><Text style={{ color: text }}>{receipt.note || '—'}</Text></View>
        <View style={{ marginTop: 12 }}>
          <TouchableOpacity onPress={exportJson} style={[styles.btn, { backgroundColor: '#27ae60', marginBottom: 8 }]}><Text style={{ color: '#fff' }}>Export JSON</Text></TouchableOpacity>
          <TouchableOpacity onPress={savePdf} style={[styles.btn, { backgroundColor: '#2980b9', marginBottom: 8 }]}><Text style={{ color: '#fff' }}>Save PDF</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.btn, { backgroundColor: '#95a5a6' }]}><Text style={{ color: '#fff' }}>Close</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 12, borderRadius: 8, alignItems: 'center' }
});

