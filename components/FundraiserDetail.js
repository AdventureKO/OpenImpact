import React, { useContext, useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColor } from '../hooks/use-theme-color';
import { AuthContext } from '../context/AuthContext';
import * as storage from '../utils/storage';

export default function FundraiserDetail({ project, onBack }) {
  if (!project) return null;

  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');
  const border = useThemeColor({}, 'icon');
  const auth = useContext(AuthContext);
  const navigation = useNavigation();

  const [reviews, setReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const all = (await storage.load('reviews', [])) || [];
        const filtered = (all || []).filter(r => String(r.projectId || r.projectId || r.projectId) === String(project.id));
        setReviews(filtered);
      } catch (e) { console.warn('load reviews failed', e); }
    })();
  }, [project && project.id]);

  const saveReview = async () => {
    if (!reviewText.trim()) return Alert.alert('Validation', 'Please enter a review');
    const r = { id: `rev-${Date.now()}`, projectId: project.id, text: reviewText.trim(), createdAt: new Date().toISOString(), author: (auth && auth.user && (auth.user.name || auth.user.email)) || 'Anonymous' };
    try {
      const all = (await storage.load('reviews', [])) || [];
      await storage.save('reviews', [r, ...all]);
      setReviews([r, ...reviews]);
      setShowReviewModal(false);
      setReviewText('');
    } catch (e) { console.warn('save review failed', e); Alert.alert('Error', 'Could not save review'); }
  };

  const handleUnpublish = async () => {
    Alert.alert('Remove from public', 'Are you sure you want to remove this project from public projects?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
            const pub = await storage.load('publicFundraisers', []);
            const next = (pub || []).filter(r => String(r.id) !== String(project.id));
            await storage.save('publicFundraisers', next);
          Alert.alert('Removed', 'Cause removed from public list');
          if (typeof onBack === 'function') onBack();
        } catch (e) {
          console.warn('unpublish failed', e);
          Alert.alert('Error', 'Could not remove cause');
        }
      } }
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: bg, paddingTop: 8 }]}> 
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={[styles.backText, { color: tint }]}>← Back</Text>
        </TouchableOpacity>
      <View style={[styles.imageWrap, { borderColor: border }]}> 
        {project.image ? (
          <Image source={{ uri: project.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, { backgroundColor: '#ffffff' }]} />
        )}
      </View>
      <Text style={[styles.title, { color: text }]}>{project.name}</Text>
      {auth && auth.user && auth.user.isAdmin && project.published ? (
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <TouchableOpacity onPress={handleUnpublish} style={{ backgroundColor: '#c0392b', padding: 8, borderRadius: 8 }}><Text style={{ color: '#fff', fontWeight: '700' }}>Remove from Public</Text></TouchableOpacity>
        </View>
      ) : null}
      {project.tags && project.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {project.tags.map((t, i) => (
            <View key={i} style={[styles.tag, { borderColor: border }]}>
              <Text style={{ color: text }}>{t}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: text }]}>Items</Text>
      <View style={[styles.box, { backgroundColor: bg, borderColor: border }] }>
        {project.ingredients && project.ingredients.map((ing, idx) => (
          <Text key={idx} style={[styles.ingredient, { color: text }]}>{`• ${ing.amount || ''} ${ing.unit || ''} ${ing.name}`.trim()}</Text>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: text }]}>Description</Text>
      <View style={[styles.box, { backgroundColor: bg, borderColor: border }] }>
        <Text style={[styles.method, { color: text }]}>{(project.method || '').replace(/\n/g, '\n')}</Text>
      </View>
      <View style={{ marginTop: 12, paddingHorizontal: 16 }}>
        <TouchableOpacity onPress={() => navigation.navigate('Donate', { id: project.id })} style={{ backgroundColor: '#27ae60', padding: 12, borderRadius: 8 }}>
          <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>Donate</Text>
        </TouchableOpacity>
        <View style={{ height: 8 }} />
        <TouchableOpacity onPress={() => navigation.navigate('Upload', { projectId: project.id })} style={{ backgroundColor: '#8e44ad', padding: 10, borderRadius: 8 }}>
          <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>Upload File</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: text, marginTop: 16 }]}>Milestones</Text>
      <View style={[styles.box, { backgroundColor: bg, borderColor: border }] }>
        {project.milestones && project.milestones.length > 0 ? project.milestones.map((m, i) => (
          <Text key={i} style={{ color: text }}>{`• ${m.title} — ${m.progress || '0%'}`}</Text>
        )) : <Text style={{ color: text }}>No milestones yet.</Text>}
      </View>

      <Text style={[styles.sectionTitle, { color: text, marginTop: 16 }]}>Reviews</Text>
      <View style={[styles.box, { backgroundColor: bg, borderColor: border }] }>
        {reviews.length === 0 ? <Text style={{ color: text }}>No reviews yet.</Text> : reviews.map((r) => (
          <View key={r.id} style={{ marginBottom: 8 }}>
            <Text style={{ fontWeight: '700', color: text }}>{r.author}</Text>
            <Text style={{ color: text }}>{r.text}</Text>
            <Text style={{ color: text, fontSize: 12 }}>{new Date(r.createdAt).toLocaleString()}</Text>
          </View>
        ))}
        <TouchableOpacity onPress={() => setShowReviewModal(true)} style={[styles.btn, { marginTop: 8, backgroundColor: '#2980b9' }]}><Text style={{ color: '#fff' }}>Add Review</Text></TouchableOpacity>
      </View>

      <Modal visible={showReviewModal} animationType="slide" transparent>
        <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.4)' }}>
          <View style={{ width: '90%', backgroundColor: '#fff', padding: 12, borderRadius: 8 }}>
            <Text style={{ fontWeight: '700', marginBottom: 8 }}>Add Review</Text>
            <TextInput value={reviewText} onChangeText={setReviewText} placeholder="Your review" multiline style={{ borderWidth:1, borderColor:'#ddd', padding:8, minHeight:80, marginBottom:8 }} />
            <View style={{ flexDirection:'row', justifyContent:'flex-end' }}>
              <TouchableOpacity onPress={() => setShowReviewModal(false)} style={[styles.btn, { backgroundColor: '#95a5a6', marginRight: 8 }]}><Text style={{ color: '#fff' }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveReview} style={[styles.btn, { backgroundColor: '#27ae60' }]}><Text style={{ color: '#fff' }}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  imageWrap: { height: 200, borderRadius: 10, overflow: 'hidden', marginBottom: 12, borderWidth: 1 },
  image: { width: '100%', height: '100%' },
  tagsRow: { flexDirection: 'row', marginBottom: 12, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, marginRight: 8, marginBottom: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  box: { padding: 12, borderRadius: 8, borderWidth: 1 },
  ingredient: { marginBottom: 6 },
  method: { lineHeight: 20 }
});

