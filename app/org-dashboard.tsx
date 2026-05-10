import React, { useCallback, useContext, useEffect, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { AuthContext } from '@/context/AuthContext';
import * as storage from '@/utils/storage';
import { loadIncomingDonations, sumIncomingForCause } from '@/utils/fundTracking';

export default function OrgDashboard() {
  const auth = useContext(AuthContext);
  const navigation = useNavigation();
  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const [causeCount, setCauseCount] = useState(0);
  const [totalRaised, setTotalRaised] = useState(0);

  const load = useCallback(async () => {
    const causes = (await storage.loadForUser(auth?.user ?? null, 'myFundraisers', [])) || [];
    const incoming = await loadIncomingDonations();
    let sum = 0;
    for (const c of causes) {
      sum += sumIncomingForCause(incoming, c.id);
    }
    setCauseCount(causes.length);
    setTotalRaised(sum);
  }, [auth?.user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: bg }]}>
      <Text style={[styles.title, { color: text }]}>Organization home</Text>
      <Text style={[styles.sub, { color: text }]}>Create causes, log funds, and post updates your donors can follow.</Text>

      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Your causes</Text>
          <Text style={styles.cardValue}>{causeCount}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Recorded on-device</Text>
          <Text style={styles.cardValue}>${totalRaised.toFixed(0)}</Text>
        </View>
      </View>

      <Text style={[styles.h2, { color: text }]}>Quick actions</Text>
      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('OrgCauses' as never)}>
        <Text style={styles.btnText}>Manage causes</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.btnAlt]} onPress={() => navigation.navigate('OrgFunds' as never)}>
        <Text style={styles.btnText}>Funds & breakdown</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, { backgroundColor: '#7c3aed' }]} onPress={() => navigation.navigate('Browse' as never)}>
        <Text style={styles.btnText}>Browse public causes</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.btnMuted]} onPress={() => navigation.navigate('Notifications' as never)}>
        <Text style={styles.btnText}>Notifications</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, paddingTop: 20 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  sub: { opacity: 0.85, marginBottom: 16, fontSize: 14 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  cardLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  cardValue: { fontSize: 22, fontWeight: '800', color: '#111' },
  h2: { fontWeight: '700', marginBottom: 10, fontSize: 16 },
  btn: { backgroundColor: '#2563eb', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  btnAlt: { backgroundColor: '#059669' },
  btnMuted: { backgroundColor: '#475569' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
