import React, { createContext, useState, useEffect } from 'react';
import { authAPI, getSocket } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.token) {
            // Validate token against backend
            try {
              const { data: verifiedUser } = await authAPI.getMe();
              const fullUserData = { ...parsed, ...verifiedUser, token: parsed.token };
              setUser(fullUserData);
              localStorage.setItem('user', JSON.stringify(fullUserData));

              // Register with real-time socket
              const socket = getSocket();
              socket.emit('join_user', fullUserData._id);
              if (['Agent', 'Admin'].includes(fullUserData.role)) {
                socket.emit('join_support');
              }
            } catch (err) {
              // Token invalid or user no longer exists in DB (e.g. after DB switch to Atlas)
              console.warn('Session expired or invalidated. Clearing session.', err.message);
              localStorage.removeItem('user');
              setUser(null);
            }
          } else {
            localStorage.removeItem('user');
            setUser(null);
          }
        } catch (err) {
          console.error('Failed to parse auth state', err);
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    setUser(data);
    localStorage.setItem('user', JSON.stringify(data));

    // Connect socket
    const socket = getSocket();
    socket.emit('join_user', data._id);
    if (['Agent', 'Admin'].includes(data.role)) {
      socket.emit('join_support');
    }

    return data;
  };

  const register = async (userData) => {
    const { data } = await authAPI.register(userData);
    return data;
  };

  const verifyEmail = async (email, code) => {
    const { data } = await authAPI.verifyEmail({ email, code });
    if (data.token) {
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));

      const socket = getSocket();
      socket.emit('join_user', data._id);
      if (['Agent', 'Admin'].includes(data.role)) {
        socket.emit('join_support');
      }
    }
    return data;
  };

  const resendCode = async (email) => {
    const { data } = await authAPI.resendCode({ email });
    return data;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const updateUserState = (updated) => {
    const merged = { ...user, ...updated };
    setUser(merged);
    localStorage.setItem('user', JSON.stringify(merged));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyEmail,
        resendCode,
        logout,
        updateUserState,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'Admin',
        isAgent: ['Agent', 'Admin'].includes(user?.role),
        isEmployee: user?.role === 'Employee',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
