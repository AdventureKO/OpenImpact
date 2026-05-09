import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export default function FormScreen({ categories = {}, onSubmit }) {
  const [projectName, setProjectName] = useState('');
  const [method, setMethod] = useState('');
  const [tags, setTags] = useState('');
  const [ingredients, setIngredients] = useState([{ id: Date.now().toString(), name: '', amount: '', unit: '', category: '' }]);

  const addIngredient = () => setIngredients(prev => ([...prev, { id: Date.now().toString(), name: '', amount: '', unit: '', category: '' }]));
  const removeIngredient = (id) => setIngredients(prev => prev.filter(i => i.id !== id));
  const updateIngredient = (id, field, value) => setIngredients(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

  const handleSubmit = () => {
    const payload = {
      name: projectName,
      // legacy keys kept for compatibility
      method,
      ingredients,
      // new, clearer keys
      description: method,
      items: ingredients,
      tags: tags ? tags.split(',').map(t => t.trim()) : []
    };
    onSubmit && onSubmit(payload);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{projectName || 'Create Your Cause'}</Text>
      <TextInput placeholder="Name" value={projectName} onChangeText={setProjectName} style={styles.input} />
      <TextInput placeholder="Description" value={method} onChangeText={setMethod} style={[styles.input, {height: 120}]} multiline />
      <TextInput placeholder="Tags (comma-separated)" value={tags} onChangeText={setTags} style={styles.input} />

      <Text style={{fontWeight:'700', marginTop: 8}}>Items</Text>
      {ingredients.map((ing) => (
        <View key={ing.id} style={styles.ingRow}>
          <TextInput placeholder="Name" value={ing.name} onChangeText={(v)=> updateIngredient(ing.id, 'name', v)} style={[styles.input, {flex:1}]} />
          <TextInput placeholder="Amount" value={ing.amount} onChangeText={(v)=> updateIngredient(ing.id, 'amount', v)} style={[styles.input, {width:80, marginLeft:8}]} />
          <TouchableOpacity onPress={()=> removeIngredient(ing.id)} style={styles.delBtn}><Text style={{color:'white'}}>Del</Text></TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addBtn} onPress={addIngredient}><Text style={{color:'#fff'}}>+ Add Item</Text></TouchableOpacity>

      <View style={{flexDirection:'row', justifyContent:'space-between', marginTop: 12}}>
        <TouchableOpacity style={styles.cancelBtn}><Text>Cancel</Text></TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}><Text style={{color:'#fff'}}>Save Cause</Text></TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 12 },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#eee', padding: 8, borderRadius: 8, marginTop: 8 },
  ingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  delBtn: { backgroundColor: '#e74c3c', padding: 8, marginLeft: 8, borderRadius: 6 },
  addBtn: { backgroundColor: '#3498db', padding: 10, borderRadius: 8, marginTop: 12, alignItems: 'center' },
  cancelBtn: { padding: 10 },
  saveBtn: { backgroundColor: '#2ecc71', padding: 10, borderRadius: 8 }
});
