import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as storage from '../utils/storage';
import { useThemeColor } from '../hooks/use-theme-color';

export default function AddprojectImageScreen() {
  const [image, setImage] = useState(null);
  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Permission to access media library is required to pick images.');
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, base64: false });
      if (!res.canceled && res.assets && res.assets[0]) {
        const uri = res.assets[0].uri;
        setImage(uri);
        // save as last picked fundraiser image
        await storage.save('lastPickedFundraiserImage', uri);
        Alert.alert('Saved', 'Image saved locally');
      }
    } catch (err) {
      console.warn(err);
      Alert.alert('Error', 'Could not pick image');
    }
  };

  return (
    <View style={[styles.wrap, { backgroundColor: bg }]}>
      <TouchableOpacity onPress={pickImage} style={styles.btn}><Text style={{ color: text }}>Pick Image</Text></TouchableOpacity>
      {image ? <Image source={{ uri: image }} style={styles.preview} /> : <Text style={{ color: text, padding: 12 }}>No image selected</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 12 },
  btn: { padding: 12, backgroundColor: '#0a7ea4', borderRadius: 8, alignItems: 'center' },
  preview: { width: '100%', height: 300, marginTop: 12, borderRadius: 8 }
});

