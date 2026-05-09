import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import * as auth from '../utils/auth';
import { useRouter } from 'expo-router';

export default function LoginScreen({ onSuccess, onRegister } = {}) {
  const { signIn } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await signIn(email.trim(), password);
      if (typeof onSuccess === 'function') {
        try { onSuccess(); } catch (e) { console.warn('onSuccess callback error', e); }
      } else {
        router.replace('/NavigationRoot');
      }
    } catch (err) {
      Alert.alert('Login failed', err.message || String(err));
    }
  };

  // Password reset flow (in-app): request token then reset
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');

  const requestReset = async () => {
    try {
      const emailTrim = resetEmail.trim() || email.trim();
      if (!emailTrim) return Alert.alert('Validation', 'Enter an email');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrim)) return Alert.alert('Validation', 'Invalid email address');
      const token = await auth.initiatePasswordReset(emailTrim);
      // in production the token would be emailed; here we show it to the user
      Alert.alert('Reset token', `Reset token (for demo): ${token}`);
    } catch (err) {
      Alert.alert('Reset failed', err.message || String(err));
    }
  };

  const applyReset = async () => {
    try {
      if (!resetToken || !resetNewPassword) return Alert.alert('Validation', 'Enter token and new password');
      if ((resetNewPassword || '').length < 10) return Alert.alert('Validation', 'Password must be at least 10 characters');
      await auth.resetPassword(resetEmail.trim() || email.trim(), resetToken.trim(), resetNewPassword);
      Alert.alert('Success', 'Password reset. You can now sign in with the new password.');
      setResetEmail(''); setResetToken(''); setResetNewPassword('');
    } catch (err) {
      Alert.alert('Reset failed', err.message || String(err));
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Login</Text>
      <TextInput placeholder="Email" placeholderTextColor="#666" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" />
      <TextInput placeholder="Password" placeholderTextColor="#666" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
      <TouchableOpacity style={styles.btn} onPress={handleLogin}><Text style={styles.btnText}>Sign In</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => {
        if (typeof onRegister === 'function') return onRegister();
        return router.push('/register');
      }} style={{ marginTop: 12 }}><Text style={{ color: '#3498db' }}>Create an account</Text></TouchableOpacity>
      <View style={{ marginTop: 18 }}>
        <Text style={{ color: '#fff', marginBottom: 6 }}>Forgot password?</Text>
        <TextInput placeholder="Email (optional)" placeholderTextColor="#666" value={resetEmail} onChangeText={setResetEmail} style={[styles.input, { backgroundColor: '#fff' }]} autoCapitalize="none" />
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#f39c12', marginBottom: 8 }]} onPress={requestReset}><Text style={styles.btnText}>Request Reset Token</Text></TouchableOpacity>
        <TextInput placeholder="Reset token" placeholderTextColor="#666" value={resetToken} onChangeText={setResetToken} style={[styles.input, { backgroundColor: '#fff' }]} />
        <TextInput placeholder="New password" placeholderTextColor="#666" value={resetNewPassword} onChangeText={setResetNewPassword} style={[styles.input, { backgroundColor: '#fff' }]} secureTextEntry />
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#2980b9' }]} onPress={applyReset}><Text style={styles.btnText}>Apply Reset</Text></TouchableOpacity>
      </View>
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

