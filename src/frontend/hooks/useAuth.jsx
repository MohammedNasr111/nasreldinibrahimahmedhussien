import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { checkAuth, login as apiLogin, logout as apiLogout } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isEditor, setIsEditor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth()
      .then((data) => setIsEditor(data.isEditor))
      .catch(() => setIsEditor(false))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.body.classList.toggle('edit-mode', isEditor);
  }, [isEditor]);

  const login = useCallback(async (password) => {
    await apiLogin(password);
    setIsEditor(true);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setIsEditor(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isEditor, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
