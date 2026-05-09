import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Pressable, TextInput, Image, Modal, ScrollView, StyleSheet } from 'react-native';
import { useThemeColor } from '../hooks/use-theme-color';
import { useNavigation } from '@react-navigation/native';
import MOCK_SERVER_URL from '../constants/api';
import seedData from '../data/seedFundraisers.json';
import * as storage from '../utils/storage';
import * as ImagePicker from 'expo-image-picker';

function ProgressBarTrack({ value = 0 }: { value?: number }) {
  const v = Math.min(Math.max(value, 0), 1);
  const pct = Math.round(v * 100);
  return (
    <View style={progressStyles.track}>
      <View style={[progressStyles.fill, { width: `${pct}%` }]} />
    </View>
  );
}

const progressStyles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e8e8e8',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#27ae60',
  },
});

export default function TrackScreen() {
  const navigation = useNavigation();
  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const [fundraisers, setFundraisers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [newText, setNewText] = useState('');
  const [newImageUri, setNewImageUri] = useState(null);
  const [preview, setPreview] = useState({ visible: false, item: null });

  useEffect(() => {
    setLoading(true);
    fetch(`${MOCK_SERVER_URL}/api/fundraisers`).then(r=>r.json()).then(setFundraisers).catch(()=>{
      try{ setFundraisers(seedData.fundraisers || []); }catch(e){ setFundraisers([]); }
    }).finally(()=>setLoading(false));
  }, []);

  useEffect(() => {
    (async ()=>{
      try{
        const u = await storage.load('timelineUpdates', []);
        setUpdates(u || []);
      }catch(e){ console.warn('load timeline updates', e); }
    })();
  }, []);

  if (loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator /></View>;

  const filtered = (fundraisers || []).filter(f => {
    if (!query) return true;
    const q = String(query || '').toLowerCase().trim();
    return String(f.name || '').toLowerCase().includes(q)
      || String(f.organizer || f.writer || '').toLowerCase().includes(q)
      || String(f.id || '').toLowerCase().includes(q);
  });

  const toggle = id => setExpandedId(expandedId === id ? null : id);

  const pickImageForUpdate = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return alert('Permission required to pick images');
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      if (!res || res.canceled) return;
      const uri = res.assets ? res.assets[0].uri : res.uri;
      setNewImageUri(uri);
    } catch (e) { console.warn('pick update image', e); }
  };

  const saveUpdate = async (fundraiserId) => {
    if (!newText && !newImageUri) return alert('Add a comment or image');
    const obj = { id: `up-${Date.now()}`, fundraiserId: fundraiserId, text: newText || '', uri: newImageUri || null, date: Date.now() };
    const next = [obj, ...(updates || [])];
    try{
      await storage.save('timelineUpdates', next);
      setUpdates(next);
      setNewText(''); setNewImageUri(null);
    }catch(e){ console.warn('save update', e); alert('Could not save update'); }
  };

  const updatesFor = (id) => (updates || []).filter(u => String(u.fundraiserId) === String(id)).sort((a,b)=>b.date - a.date);

  return (
    <View style={{flex:1, padding:16}}>
      <Text style={{fontSize:20, fontWeight:'700', marginBottom:8}}>Track Donations</Text>
      <Text style={{color:'#666', marginBottom:12}}>Follow progress, milestones, photos and updates from causes you care about.</Text>

      <View style={{marginBottom:12}}>
        <TextInput placeholder="Search causes, organizers, or id" value={query} onChangeText={setQuery} style={{borderWidth:1, borderColor:'#eee', padding:8, borderRadius:8, backgroundColor: bg, color: text}} placeholderTextColor={'#888'} />
      </View>
      <View style={{flexDirection:'row', marginBottom:12}}>
        <TouchableOpacity onPress={() => navigation.navigate('Milestones')} style={{padding:8, backgroundColor:'#eee', borderRadius:6, marginRight:8}}>
          <Text>Milestones</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Analytics')} style={{padding:8, backgroundColor:'#eee', borderRadius:6}}>
          <Text>Analytics</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item, index) => item?.id?.toString() ?? `f-${index}`}
        renderItem={({item}) => {
          const progress = item.current && item.goal ? Math.min(item.current / item.goal, 1) : (item.progress || 0);
          const milestones = item.milestones || item.checkpoints || [];
          const isExpanded = expandedId === item.id;

          return (
            <View style={{padding:12, borderRadius:8, backgroundColor:'#fff', marginBottom:8}}>
              <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                <View>
                  <Text style={{fontWeight:'700'}}>{item.name}</Text>
                  <Text style={{color:'#666'}}>{item.organizer || item.writer || item.author}</Text>
                </View>
                <Pressable onPress={() => toggle(item.id)} style={{padding:8}}>
                  <Text style={{color:'#007aff'}}>{isExpanded ? 'Collapse' : 'Details'}</Text>
                </Pressable>
              </View>

              <View style={{marginTop:8}}>
                <Text style={{fontSize:12,color:'#444'}}>Progress</Text>
                <View style={{marginVertical:6}}>
                  <ProgressBarTrack value={progress} />
                  <Text style={{fontSize:12, color:'#666', marginTop:6}}>{Math.round((progress || 0) * 100)}% • ${item.current || 0} raised</Text>
                </View>
              </View>

                  {isExpanded && (
                <View style={{marginTop:8}}>
                  <Text style={{fontWeight:'700', marginBottom:6}}>Milestones</Text>
                  {milestones.length === 0 && <Text style={{color:'#666'}}>No milestones set for this cause.</Text>}
                  {milestones.map((m, idx) => (
                    <View key={idx} style={{padding:8, backgroundColor:'#f7f7f7', borderRadius:6, marginBottom:6}}>
                      <Text style={{fontWeight:'600'}}>{m.title || `Step ${idx+1}`}</Text>
                      <Text style={{color:'#666', fontSize:12}}>{m.note || m.description || ''}</Text>
                      <Text style={{fontSize:12, color:m.completed ? 'green' : '#999', marginTop:6}}>{m.completed ? 'Completed' : 'Pending'}</Text>
                    </View>
                  ))}

                  <Text style={{fontWeight:'700', marginTop:8}}>Photos & Updates</Text>
                  <Text style={{color:'#666', marginBottom:6}}>Share images and short updates about progress.</Text>

                  <View style={{padding:8, backgroundColor:'#fff', borderRadius:8, marginBottom:8}}>
                    <TextInput placeholder="Write an update or note" value={newText} onChangeText={setNewText} style={{borderWidth:1, borderColor:'#eee', padding:8, borderRadius:6, marginBottom:8, backgroundColor: bg, color: text}} placeholderTextColor={'#888'} />
                    {newImageUri ? <Image source={{uri:newImageUri}} style={{height:160, borderRadius:8, marginBottom:8}} /> : null}
                    <View style={{flexDirection:'row'}}>
                      <TouchableOpacity onPress={pickImageForUpdate} style={{padding:8, backgroundColor:'#eee', borderRadius:6, marginRight:8}}><Text>Pick Photo</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => saveUpdate(item.id)} style={{padding:8, backgroundColor:'#27ae60', borderRadius:6}}><Text style={{color:'#fff'}}>Post Update</Text></TouchableOpacity>
                    </View>
                  </View>

                  {updatesFor(item.id).map(u => (
                    <View key={u.id} style={{padding:8, backgroundColor:'#f9fafb', borderRadius:6, marginBottom:8}}>
                      <Text style={{color:'#666', fontSize:12}}>{new Date(u.date).toLocaleString()}</Text>
                      {u.text ? <Text style={{marginTop:6}}>{u.text}</Text> : null}
                      {u.uri ? <TouchableOpacity onPress={()=>{ setPreview({visible:true,item:u}) }}><Image source={{uri:u.uri}} style={{height:160, borderRadius:8, marginTop:8}} /></TouchableOpacity> : null}
                    </View>
                  ))}

                  <Text style={{fontWeight:'700', marginTop:8}}>Photos</Text>
                  <View style={{height:100, borderRadius:8, backgroundColor:'#eef2ff', justifyContent:'center', alignItems:'center', marginBottom:8}}>
                    <Text style={{color:'#444'}}>Map / Location Placeholder</Text>
                  </View>

                  <View style={{flexDirection:'row'}}>
                      <TouchableOpacity onPress={() => navigation.navigate('FundraiserDetail', { id: item.id })} style={{padding:8, backgroundColor:'#eee', borderRadius:6, marginRight:8}}>
                        <Text>Open Cause</Text>
                      </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Donate', { id: item.id })} style={{padding:8, backgroundColor:'#ffd39b', borderRadius:6}}>
                      <Text>Donate / Give</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />

      <Modal visible={preview.visible} animationType="slide" onRequestClose={()=>setPreview({visible:false,item:null})}>
        <SafeAreaView style={{flex:1, backgroundColor:'#000'}}>
          <ScrollView contentContainerStyle={{padding:16, alignItems:'center'}}>
            {preview.item?.uri ? <Image source={{uri: preview.item.uri}} style={{width:'100%', height:400, resizeMode:'contain'}} /> : <Text style={{color:'#fff'}}>No preview</Text>}
            {preview.item?.text ? <Text style={{color:'#fff', marginTop:12}}>{preview.item.text}</Text> : null}
            <View style={{height:16}} />
            <TouchableOpacity onPress={()=>setPreview({visible:false,item:null})} style={{padding:12, backgroundColor:'#fff', borderRadius:8}}>
              <Text>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

