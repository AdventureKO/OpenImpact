import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Platform, StatusBar, TouchableOpacity, Alert, Modal, SafeAreaView } from 'react-native';
import SearchBar from './SearchBar';
import ProfileDropdown from './ProfileDropdown';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import LoginScreen from '../app/login';
import { useThemeColor } from '../hooks/use-theme-color';

export default function Navbar({ query, onQueryChange, favoritesOnly, onToggleFavorites, onLogout }) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const primary = useThemeColor({}, 'primary');
  const auth = useContext(AuthContext);
  const router = useRouter();
  // use a larger top padding to avoid status-bar overlap on various devices
  const topPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

  return (
    <View style={[styles.container, { backgroundColor: bg, paddingTop: topPadding }]}> 
      {/* Logo image: use provided projectdialogo.png */}
      <Image source={require('../assets/images/projectdialogo.png')} style={styles.logo} />
      <View style={styles.center}>
      <SearchBar 
        value={query} 
        onChange={onQueryChange} 
        favoritesOnly={favoritesOnly} 
        onToggleFavorites={onToggleFavorites} 
      />
      </View>
      {auth && auth.user ? (
        <ProfileDropdown onLogout={onLogout} />
      ) : (
        <>
        <TouchableOpacity
          onPress={() => { 
            console.log('Navbar: Login button tapped - opening modal');
            setShowLoginModal(true);
          }}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          accessibilityRole="button"
        >
          <Text style={{ color: primary, fontWeight: '600' }}>Login</Text>
        </TouchableOpacity>
        <Modal visible={showLoginModal} animationType="slide">
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700' }}>Login</Text>
              <TouchableOpacity onPress={() => setShowLoginModal(false)} style={{ padding: 8 }}><Text style={{ color: primary }}>Close</Text></TouchableOpacity>
            </View>
            <LoginScreen onSuccess={() => setShowLoginModal(false)} onRegister={() => { setShowLoginModal(false); setShowRegisterModal(true); }} />
          </SafeAreaView>
        </Modal>
        <Modal visible={showRegisterModal} animationType="slide">
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700' }}>Create account</Text>
              <TouchableOpacity onPress={() => setShowRegisterModal(false)} style={{ padding: 8 }}><Text style={{ color: primary }}>Close</Text></TouchableOpacity>
            </View>
            {/* lazy-import register screen to avoid cycles */}
            {/**/}
            {React.createElement(require('../app/register').default)}
          </SafeAreaView>
        </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 6, justifyContent: 'space-between', minHeight: 50 },
  title: { fontSize: 18, fontWeight: '700', marginTop: 6 },
  center: { flex: 1, paddingHorizontal: 12 },
  logo: { width: 130, height: 30, resizeMode: 'contain', backgroundColor: '#fff', borderRadius: 4 }
});

