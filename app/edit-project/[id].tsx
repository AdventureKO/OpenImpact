import React, { useEffect, useState, useCallback, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as storage from '../../utils/storage';
import { AuthContext } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColor } from '../../hooks/use-theme-color';

interface Project {
  id: string;
  name: string;
  tags: string[];
  ingredients: Array<{ amount: string; unit: string; name: string; type: string }>;
  method: string;
  image?: string;
  published?: boolean;
  publishedAt?: string;
}

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  
  const [name, setName] = useState('');
  const [tags, setTags] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [method, setMethod] = useState('');
  const [image, setImage] = useState<string | null>(null);
  

  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');
  const auth = useContext(AuthContext);

  const loadProject = useCallback(async () => {
    const stored = (await storage.loadForUser(auth && auth.user ? auth.user : null, 'myFundraisers', null)) || [];
    const found = (stored as Project[]).find((r: Project) => String(r.id) === String(id));
    if (found) {
      setProject(found);
      setIsPublished(found.published || false);
      setName(found.name || '');
      setTags((found.tags || []).join(', '));
      setIngredientsText((found.ingredients || []).map((i: any) => `${i.amount} ${i.unit} ${i.name}`).join('\n'));
      setMethod(found.method || '');
      setImage(found.image || null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [id, loadProject]);

  useFocusEffect(
    useCallback(() => {
      loadProject();
    }, [loadProject])
  );

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return Alert.alert('Permission', 'Permission to access photos is required');
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      if (!result || result.canceled) return;
      const uri = result.assets ? result.assets[0].uri : undefined;
      if (uri) {
        setImage(uri);
      }
    } catch (err) {
      console.warn('Image pick error', err);
    }
  };

  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return Alert.alert('Permission', 'Permission to access camera is required');
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (!result || result.canceled) return;
      const uri = result.assets ? result.assets[0].uri : undefined;
      if (uri) {
        setImage(uri);
      }
    } catch (err) {
      console.warn('take photo error', err);
    }
  };

  const removeImage = async () => {
    setImage(null);
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Validation', 'Please enter a cause name');

    const ingredients = (ingredientsText || '').split('\n').map(line => {
      const trimmed = (line || '').trim();
      if (!trimmed) return null;
      const m = trimmed.match(/^([\d\/\.]+)\s*(\S+)?\s*(.*)$/);
      if (m) {
        return { amount: m[1] || '', unit: m[2] || '', name: (m[3] || '').trim() || (m[2] ? m[2] : trimmed), type: 'dry' };
      }
      return { name: trimmed, amount: '', unit: '', type: 'dry' };
    }).filter(Boolean);

    const updated = project && {
      ...project,
      name: name.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      ingredients,
      method,
      ...(image ? { image } : {}),
    };

    if (!updated) return Alert.alert('Error', 'Project not found');

    const stored = (await storage.loadForUser(auth && auth.user ? auth.user : null, 'myFundraisers', null)) || [];
    const nextStored = (stored as Project[]).map((r: Project) => r.id === project?.id ? updated : r);
    await storage.saveForUser(auth && auth.user ? auth.user : null, 'myFundraisers', nextStored);
    
    Alert.alert('Saved', 'Cause updated');
    router.push('/my-fundraisers');
  };

  const handlePublish = async () => {
    if (!name.trim()) return Alert.alert('Validation', 'Please enter a cause name');
    if (!auth || !auth.user) {
      return Alert.alert('Sign in required', 'You must be signed in to publish. Would you like to sign in now?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push('/login') }
      ]);
    }

    Alert.alert('Publish Cause', 'Publishing this cause will make it public and lock it from further editing. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Publish', style: 'destructive', onPress: async () => {
        const ingredients = (ingredientsText || '').split('\n').map(line => {
          const trimmed = (line || '').trim();
          if (!trimmed) return null;
          const m = trimmed.match(/^([\d\/\.]+)\s*(\S+)?\s*(.*)$/);
          if (m) {
            return { amount: m[1] || '', unit: m[2] || '', name: (m[3] || '').trim() || (m[2] ? m[2] : trimmed), type: 'dry' };
          }
          return { name: trimmed, amount: '', unit: '', type: 'dry' };
        }).filter(Boolean);

        const published = project && {
          ...project,
          name: name.trim(),
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          ingredients,
          method,
          published: true,
          publishedAt: new Date().toISOString(),
          ...(image ? { image } : {}),
        };

        if (!published) return Alert.alert('Error', 'Project not found');

        const stored = (await storage.loadForUser(auth && auth.user ? auth.user : null, 'myFundraisers', null)) || [];
        const nextStored = (stored as Project[]).map((r: Project) => r.id === project?.id ? published : r);
        await storage.saveForUser(auth && auth.user ? auth.user : null, 'myFundraisers', nextStored);

        // also update global publicFundraisers so everyone sees it
        try {
          const globalPub = await storage.load('publicFundraisers', []);
          const nextGlobal = [published, ...(globalPub || [])];
          const seen = new Set();
          const uniqGlobal = [];
          for (const r of nextGlobal) {
            const k = String(r.id);
            if (!seen.has(k)) { seen.add(k); uniqGlobal.push(r); }
          }
          const ok = await storage.save('publicFundraisers', uniqGlobal);
          console.log('edit-project publish: saved to publicFundraisers ok=', ok, 'count=', (uniqGlobal||[]).length);
          try { Alert.alert('Shared to public', `Public causes count: ${(uniqGlobal||[]).length}`); } catch (e) {}
        } catch (e) { console.warn('edit-project publish: failed to save to publicFundraisers', e); }

        Alert.alert('Published!', 'Your cause is now public');
        // navigate to home so published project appears at top
        router.push('/');
      } }
    ]);
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center' }}><Text style={{ color: text }}>Loading...</Text></View>;

  return (
    <ScrollView style={[styles.wrap, { backgroundColor: bg }]} contentContainerStyle={{ padding: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: text }}>◀ Back</Text></TouchableOpacity>
        {!isPublished && (
          <TouchableOpacity onPress={handlePublish} style={{ backgroundColor: '#27ae60', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Publish Cause</Text>
          </TouchableOpacity>
        )}
        {isPublished && (
          <Text style={{ color: '#27ae60', fontWeight: '700', fontSize: 12 }}>✓ Published</Text>
        )}
      </View>
      
      <TextInput 
        placeholder="Cause name" 
        placeholderTextColor={text} 
        value={name} 
        onChangeText={setName} 
        editable={!isPublished}
        style={[styles.input, { color: text, opacity: isPublished ? 0.6 : 1 }]} 
      />
      <TextInput 
        placeholder="Tags (comma separated)" 
        placeholderTextColor={text} 
        value={tags} 
        onChangeText={setTags} 
        editable={!isPublished}
        style={[styles.input, { color: text, opacity: isPublished ? 0.6 : 1 }]} 
      />
      
      <View style={{ marginBottom: 12 }}>
        {image ? (
          <View>
            <Image source={{ uri: image }} style={{ width: '100%', height: 200, borderRadius: 8, marginBottom: 8 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={pickImage} style={[styles.pbtn, { backgroundColor: '#3498db', marginRight: 8 }]}><Text style={styles.pbtnText}>Change Image</Text></TouchableOpacity>
              <TouchableOpacity onPress={takePhoto} style={[styles.pbtn, { backgroundColor: '#8e44ad', marginRight: 8 }]}><Text style={styles.pbtnText}>Take Photo</Text></TouchableOpacity>
              <TouchableOpacity onPress={removeImage} style={[styles.pbtn, { backgroundColor: '#e74c3c' }]}><Text style={styles.pbtnText}>Remove</Text></TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={pickImage} style={[styles.pbtn, { backgroundColor: '#3498db', marginBottom: 6, marginRight: 8 }]}><Text style={styles.pbtnText}>Pick Image</Text></TouchableOpacity>
            <TouchableOpacity onPress={takePhoto} style={[styles.pbtn, { backgroundColor: '#8e44ad', marginBottom: 6 }]}><Text style={styles.pbtnText}>Take Photo</Text></TouchableOpacity>
          </View>
        )}
      </View>

      <TextInput 
        placeholder="Details (one per line: e.g. 'Initial budget: $1000')" 
        placeholderTextColor={text} 
        value={ingredientsText} 
        onChangeText={setIngredientsText} 
        editable={!isPublished}
        style={[styles.textarea, { color: text, opacity: isPublished ? 0.6 : 1 }]} 
        multiline 
      />
      <TextInput 
        placeholder="Updates / Description" 
        placeholderTextColor={text} 
        value={method} 
        onChangeText={setMethod} 
        editable={!isPublished}
        style={[styles.textarea, { color: text, opacity: isPublished ? 0.6 : 1 }]} 
        multiline 
      />
      <View style={{ height: 12 }} />
      {!isPublished && (
        <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: tint }]}><Text style={{ color: '#fff', fontWeight: '700' }}>Save Changes</Text></TouchableOpacity>
      )}
      {isPublished && (
        <View style={[styles.saveBtn, { backgroundColor: '#95a5a6' }]}><Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>Cause Locked (Published)</Text></View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  input: { borderWidth: 1, borderColor: '#888', padding: 8, borderRadius: 8, marginBottom: 8, backgroundColor: 'transparent' },
  textarea: { borderWidth: 1, borderColor: '#888', padding: 8, borderRadius: 8, height: 120, textAlignVertical: 'top', marginBottom: 8, backgroundColor: 'transparent' },
  saveBtn: { padding: 12, backgroundColor: '#2ecc71', borderRadius: 8, alignItems: 'center' },
  pbtn: { padding: 8, borderRadius: 8, marginRight: 8, alignItems: 'center' },
  pbtnText: { color: '#fff', fontWeight: '700' }
});
