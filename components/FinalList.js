import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, Share, Platform } from 'react-native';
import { useThemeColor } from '../hooks/use-theme-color';
import { AuthContext } from '../context/AuthContext';
import EditableTextItem from './EditableTextItem';

export default function FinalList({ categories = {}, addItem, handleSavedLists, onRequireAuth } ) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [localCats, setLocalCats] = useState({});

  useEffect(() => {
    // create a deep copy so edits don't mutate prop directly
    const copy = {};
    Object.keys(categories || {}).forEach(k => {
      copy[k] = (categories[k] || []).map(it => ({ ...it }));
    });
    console.log('FinalList: received categories prop keys=', Object.keys(categories || {}).length);
    setLocalCats(copy);
  }, [categories]);

  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');
  const primary = useThemeColor({}, 'primary');
  const secondary = useThemeColor({}, 'secondary');
  const danger = useThemeColor({}, 'danger');
  const success = useThemeColor({}, 'success');
  const auth = useContext(AuthContext);
  const btnTextColor = useThemeColor({}, 'buttonText');
  const unitConvert = require('../utils/unitConvert');
  const [consolidated, setConsolidated] = useState([]);
  const [targetSystem, setTargetSystem] = useState('metric'); // 'metric' or 'customary'
  const [editingKey, setEditingKey] = useState(null);
  const [editDraft, setEditDraft] = useState({ name: '', amount: '', unit: '', category: '' });
  const [showFullModal, setShowFullModal] = useState(false);
  const [expandedConsolidated, setExpandedConsolidated] = useState({});
  const fullListRef = useRef(null);

  const handleSave = () => {
    // Save current localCats via parent handler. Allow saving even when not signed in;
    // parent (`FinalListPage`) will decide how to persist (user-scoped or global key).
    try {
      console.log('FinalList: handleSave invoked, localCats keys=', Object.keys(localCats || {}).length);
      if (!handleSavedLists) return Alert.alert('Error', 'Save handler not available');
      handleSavedLists(localCats);
    } catch (err) {
      console.warn('FinalList: save handler error', err);
      Alert.alert('Error', 'Could not save list.');
    }
  };

  const handleConsolidate = () => {
    try {
      const aggregated = unitConvert.sumIngredients(localCats, targetSystem === 'metric' ? 'metric' : 'customary');
      if (!aggregated || !aggregated.length) return Alert.alert('Consolidate', 'No items to consolidate');
      const lines = aggregated.map(a => `${a.name} (${a.amount}${a.unit ? a.unit : ''})`);
      Alert.alert(`Consolidated (${targetSystem === 'metric' ? 'Metric' : 'Customary'})`, lines.join('\n'));
    } catch (err) {
      console.warn('consolidate error', err);
      Alert.alert('Error', 'Could not consolidate items');
    }
  };

  const handleAddItem = () => {
    if (!newName.trim()) return Alert.alert('Validation', 'Please enter an item name');
    const cat = (newCategory || 'Uncategorized').trim() || 'Uncategorized';
    const copy = { ...localCats };
    if (!copy[cat]) copy[cat] = [];
    copy[cat].push({ name: newName.trim(), amount: 1, unit: 'none', type: 'dry' });
    setLocalCats(copy);
    setNewName('');
    setNewCategory('');
    setShowForm(false);
  };

  const startEdit = (category, index) => {
    const item = (localCats[category] || [])[index];
    if (!item) return;
    setEditingKey(`${category}::${index}`);
    setEditDraft({ name: item.name || '', amount: (item.amount || '').toString(), unit: item.unit || '', category });
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditDraft({ name: '', amount: '', unit: '', category: '' });
  };

  const saveEdit = (oldCategory, index) => {
    const draft = { ...editDraft };
    const catName = (draft.category || 'Uncategorized').trim() || 'Uncategorized';
    const copy = { ...localCats };
    const item = copy[oldCategory] && copy[oldCategory][index];
    if (!item) return cancelEdit();
    const updated = { ...item, name: draft.name, amount: parseFloat(String(draft.amount).replace(/[^0-9.\-]/g, '')) || draft.amount, unit: draft.unit || '', type: item.type || 'dry' };
    // remove original
    copy[oldCategory] = copy[oldCategory].filter((_, i) => i !== index);
    // place into new category
    if (!copy[catName]) copy[catName] = [];
    copy[catName].push(updated);
    setLocalCats(copy);
    cancelEdit();
  };

  const deleteFromEdit = (oldCategory, index) => {
    const copy = { ...localCats };
    if (!copy[oldCategory]) return cancelEdit();
    copy[oldCategory] = copy[oldCategory].filter((_, i) => i !== index);
    setLocalCats(copy);
    cancelEdit();
  };

  const handleChangeItemCategory = (oldCategory, index, newCategoryName) => {
    const catName = (newCategoryName || 'Uncategorized').trim() || 'Uncategorized';
    if (catName === oldCategory) return;
    const copy = { ...localCats };
    const item = copy[oldCategory] && copy[oldCategory][index];
    if (!item) return;
    // remove from old
    copy[oldCategory] = copy[oldCategory].filter((_, i) => i !== index);
    // ensure new category exists
    if (!copy[catName]) copy[catName] = [];
    copy[catName].push(item);
    setLocalCats(copy);
  };

  const handleEditItem = (category, index, field, value) => {
    const copy = { ...localCats };
    if (!copy[category]) return;
    const target = { ...copy[category][index] };
    if (field === 'amount') {
      const parsed = parseFloat(String(value).replace(/[^0-9.\-]/g, ''));
      target.amount = Number.isFinite(parsed) ? parsed : value;
    } else if (field === 'name') {
      target.name = value;
    } else if (field === 'unit') {
      target.unit = value;
    }
    copy[category][index] = target;
    setLocalCats(copy);
  };

  useEffect(() => {
    try {
      const agg = unitConvert.sumIngredients(localCats, targetSystem === 'metric' ? 'metric' : 'customary');
      setConsolidated(agg);
    } catch (err) {
      console.warn('consolidation calc error', err);
      setConsolidated([]);
    }
  }, [localCats, targetSystem]);

  const handleDeleteItem = (category, index) => {
    const copy = { ...localCats };
    if (!copy[category]) return;
    copy[category] = copy[category].filter((_, i) => i !== index);
    setLocalCats(copy);
  };

  return (
    <View style={{flex:1, backgroundColor: bg}}>
      <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setShowForm(s => !s)} style={[styles.btn, { backgroundColor: primary }]}><Text style={[styles.btnText, { color: btnTextColor }]}>{showForm ? 'Close' : 'Add Item'}</Text></TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={[styles.btn, { backgroundColor: secondary }]}><Text style={[styles.btnText, { color: btnTextColor }]}>Save List</Text></TouchableOpacity>
        </View>
      {showForm && (
        <View style={styles.formRow}>
          <TextInput placeholder="Item name" placeholderTextColor={text} value={newName} onChangeText={setNewName} style={[styles.input, { backgroundColor: bg, color: text, borderColor: '#888' }]} />
          <TextInput placeholder="Category (e.g. Produce)" placeholderTextColor={text} value={newCategory} onChangeText={setNewCategory} style={[styles.catInput, { backgroundColor: bg, color: text, borderColor: '#888' }]} />
          <TouchableOpacity style={[styles.btn, { backgroundColor: primary }]} onPress={handleAddItem}><Text style={[styles.btnText, { color: btnTextColor }]}>Add</Text></TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.list}>
        {Object.keys(localCats).sort((a, b) => a.localeCompare(b)).map(cat => (
          localCats[cat] && localCats[cat].length > 0 ? (
            <View key={cat} style={styles.categoryBox}>
                <Text style={[styles.categoryTitle, { color: text }]}>{cat}</Text>
              {localCats[cat].map((item, i) => {
                const key = `${cat}::${i}`;
                const isEditing = editingKey === key;
                return (
                  <View key={key} style={{ marginBottom: 8 }}>
                    {!isEditing ? (
                      <View style={[styles.itemBox, { backgroundColor: bg }]}> 
                        <View style={[styles.itemRow, { alignItems: 'center' }]}> 
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.itemName, { color: text }]} numberOfLines={1}>{item.name}</Text>
                          </View>
                          <Text style={[styles.itemSmall, { color: text }]}>{item.amount}</Text>
                          <Text style={[styles.itemSmall, { color: text, marginLeft: 8 }]}>{item.unit || ''}</Text>
                          <Text style={[styles.itemSmall, { color: text, marginLeft: 8, maxWidth: 120 }]} numberOfLines={1}>{cat}</Text>
                          <TouchableOpacity onPress={() => startEdit(cat, i)} style={[styles.actionSmall]}><Text style={{ fontSize: 20, color: tint }}>✎</Text></TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteItem(cat, i)} style={[styles.actionSmall]}><Text style={{ color: 'crimson' }}>✕</Text></TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.editPanel}>
                        <TextInput value={editDraft.name} onChangeText={(v) => setEditDraft(d => ({ ...d, name: v }))} placeholder="Name" placeholderTextColor={text} style={[styles.editInput, { color: text }]} />
                        <View style={{ flexDirection: 'row' }}>
                          <TextInput value={editDraft.amount} onChangeText={(v) => setEditDraft(d => ({ ...d, amount: v }))} placeholder="Amount" placeholderTextColor={text} style={[styles.editInputSmall, { color: text }]} />
                          <TextInput value={editDraft.unit} onChangeText={(v) => setEditDraft(d => ({ ...d, unit: v }))} placeholder="Unit" placeholderTextColor={text} style={[styles.editInputSmall, { color: text, marginLeft: 8 }]} />
                        </View>
                        <TextInput value={editDraft.category} onChangeText={(v) => setEditDraft(d => ({ ...d, category: v }))} placeholder="Category" placeholderTextColor={text} style={[styles.editInput, { color: text }]} />
                        <View style={{ flexDirection: 'row', marginTop: 8 }}>
                          <TouchableOpacity onPress={() => saveEdit(cat, i)} style={[styles.btn, { backgroundColor: success }]}><Text style={[styles.btnText]}>Save</Text></TouchableOpacity>
                          <TouchableOpacity onPress={() => deleteFromEdit(cat, i)} style={[styles.btn, { backgroundColor: danger, marginLeft: 8 }]}><Text style={[styles.btnText]}>Delete</Text></TouchableOpacity>
                          <TouchableOpacity onPress={cancelEdit} style={[styles.btn, { backgroundColor: secondary, marginLeft: 8 }]}><Text style={[styles.btnText]}>Cancel</Text></TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
          ) : null
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.systemRow}>
          <TouchableOpacity onPress={() => setTargetSystem('metric')} style={[styles.systemBtn, targetSystem==='metric' && { backgroundColor: primary }]}><Text style={{ color: targetSystem==='metric' ? '#fff' : text }}>Metric</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setTargetSystem('customary')} style={[styles.systemBtn, targetSystem==='customary' && { backgroundColor: primary }]}><Text style={{ color: targetSystem==='customary' ? '#fff' : text }}>Customary</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setShowFullModal(true)} style={[styles.btn, { backgroundColor: primary }]}><Text style={[styles.btnText, { color: btnTextColor }]}>Show Full List</Text></TouchableOpacity>
        </View>
        <View style={styles.consolidatedList}>
          <ScrollView style={{ maxHeight: 160 }}>
          {consolidated.length === 0 ? <Text style={{ color: text }}>No consolidated items</Text> : (
            consolidated.map((c, i) => (
              <View key={i} style={styles.consolidatedRow}>
                <TouchableOpacity onPress={() => setExpandedConsolidated(s => ({ ...s, [c.name]: !s[c.name] }))}>
                  <Text style={{ color: text }}>{c.name} ({c.amount}{c.unit ? c.unit : ''}) {c.sources && c.sources.length ? ` (${c.sources.length})` : ''}</Text>
                </TouchableOpacity>
                {expandedConsolidated[c.name] && c.sources && (
                  <View style={{ marginTop: 6 }}>
                    {c.sources.map((src, si) => (
                      <Text key={si} style={{ color: text, fontSize: 12 }}>{`${(src.ingredientLabel || src.name)} (${src.amount}${src.unit || ''}) - ${src.projectName || src.projectTitle || src.title || src.displayName || src.category}`}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
          </ScrollView>
        </View>
      </View>
      <Modal visible={showFullModal} animationType="slide">
        <View style={{flex:1, padding:16, backgroundColor: bg}}>
          <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12, paddingTop: Platform.OS==='android' ? 24 : 44}}>
            <Text style={{fontSize:18, fontWeight:'700', color: text}}>Donation List</Text>
            <View style={{flexDirection:'row'}}>
              <TouchableOpacity onPress={async () => {
                // Group consolidated items by category and format for sharing
                try {
                  const grouped = {};
                  (consolidated || []).forEach(c => {
                    const cat = (c.category || (c.sources && c.sources[0] && c.sources[0].category) || 'Uncategorized');
                    if (!grouped[cat]) grouped[cat] = [];
                    grouped[cat].push(c);
                  });
                  const sortedCats = Object.keys(grouped).sort((a,b) => a.localeCompare(b));
                  const lines = [];
                  sortedCats.forEach(cat => {
                    lines.push(`${cat}:`);
                    grouped[cat].forEach(it => {
                      const unit = it.unit ? it.unit : '';
                      lines.push(`- ${it.name} (${it.amount}${unit ? ' ' + unit : ''})`);
                    });
                    lines.push('');
                  });
                  const body = lines.join('\n');
                  await Share.share({ message: body });
                } catch (e) {
                  console.warn('share failed', e);
                  Alert.alert('Share failed');
                }
              }} style={[styles.btn, { backgroundColor: secondary, marginRight: 8 }]}><Text style={[styles.btnText, { color: btnTextColor }]}>Share</Text></TouchableOpacity>
              {/* Save Image removed: use Save PDF via expo-print / expo-sharing as reliable fallback */}
              <TouchableOpacity onPress={async () => {
                // Create a simple HTML representation and print-to-file, then share
                try {
                  const Print = require('expo-print');
                  const Sharing = require('expo-sharing');
                  // Group consolidated items by category
                  const grouped = {};
                  consolidated.forEach(c => {
                    const cat = (c.category || 'Uncategorized');
                    if (!grouped[cat]) grouped[cat] = [];
                    grouped[cat].push(c);
                  });
                  // Sort categories alphabetically
                  const sortedCats = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
                  const htmlRows = sortedCats.map(cat => {
                    const catHtml = grouped[cat].map(c => {
                      const sources = (c.sources || []).map(s => `<li>${(s.ingredientLabel || s.name)} (${s.amount}${s.unit ? s.unit : ''}) - ${s.projectName || s.category}</li>`).join('');
                      return `<li><strong>${c.name} (${c.amount}${c.unit ? c.unit : ''})</strong>${sources ? `<ul>${sources}</ul>` : ''}</li>`;
                    }).join('');
                    return `<h3>${cat}</h3><ul>${catHtml}</ul>`;
                  }).join('');
                  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1" /><style>body{font-family: Arial, Helvetica, sans-serif; padding:16px} h1{font-size:20px} h3{font-size:16px; margin-top:16px; margin-bottom:8px}</style></head><body><h1>Donation List</h1>${htmlRows}</body></html>`;
                  const { uri } = await Print.printToFileAsync({ html });
                  if (!uri) return Alert.alert('PDF', 'Could not generate PDF');
                  const available = await Sharing.isAvailableAsync();
                  await Sharing.shareAsync(uri);
                } catch (err) {
                  console.warn('pdf save failed', err);
                  Alert.alert('PDF failed', `${err && err.message ? err.message : String(err)}`);
                }
              }} style={[styles.btn, { backgroundColor: primary, marginRight: 8 }]}><Text style={[styles.btnText]}>Save PDF</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setShowFullModal(false)} style={[styles.btn, { backgroundColor: secondary }]}><Text style={[styles.btnText]}>Close</Text></TouchableOpacity>
            </View>
          </View>
          <View ref={fullListRef} collapsable={false} style={{ flex: 1 }}>
            <ScrollView>
              {consolidated.length === 0 ? <Text style={{ color: text }}>No items</Text> : (() => {
                // Group consolidated items by category
                const grouped = {};
                consolidated.forEach(c => {
                  const cat = (c.category || 'Uncategorized');
                  if (!grouped[cat]) grouped[cat] = [];
                  grouped[cat].push(c);
                });
                // Sort categories alphabetically
                const sortedCats = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
                return sortedCats.map(cat => (
                  <View key={cat}>
                    <Text style={{ color: text, fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 }}>{cat}</Text>
                    {grouped[cat].map((c, i) => (
                      <View key={i} style={{ paddingVertical: 8, paddingLeft: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
                        <Text style={{ color: text, fontSize: 16 }}>{c.name} ({c.amount}{c.unit ? c.unit : ''})</Text>
                        {c.sources && c.sources.length > 0 && (
                          <View style={{ marginTop: 6 }}>
                            {c.sources.map((s, si) => <Text key={si} style={{ color: text, fontSize: 12, marginLeft: 8 }}>{`${s.ingredientLabel || s.name} (${s.amount}${s.unit || ''}) - ${s.projectName || s.category}`}</Text>)}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                ));
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  btn: { padding: 8, backgroundColor: '#2ecc71', borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
  formRow: { flexDirection: 'row', paddingHorizontal: 12, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 8, marginRight: 8, borderRadius: 6 },
  list: { padding: 12 },
  categoryBox: { marginBottom: 12 },
  categoryTitle: { fontWeight: '700', marginBottom: 6 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }
  ,
  footer: { borderTopWidth: 1, borderColor: '#ddd', padding: 12 },
  systemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  systemBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#ccc' },
  systemActive: { backgroundColor: '#34495e' },
  consolidatedList: { maxHeight: 160 }
  ,
  itemName: { fontSize: 16, paddingRight: 8 },
  itemSmall: { fontSize: 14, width: 56, textAlign: 'right' },
  actionSmall: { paddingHorizontal: 8, paddingVertical: 4, marginLeft: 6 },
  editPanel: { padding: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, backgroundColor: '#f8f8f8' },
  editInput: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, marginBottom: 6 },
  editInputSmall: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, flex: 1 }
  ,
  itemBox: { borderWidth: 1, borderColor: '#e1e1e1', padding: 8, borderRadius: 8 },
  consolidatedRow: { paddingVertical: 6, borderBottomWidth: 1, borderColor: '#eee' }
});

