import React, { createContext, useState, useEffect } from 'react';
import * as auth from '../utils/auth';
import * as localStore from '../utils/localStorage';

export const AuthContext = createContext({ user: null, signIn: async () => {}, signOut: async () => {}, signUp: async () => {} });

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // ensure an admin account exists for moderation
        if (typeof auth.ensureAdminExists === 'function') await auth.ensureAdminExists();
      } catch (e) { console.warn('AuthContext.ensureAdminExists failed', e); }
      const u = await auth.getCurrentUser();
      console.log('AuthContext: loaded current user=', u && u.email ? u.email : null, 'isAdmin=', u && u.isAdmin);
      setUser(u);
      setLoading(false);
    })();
  }, []);

  const signIn = async (email, password) => {
    const u = await auth.loginUser(email, password);
    console.log('AuthContext.signIn: signed in', u && u.email);
    setUser(u);
    try { await localStore.setUser(u); } catch (e) { console.warn('localStore setUser failed', e); }
    return u;
  };

  const signUp = async ({ email, password, name }) => {
    const u = await auth.registerUser({ email, password, name });
    console.log('AuthContext.signUp: registered and signed in', u && u.email);
    setUser(u);
    try { await localStore.setUser(u); } catch (e) { console.warn('localStore setUser failed', e); }
    return u;
  };

  const signOut = async () => {
    await auth.logoutUser();
    console.log('AuthContext.signOut: signing out');
    setUser(null);
    try { await localStore.setUser(null); } catch (e) { console.warn('localStore clear user failed', e); }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

