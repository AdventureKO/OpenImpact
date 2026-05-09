import React, { useEffect, useState, useContext } from 'react';
import { SafeAreaView, View, Text, FlatList, Image, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColor } from '../hooks/use-theme-color';
import { AuthContext } from '../context/AuthContext';
import * as storage from '../utils/storage';

export default function UploadsScreen(){
  const navigation = useNavigation();
  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  useEffect(()=>{(async()=>{
    try{
      const u = user ? (await storage.loadForUser(user, 'uploads', [])) : (await storage.load('anonUploads', []));
      setItems(u || []);
    }catch(e){console.warn('load uploads', e)}
  })()},[user]);

  const removeOne = (id) => {
    Alert.alert('Remove upload', 'Delete this local upload?', [
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress: async ()=>{
        try{
          const next = items.filter(i=>i.id !== id);
          if (user) await storage.saveForUser(user, 'uploads', next); else await storage.save('anonUploads', next);
          setItems(next);
        }catch(e){console.warn('remove upload', e)}
      } }
    ]);
  };

  return (
    <SafeAreaView style={{flex:1, backgroundColor: bg}}>
      <View style={{padding:16}}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 12 }}>
          <Text style={{ color: '#007aff' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{fontSize:22,fontWeight:'700',marginBottom:8, color: text}}>My Uploads</Text>
        <Text style={{color:'#666',marginBottom:12}}>Images and files uploaded from the app (mock storage).</Text>

        {items.length === 0 ? (
          <Text style={{color:'#666'}}>No uploads yet. Open Upload, then pick an image to add one.</Text>
        ) : (
          <FlatList data={items} keyExtractor={i=>i.id} renderItem={({item})=> (
            <View style={{padding:10, backgroundColor:'#fff', borderRadius:8, marginBottom:8}}>
              <View style={{flexDirection:'row'}}>
                {item.uri ? <Image source={{uri: item.uri}} style={{width:80, height:80, borderRadius:6, marginRight:10}} /> : null}
                <View style={{flex:1}}>
                  <Text style={{fontWeight:'700'}}>{item.projectId ? `Project ${item.projectId}` : (item.caption ? item.caption : 'Upload')}</Text>
                  <Text style={{color:'#666', fontSize:12}}>{new Date(item.createdAt || Date.now()).toLocaleString()}</Text>
                  {item.caption ? <Text style={{color:'#444', marginTop:6}}>{item.caption}</Text> : null}
                  <View style={{flexDirection:'row', marginTop:8}}>
                    <TouchableOpacity onPress={()=>{ setPreviewItem(item); setPreviewVisible(true); }} style={{padding:8, backgroundColor:'#eee', borderRadius:6, marginRight:8}}>
                      <Text>Preview</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=>removeOne(item.id)} style={{padding:8, backgroundColor:'#ffdddd', borderRadius:6}}>
                      <Text>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )} />
        )}
      
        <Modal visible={previewVisible} animationType="slide" onRequestClose={()=>setPreviewVisible(false)}>
          <SafeAreaView style={{flex:1, backgroundColor:'#000'}}>
            <ScrollView contentContainerStyle={{padding:16, alignItems:'center'}}>
              {previewItem?.uri ? <Image source={{uri: previewItem.uri}} style={{width:'100%', height:400, resizeMode:'contain'}} /> : <Text style={{color:'#fff'}}>No preview</Text>}
              {previewItem?.caption ? <Text style={{color:'#fff', marginTop:12}}>{previewItem.caption}</Text> : null}
              <View style={{height:16}} />
              <TouchableOpacity onPress={()=>setPreviewVisible(false)} style={{padding:12, backgroundColor:'#fff', borderRadius:8}}>
                <Text>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

