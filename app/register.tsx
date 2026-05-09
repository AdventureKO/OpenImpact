import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const { signUp } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    try {
      // basic client-side validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) return Alert.alert('Validation', 'Invalid email address');
      if ((password || '').length < 10) return Alert.alert('Validation', 'Password must be at least 10 characters');
      await signUp({ email: email.trim(), password, name });
      router.replace('/NavigationRoot');
    } catch (err) {
      Alert.alert('Register failed', err.message || String(err));
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Create account</Text>
      <TextInput placeholder="Name" placeholderTextColor="#666" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Email" placeholderTextColor="#666" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" />
      <TextInput placeholder="Password" placeholderTextColor="#666" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
      <TouchableOpacity style={styles.btn} onPress={handleRegister}><Text style={styles.btnText}>Register</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, justifyContent: 'center', backgroundColor: '#000' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12, color: '#fff' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 8, borderRadius: 6, color: '#000', backgroundColor: '#fff' },
  btn: { backgroundColor: '#27ae60', padding: 10, borderRadius: 6, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' }
});

