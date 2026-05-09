import React, { useEffect, useState, useMemo } from 'react';
import { SafeAreaView, View, Text, FlatList, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import MOCK_SERVER_URL from '../constants/api';
import seedData from '../data/seedFundraisers.json';
import { useThemeColor } from '../hooks/use-theme-color';
import { useNavigation } from '@react-navigation/native';

export default function ProjectsScreen() {
  const [fundraisers, setFundraisers] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const primary = useThemeColor({}, 'primary');
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'icon');
  const secondary = useThemeColor({}, 'secondary');
  const navigation = useNavigation();

  useEffect(() => {
    setLoading(true);
    fetch(`${MOCK_SERVER_URL}/api/fundraisers`).then(r=>r.json()).then(setFundraisers).catch(()=>{
      try{ setFundraisers(seedData.fundraisers || []); }catch(e){ setFundraisers([]); }
    }).finally(()=>setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (fundraisers || []).forEach(f => {
      const k = (f.organizer || f.writer || 'Uncategorized');
      set.add(String(k));
    });
    return Array.from(set).slice(0, 12);
  }, [fundraisers]);

  const featured = useMemo(() => {
    return (fundraisers || []).slice().sort((a,b) => ((b.current||0)/(b.goal||1)) - ((a.current||0)/(a.goal||1))).slice(0,4);
  }, [fundraisers]);

  if (loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator /></View>;

  const results = (fundraisers || []).filter(f => {
    if (selectedCategory && String(f.organizer || f.writer || '') !== selectedCategory) return false;
    if (!query) return true;
    const q = String(query || '').toLowerCase().trim();
    return String(f.name || '').toLowerCase().includes(q)
      || String(f.organizer || f.writer || '').toLowerCase().includes(q)
      || String(f.id || '').toLowerCase().includes(q);
  });

  return (
    <SafeAreaView style={{flex:1, backgroundColor: bg, padding:16, paddingTop:32, paddingBottom:160}}>
      <Text style={{fontSize:20, fontWeight:'700', marginBottom:8, color: text}}>Browse Causes</Text>
      <Text style={{color: secondary, marginBottom:12}}>Explore featured causes, browse by organizer, or search to find projects.</Text>

      <View style={{marginBottom:12}}>
        <TextInput placeholder="Search causes or organizers" value={query} onChangeText={setQuery} style={{borderWidth:1, borderColor:'#eee', padding:8, borderRadius:8, backgroundColor: bg, color: text}} placeholderTextColor={secondary || '#888'} />
      </View>

      <Text style={{fontWeight:'700', marginBottom:8, color: text}}>Browse by Organizer</Text>
      <View style={{ paddingVertical:8, marginBottom:8, minHeight:56 }}>
        <FlatList data={categories} horizontal keyExtractor={(c)=>c} contentContainerStyle={{paddingHorizontal:12, paddingVertical:6}} renderItem={({item}) => (
          <TouchableOpacity onPress={() => setSelectedCategory(selectedCategory === item ? null : item)} style={{paddingVertical:6, paddingHorizontal:12, marginRight:8, borderRadius:16, backgroundColor: selectedCategory === item ? '#2980b9' : '#f1f1f1', minWidth:60, maxWidth:110, alignItems:'center', alignSelf:'flex-start'}}>
            <Text style={{fontSize:13, color: selectedCategory === item ? '#fff' : '#000'}} numberOfLines={1} ellipsizeMode='tail'>{item}</Text>
          </TouchableOpacity>
        )} showsHorizontalScrollIndicator={false} />
      </View>

      <Text style={{fontWeight:'700', marginBottom:8, marginTop:6, color: text}}>Highlighted Organizers</Text>
      <FlatList
        data={categories}
        horizontal
        contentContainerStyle={{paddingHorizontal:16, paddingTop:12, paddingBottom:40}}
        keyExtractor={(c)=>String(c)}
        renderItem={({item}) => {
          const count = (fundraisers || []).filter(f => String(f.organizer || f.writer || '') === String(item)).length;
          return (
            <TouchableOpacity onPress={() => setSelectedCategory(selectedCategory === item ? null : item)} style={{width:180, padding:12, borderRadius:8, backgroundColor:'#fff', marginRight:12, height:150, justifyContent:'center'}}>
              <Text style={{fontWeight:'700', fontSize:14, color:'#000'}} numberOfLines={2}>{item}</Text>
              <Text style={{color:'#666', marginTop:8}}>{count} project{count !== 1 ? 's' : ''}</Text>
            </TouchableOpacity>
          );
        }}
        showsHorizontalScrollIndicator={false}
      />

      <Text style={{fontWeight:'700', marginTop:12, marginBottom:8, color: text}}>Results ({results.length})</Text>
      <FlatList
        data={results}
        keyExtractor={i=>i.id}
        contentContainerStyle={{ paddingBottom: 140 }}
        renderItem={({item}) => (
          <View style={{padding:12, borderRadius:8, backgroundColor:'#fff', marginBottom:8}}>
            <Text style={{fontWeight:'700'}}>{item.name}</Text>
            <Text style={{color:'#666'}}>{item.organizer || item.writer}</Text>
            <Text style={{fontSize:12, color:'#666', marginTop:6}}>{Math.round(((item.current||0)/(item.goal||1))*100)}% • ${item.current||0} raised</Text>
            <View style={{flexDirection:'row', marginTop:8}}>
              <TouchableOpacity onPress={() => navigation.navigate('FundraiserDetail', { id: item.id })} style={{padding:8, backgroundColor:'#eee', borderRadius:6, marginRight:8}}>
                <Text>Open Cause</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Donate', { id: item.id })} style={{padding:8, backgroundColor:'#ffd39b', borderRadius:6}}>
                <Text>Donate</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

