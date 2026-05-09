import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, Button, FlatList, ActivityIndicator, Alert, TouchableOpacity, Share, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { load, remove } from '../utils/storage';
import { useThemeColor } from '../hooks/use-theme-color';

export default function ProfileScreen() {
  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const surface = useThemeColor({}, 'surface');
  const secondary = useThemeColor({}, 'secondary');
  const danger = useThemeColor({}, 'danger');
  const primary = useThemeColor({}, 'primary');
  const border = useThemeColor({}, 'icon');
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [receipts, setReceipts] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      const d1 = await load('donations', []);
      const d2 = await load('anonDonations', []);
      if (!mounted) return;
      setDonations([...(d1||[]), ...(d2||[])].sort((a,b)=> (b.date||0) - (a.date||0)));
      setLoading(false);
    }
    loadData();

    (async function loadReceipts(){
      try{
        const r1 = await load('receipts', []);
        const r2 = await load('anonReceipts', []);
        if (!mounted) return;
        setReceipts([...(r1||[]), ...(r2||[])].sort((a,b)=> (new Date(b.createdAt||0)).getTime() - (new Date(a.createdAt||0)).getTime()));
      }catch(e){ console.warn('load receipts', e) }
    })();
    return () => { mounted = false };
  }, []);

  const exportAll = async () => {
    try {
      await Share.share({ message: JSON.stringify(donations, null, 2), title: 'My Donations (export)' });
    } catch (e) {
      Alert.alert('Export failed', e.message || String(e));
    }
  };

  // single destructive action to clear both donations and receipts for testing

  const openPdf = async (pdfUri) => {
    if (!pdfUri) return Alert.alert('No PDF', 'No PDF available for this receipt. Use Save PDF on the receipt page.');
    try{
      const ok = await Linking.canOpenURL(pdfUri);
      if (ok) await Linking.openURL(pdfUri);
      else Alert.alert('Open PDF', `Can't open: ${pdfUri}`);
    }catch(e){ console.warn('open pdf', e); Alert.alert('Open PDF failed', String(e)); }
  };

  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('donations');

  const resetAllLocalData = () => {
    Alert.alert('Reset local data', 'Remove all local donations and receipts? This cannot be undone locally.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: async () => {
        await remove('donations'); await remove('anonDonations'); await remove('receipts'); await remove('anonReceipts'); setDonations([]); setReceipts([]); Alert.alert('Reset', 'Local donations and receipts cleared (test only)');
      } }
    ]);
  };

  return (
    <SafeAreaView style={{flex:1, padding:16, paddingTop:18, backgroundColor: bg}}>
      <Text style={{fontSize:20, fontWeight:'700', marginBottom:8, color: text}}>Profile</Text>
      <Text style={{color:secondary, marginBottom:12}}>Manage personal info, payment methods, receipts, and notifications.</Text>

      <View style={{flexDirection:'row', marginBottom:12, alignItems:'center', justifyContent:'space-between', flexWrap:'wrap'}}>
        <TouchableOpacity onPress={exportAll} style={{paddingVertical:10, paddingHorizontal:14, backgroundColor:'#fff', borderRadius:8, borderWidth:1, borderColor:'#ddd', marginBottom:8, flexBasis:'48%'}}>
          <Text style={{color:'#000', fontWeight:'700', textAlign:'center'}}>Export Donations (JSON)</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={resetAllLocalData} style={{paddingVertical:10,paddingHorizontal:14, backgroundColor:'#cc0000', borderRadius:8, marginBottom:8, flexBasis:'48%'}}>
          <Text style={{color:'#fff', fontWeight:'700', textAlign:'center'}}>Clear Donations & Receipts</Text>
        </TouchableOpacity>
      </View>

      <View style={{flexDirection:'row', marginBottom:6}}>
        <TouchableOpacity onPress={() => navigation.navigate('Budget')} style={{padding:8, backgroundColor:'#eee', borderRadius:6, marginRight:8}}>
          <Text>Budget</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Analytics')} style={{padding:8, backgroundColor:'#eee', borderRadius:6}}>
          <Text>Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Milestones')} style={{padding:8, backgroundColor:'#eee', borderRadius:6, marginLeft:8}}>
          <Text>Milestones</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Uploads')} style={{padding:8, backgroundColor:'#eee', borderRadius:6, marginLeft:8}}>
          <Text>Uploads</Text>
        </TouchableOpacity>
      </View>
      <Text style={{color:'#666', fontSize:12, marginBottom:12}}>Use the quick links to view budgets, analytics, milestones, or your uploads.</Text>

      <View style={{flexDirection:'row', marginBottom:12}}>
        <TouchableOpacity onPress={() => setActiveTab('donations')} style={{padding:10, backgroundColor: activeTab === 'donations' ? '#2980b9' : '#f1f1f1', borderRadius:8, marginRight:8, minWidth:120}}>
          <Text style={{color: activeTab === 'donations' ? '#fff' : '#000', fontWeight:'700'}}>Donations ({donations.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('receipts')} style={{padding:10, backgroundColor: activeTab === 'receipts' ? '#2980b9' : '#f1f1f1', borderRadius:8, minWidth:120}}>
          <Text style={{color: activeTab === 'receipts' ? '#fff' : '#000', fontWeight:'700'}}>Receipts ({receipts.length})</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'donations' ? (
        (loading ? <ActivityIndicator /> : (
          donations.length === 0 ? (
            <Text style={{color:secondary}}>No donations recorded yet. Make a donation to see receipts here.</Text>
          ) : (
            <FlatList
              data={donations}
              keyExtractor={(it, i) => it.id?.toString() || String(i)}
              renderItem={({item}) => (
                <View style={{padding:12, backgroundColor:'#fff', borderRadius:8, marginBottom:8}}>
                  <Text style={{fontWeight:'700'}}>{item.cause || item.title || 'Donation'}</Text>
                  <Text style={{color:'#666'}}>{new Date(item.date || Date.now()).toLocaleString()}</Text>
                  <Text style={{marginTop:6}}>Amount: ${item.amount || item.total || 0}</Text>
                  {item.receiptId && <Text style={{fontSize:12, color:'#007aff', marginTop:6}}>Receipt: {item.receiptId}</Text>}
                  <View style={{flexDirection:'row', marginTop:8}}>
                    <TouchableOpacity onPress={() => Share.share({ message: JSON.stringify(item, null, 2), title: 'Donation Receipt' })} style={{padding:8, backgroundColor:'#eee', borderRadius:6, marginRight:8}}>
                      <Text>Export JSON</Text>
                    </TouchableOpacity>
                    {item.receiptId ? (
                      <TouchableOpacity onPress={() => navigation.navigate('Receipt', { id: item.receiptId })} style={{padding:8, backgroundColor:primary, borderRadius:6}}>
                        <Text style={{color:'#fff'}}>View Receipt</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              )}
            />
          )
        ))
      ) : (
        receipts.length === 0 ? (
          <Text style={{color:secondary}}>No receipts available. Completed donations will create receipts.</Text>
        ) : (
          <FlatList
            data={receipts}
            keyExtractor={(r,i)=> r.id?.toString() || String(i)}
            renderItem={({item}) => (
              <View style={{padding:12, backgroundColor:'#fff', borderRadius:8, marginBottom:8}}>
                <Text style={{fontWeight:'700'}}>Receipt {item.id}</Text>
                <Text style={{color:'#666'}}>{new Date(item.createdAt || Date.now()).toLocaleString()}</Text>
                <Text style={{marginTop:6}}>Amount: ${item.amount}</Text>
                <View style={{flexDirection:'row', marginTop:8}}>
                  <TouchableOpacity onPress={() => navigation.navigate('Receipt', { id: item.id })} style={{padding:8, backgroundColor:'#2980b9', borderRadius:6, marginRight:8}}>
                    <Text style={{color:'#fff'}}>Open</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openPdf(item.pdfUri)} style={{padding:8, backgroundColor:'#eee', borderRadius:6}}>
                    <Text>Open PDF</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )
      )}
    </SafeAreaView>
  );
}

