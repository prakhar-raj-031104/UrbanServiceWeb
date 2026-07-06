import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('urban_user') || 'null'); } catch { return null; }
  });

  // Re-validate the stored session on load
  useEffect(() => {
    if (!localStorage.getItem('urban_token')) return;
    api.auth.me()
      .then((d) => setUser(d.user))
      .catch(() => { localStorage.removeItem('urban_token'); localStorage.removeItem('urban_user'); setUser(null); });
  }, []);

  const persist = (token, u) => {
    localStorage.setItem('urban_token', token);
    localStorage.setItem('urban_user', JSON.stringify(u));
    setUser(u);
  };

  const value = {
    user,
    async login(phone, password) {
      const d = await api.auth.login(phone, password);
      persist(d.token, d.user);
    },
    async signup(payload) {
      const d = await api.auth.signup(payload);
      persist(d.token, d.user);
    },
    logout() {
      localStorage.removeItem('urban_token');
      localStorage.removeItem('urban_user');
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
