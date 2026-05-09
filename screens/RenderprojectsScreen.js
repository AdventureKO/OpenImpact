import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import RenderListItem from '../components/RenderListItem';

export default function RenderFundraisersScreen({ navigation, projects = [], createIngredientsList, handleDeleteProject, handleAddToFavorites, handleRemoveFromFavorites, handleSavedLists, isFavorite }) {
  return (
    <View style={{flex:1, padding: 12}}>
      <FlatList
        data={projects}
        keyExtractor={(i) => i.id}
        renderItem={({item}) => (
          <RenderListItem
            item={item}
            isFavorite={isFavorite ? isFavorite(item.id) : false}
            deleteItem={handleDeleteProject}
            addToFavorites={() => handleAddToFavorites && handleAddToFavorites(item.id)}
            removeFromFavorites={() => handleRemoveFromFavorites && handleRemoveFromFavorites(item.id)}
            onPress={(rec) => navigation.navigate('Detail', { project: rec })}
          />
        )}
      />
      <View style={styles.footerRow}>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('FinalList')}><Text style={styles.btnText}>Generate Donation List</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('MyProjects')}><Text style={styles.btnText}>My Causes</Text></TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({ footerRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 12 }, btn: { backgroundColor: '#2ecc71', padding: 10, borderRadius: 8 }, btnText: { color: '#fff' } });
