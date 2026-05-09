import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, Button, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColor } from '../hooks/use-theme-color';
import * as storage from '../utils/storage';

export default function BudgetScreen(){
  const navigation = useNavigation();
  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const [items, setItems] = useState([]);

  useEffect(()=>{(async()=>{
    try{
      const b = (await storage.load('budgetItems', [])) || [];
      setItems(b);
    }catch(e){console.warn('load budget failed', e)}
  })()},[]);

  const total = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);

  const byCategory = items.reduce((acc, it) => {
    const k = it.category || 'Uncategorized';
    acc[k] = acc[k] || 0;
    acc[k] += Number(it.amount) || 0;
    return acc;
  }, {});

  const addSample = async () => {
    const sample = { id: Date.now().toString(), title: 'Community outreach', amount: 250, category: 'Programs', note: 'Seeded sample entry' };
    const next = [sample, ...items];
    await storage.save('budgetItems', next);
    setItems(next);
  };

  const exportBudget = async () => {
    try {
      await navigator?.share?.({ text: JSON.stringify(items, null, 2), title: 'Budget Export' });
    } catch (e) {
      Alert.alert('Export', 'Unable to export from this platform.');
    }
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: bg }}>
      <View style={{ padding:16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 12 }}>
          <Text style={{ color: '#007aff' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize:22, fontWeight:'700', marginBottom:8, color: text }}>Budget Transparency</Text>
        <Text style={{ marginBottom:12, color: text }}>A simple breakdown of recent budget items. Entries are stored locally under `budgetItems` for demo.</Text>

        <View style={{ flexDirection:'row', marginBottom:12 }}>
          <Button title="Add Sample" onPress={addSample} />
          <View style={{width:12}} />
          <Button title="Export" onPress={exportBudget} />
        </View>

        <Text style={{ fontWeight:'700', marginBottom:8, color: text }}>Total Budgeted: ${total}</Text>

        <Text style={{ fontWeight:'700', marginTop:8, color: text }}>By Category</Text>
        {Object.keys(byCategory).length === 0 && <Text style={{color: text}}>No category data</Text>}
        {Object.keys(byCategory).map(cat => (
          <View key={cat} style={{ paddingVertical:6 }}>
            <Text style={{ fontWeight:'600', color: text }}>{cat}</Text>
            <Text style={{ color:'#999' }}>${byCategory[cat]}</Text>
          </View>
        ))}

        <Text style={{ fontWeight:'700', marginTop:12, color: text }}>Recent Items</Text>
        {items.length===0 ? <Text style={{color:'#666'}}>No budget items</Text> : (
          <FlatList data={items} keyExtractor={i=>i.id?.toString()||i.title} renderItem={({item})=> (
            <View style={{ padding:8, borderBottomWidth:1, borderColor:'#eee' }}>
              <Text style={{ fontWeight:'700', color: text }}>{item.title}</Text>
              <Text style={{ color: text }}>${item.amount}</Text>
              <Text style={{ fontSize:12, color:'#999' }}>{item.category || ''} • {item.note || ''}</Text>
            </View>
          )} />
        )}
      </View>
    </SafeAreaView>
  );
}

