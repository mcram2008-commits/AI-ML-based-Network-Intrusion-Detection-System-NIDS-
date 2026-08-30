import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('nids_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('nids_access_token');
      if (token) {
        try {
          const res = await client.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('nids_user', JSON.stringify(res.data));
        } catch (err) {
          console.error("Auth check failed:", err);
          setUser(null);
          localStorage.removeItem('nids_user');
          localStorage.removeItem('nids_access_token');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    fetchCurrentUser();
  }, []);

  const login = async (username_or_email, password, remember_me = false) => {
    const res = await client.post('/auth/login', {
      username_or_email,
      password,
      remember_me
    });
    const { access_token, user: loggedUser } = res.data;
    localStorage.setItem('nids_access_token', access_token);
    localStorage.setItem('nids_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (formData) => {
    const res = await client.post('/auth/register', formData);
    return res.data;
  };

  const logout = async () => {
    try {
      await client.post('/auth/logout');
    } catch (err) {
      console.warn("Logout endpoint error:", err);
    } finally {
      localStorage.removeItem('nids_access_token');
      localStorage.removeItem('nids_user');
      setUser(null);
    }
  };

  const updateProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('nids_user', JSON.stringify(updatedUser));
  };

  const hasRole = (allowedRoles) => {
    if (!user) return false;
    if (typeof allowedRoles === 'string') return user.role === allowedRoles;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateProfile,
      hasRole,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
