import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as storage from '../utils/storage';

export default function AnalyticsScreen(){
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [budget, setBudget] = useState([]);

  useEffect(()=>{(async()=>{
    const d1 = (await storage.load('donations', [])) || [];
    const d2 = (await storage.load('anonDonations', [])) || [];
    const b = (await storage.load('budgetItems', [])) || [];
    setDonations([...(d1||[]), ...(d2||[])]);
    setBudget(b);
    setLoading(false);
  })()},[]);

  if (loading) return <SafeAreaView style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator /></SafeAreaView>;

  const totalDonated = donations.reduce((s, it) => s + (Number(it.amount) || Number(it.total) || 0), 0);
  const donationCount = donations.length;
  const avg = donationCount ? (totalDonated / donationCount) : 0;

  // top causes
  const byCause = donations.reduce((acc, it) => {
    const k = it.cause || it.title || 'Unknown';
    acc[k] = (acc[k] || 0) + (Number(it.amount) || Number(it.total) || 0);
    return acc;
  }, {});
  const topCauses = Object.entries(byCause).sort((a,b)=>b[1]-a[1]).slice(0,5);

  return (
    <SafeAreaView style={{ flex:1 }}>
      <View style={{ padding: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginBottom:12}}>
          <Text style={{color:'#007aff'}}>← Back</Text>
        </TouchableOpacity>
      </View>
      <View style={{ padding:16 }}>
        <Text style={{ fontSize:22, fontWeight:'700', marginBottom:8 }}>Analytics</Text>
        <Text style={{ marginBottom:12 }}>Summary of donations and budget insights (local-demo).</Text>

        <View style={{ marginBottom:12 }}>
          <Text style={{ fontWeight:'700' }}>Total Donated</Text>
          <Text style={{ fontSize:18 }}>${Math.round(totalDonated*100)/100}</Text>
          <Text style={{ color:'#666' }}>{donationCount} donations • Avg ${Math.round(avg*100)/100}</Text>
        </View>

        <View style={{ marginBottom:12 }}>
          <Text style={{ fontWeight:'700' }}>Top Causes</Text>
          {topCauses.length===0 ? <Text style={{color:'#666'}}>No donations yet</Text> : (
            <FlatList data={topCauses} keyExtractor={c=>c[0]} renderItem={({item})=> (
              <View style={{ paddingVertical:6 }}>
                <Text style={{ fontWeight:'600' }}>{item[0]}</Text>
                <Text style={{ color:'#666' }}>${Math.round(item[1]*100)/100}</Text>
              </View>
            )} />
          )}
        </View>

        <View>
          <Text style={{ fontWeight:'700' }}>Budget Items</Text>
          <Text style={{ color:'#666' }}>{budget.length} items tracked locally</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

