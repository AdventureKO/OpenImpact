import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import RenderListItem from '../components/RenderListItem';

export default function MyCausesScreen({ projects = [], handleAddToFavorites, handleRemoveFromFavorites, onAddProject, onAddImage }) {
  return (
    <View style={{flex:1, padding:12}}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.btn} onPress={onAddImage}><Text style={styles.btnText}>Add Image</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onAddProject}><Text style={styles.btnText}>Add Cause</Text></TouchableOpacity>
      </View>
      <ScrollView>
        {projects.length ? projects.map((project) => (
          <RenderListItem
            key={project.id}
            item={project}
            isFavorite={project.favorite}
            deleteItem={() => console.warn('Delete not wired')}
            addToFavorites={() => handleAddToFavorites && handleAddToFavorites(project.id)}
            removeFromFavorites={() => handleRemoveFromFavorites && handleRemoveFromFavorites(project.id)}
            handleEdit={() => console.warn('Edit not wired')}
          />
        )) : <Text>No causes available.</Text>}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({ headerRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }, btn: { backgroundColor: '#f39c12', padding: 8, borderRadius: 8, marginLeft: 8 }, btnText: { color: '#fff' } });
