import React, { useState, useContext } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, Image, Alert, StyleSheet, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import * as storage from '../utils/storage';

export default function UploadScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const projectId = (route.params || {}).projectId;
  const auth = useContext(AuthContext);
  const [imageUri, setImageUri] = useState(null);
  const [caption, setCaption] = useState('');

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return Alert.alert('Permission', 'Permission to access photos is required');
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      if (!res || res.canceled) return;
      const uri = res.assets ? res.assets[0].uri : res.uri;
      setImageUri(uri);
    } catch (e) { console.warn('pick image', e); Alert.alert('Error', 'Could not pick image'); }
  };

  const handleUpload = async () => {
    if (!imageUri) return Alert.alert('Validation', 'Please pick an image first');
    try {
      const obj = { id: `up-${Date.now()}`, uri: imageUri, caption: caption || '', projectId: projectId || null, createdAt: new Date().toISOString() };
      if (auth && auth.user) {
        const existing = (await storage.loadForUser(auth.user, 'uploads', [])) || [];
        await storage.saveForUser(auth.user, 'uploads', [obj, ...existing]);
      } else {
        const anon = (await storage.load('anonUploads', [])) || [];
        await storage.save('anonUploads', [obj, ...anon]);
      }
      Alert.alert('Uploaded', 'File saved locally (mock upload).');
      navigation.goBack();
    } catch (e) { console.warn('upload save failed', e); Alert.alert('Error', 'Could not save upload'); }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 8 }}>Upload File</Text>
        <Text style={{ marginBottom: 8 }}>Project: {projectId || '—'}</Text>
        {imageUri ? <Image source={{ uri: imageUri }} style={{ width: '100%', height: 240, borderRadius: 8, marginBottom: 8 }} /> : <View style={{ height: 240, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}><Text>No image selected</Text></View>}

        <TextInput
          placeholder="Add a caption or note"
          value={caption}
          onChangeText={setCaption}
          style={{ borderWidth: 1, borderColor: '#eee', padding: 10, borderRadius: 8, marginBottom: 8 }}
        />

        <TouchableOpacity onPress={pickImage} style={[styles.btn, { backgroundColor: '#2980b9', marginBottom: 8 }]}><Text style={{ color: '#fff' }}>Pick Image</Text></TouchableOpacity>
        <TouchableOpacity onPress={handleUpload} style={[styles.btn, { backgroundColor: '#27ae60' }]}><Text style={{ color: '#fff' }}>Upload (mock)</Text></TouchableOpacity>
        <View style={{ height: 12 }} />
        <TouchableOpacity onPress={() => navigation.navigate('Uploads')} style={[styles.btn, { backgroundColor: '#4f46e5', marginTop: 6 }]}><Text style={{ color: '#fff' }}>View My Uploads</Text></TouchableOpacity>
        <View style={{ height: 12 }} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.btn, { backgroundColor: '#95a5a6' }]}><Text style={{ color: '#fff' }}>Cancel</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ btn: { padding: 12, borderRadius: 8, alignItems: 'center' } });

