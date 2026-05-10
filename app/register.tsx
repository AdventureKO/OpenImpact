import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { USER_ROLE } from '@/constants/userRoles';

export default function RegisterScreen() {
  const { signUp } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>(USER_ROLE.CONTRIBUTOR);
  const router = useRouter();

  const handleRegister = async () => {
    try {
      // basic client-side validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) return Alert.alert('Validation', 'Invalid email address');
      if ((password || '').length < 10) return Alert.alert('Validation', 'Password must be at least 10 characters');
      await signUp({ email: email.trim(), password, name, role });
      router.replace('/NavigationRoot');
    } catch (err) {
      Alert.alert('Register failed', err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.hint}>Choose how you will use OpenImpact.</Text>
      <View style={styles.roleRow}>
        <TouchableOpacity
          style={[styles.roleChip, role === USER_ROLE.CONTRIBUTOR && styles.roleChipOn]}
          onPress={() => setRole(USER_ROLE.CONTRIBUTOR)}
        >
          <Text style={[styles.roleTitle, role === USER_ROLE.CONTRIBUTOR && styles.roleTitleOn]}>Contributor</Text>
          <Text style={styles.roleSub}>Donate and track every dollar through to impact.</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleChip, role === USER_ROLE.ORGANIZATION && styles.roleChipOn]}
          onPress={() => setRole(USER_ROLE.ORGANIZATION)}
        >
          <Text style={[styles.roleTitle, role === USER_ROLE.ORGANIZATION && styles.roleTitleOn]}>Organization</Text>
          <Text style={styles.roleSub}>Run causes, record funds, and post transparency updates.</Text>
        </TouchableOpacity>
      </View>
      <TextInput placeholder="Name or organization name" placeholderTextColor="#666" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Email" placeholderTextColor="#666" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" />
      <TextInput placeholder="Password" placeholderTextColor="#666" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
      <TouchableOpacity style={styles.btn} onPress={handleRegister}><Text style={styles.btnText}>Register</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, justifyContent: 'center', backgroundColor: '#000' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8, color: '#fff' },
  hint: { color: '#bbb', marginBottom: 12, fontSize: 14 },
  roleRow: { gap: 10, marginBottom: 14 },
  roleChip: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#111',
  },
  roleChipOn: { borderColor: '#27ae60', backgroundColor: '#0d2818' },
  roleTitle: { color: '#fff', fontWeight: '800', fontSize: 16, marginBottom: 4 },
  roleTitleOn: { color: '#6ee7b7' },
  roleSub: { color: '#aaa', fontSize: 12, lineHeight: 18 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 8, borderRadius: 6, color: '#000', backgroundColor: '#fff' },
  btn: { backgroundColor: '#27ae60', padding: 10, borderRadius: 6, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});

