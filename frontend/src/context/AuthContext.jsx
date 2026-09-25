import React, { createContext, useState, useEffect } from 'react';
import { authAPI, getSocket } from '../services/api';
import { normalizeRole } from '../utils/roleUtils';

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
            // Optimistically restore session so UI is immediately usable
            setUser(parsed);

            // Connect socket with existing token
            try {
              const socket = getSocket();
              if (socket && !socket.connected) {
                socket.connect();
              }
              socket.emit('join_user', parsed._id);
              if (['Agent', 'Admin'].includes(parsed.role)) {
                socket.emit('join_support');
              }
            } catch (sockErr) {
              console.warn('Socket connection deferred:', sockErr.message);
            }

            // Verify and refresh profile in background
            try {
              const { data: verifiedUser } = await authAPI.getMe();
              const fullUserData = { ...parsed, ...verifiedUser, token: parsed.token };
              setUser(fullUserData);
              localStorage.setItem('user', JSON.stringify(fullUserData));
            } catch (err) {
              // ONLY clear session if server actively rejected token as 401 Unauthorized
              if (err.response && err.response.status === 401) {
                console.warn('JWT session expired or invalid. Logging out.');
                localStorage.removeItem('user');
                setUser(null);
              } else {
                // Network error, backend cold start / waking up
                console.warn('Backend server waking up or network unavailable; keeping active session:', err.message);
              }
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
    try {
      const socket = getSocket();
      if (socket && !socket.connected) {
        socket.connect();
      }
      socket.emit('join_user', data._id);
      if (['Agent', 'Admin'].includes(data.role)) {
        socket.emit('join_support');
      }
    } catch (e) {
      console.warn('Socket connection deferred on login:', e.message);
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

      try {
        const socket = getSocket();
        if (socket && !socket.connected) {
          socket.connect();
        }
        socket.emit('join_user', data._id);
        if (['Agent', 'Admin'].includes(data.role)) {
          socket.emit('join_support');
        }
      } catch (e) {
        console.warn('Socket connection deferred on verify:', e.message);
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
    try {
      const socket = getSocket();
      if (socket) {
        socket.disconnect();
      }
    } catch (e) {
      // ignore
    }
    window.location.href = '/login';
  };

  const updateUserState = (updated) => {
    const merged = { ...user, ...updated };
    setUser(merged);
    localStorage.setItem('user', JSON.stringify(merged));
  };

  const userRole = normalizeRole(user?.role);
  const isAdmin = userRole === 'Admin';
  const isAgent = userRole === 'Agent' || userRole === 'Admin';
  const isEmployee = userRole === 'Employee';

  return (
    <AuthContext.Provider
      value={{
        user: user ? { ...user, role: userRole } : null,
        userRole,
        loading,
        login,
        register,
        verifyEmail,
        resendCode,
        logout,
        updateUserState,
        isAuthenticated: !!user,
        isAdmin,
        isAgent,
        isEmployee,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
