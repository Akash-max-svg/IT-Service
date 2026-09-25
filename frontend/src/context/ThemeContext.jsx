import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { normalizeRole } from '../utils/roleUtils';

export const ThemeContext = createContext();

export const THEME_CONFIGS = {
  admin: {
    id: 'admin',
    name: 'Executive Admin',
    shortName: 'Admin',
    accentColor: '#a855f7',
    gradient: 'from-purple-600 via-fuchsia-600 to-indigo-600',
    badgeClass: 'border-purple-500/40 bg-purple-500/15 text-purple-300',
    description: 'Royal Obsidian & Deep Velvet Violet Command Center',
    iconName: 'Shield',
  },
  employee: {
    id: 'employee',
    name: 'Employee Portal',
    shortName: 'Employee',
    accentColor: '#0ea5e9',
    gradient: 'from-sky-600 via-blue-600 to-indigo-600',
    badgeClass: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
    description: 'Modern Oceanic Midnight & Electric Sapphire Workspace',
    iconName: 'Briefcase',
  },
  agent: {
    id: 'agent',
    name: 'Agent Triage',
    shortName: 'Agent',
    accentColor: '#10b981',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    badgeClass: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    description: 'Tactical Cyber Matrix & Emerald Aurora Operations',
    iconName: 'Headphones',
  },
};

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Mode: 'auto' (follow active role/page) or explicit 'admin' | 'employee' | 'agent'
  const [themeMode, setThemeModeState] = useState(() => {
    return localStorage.getItem('portal_theme_preference') || 'auto';
  });

  const setThemeMode = (mode) => {
    setThemeModeState(mode);
    localStorage.setItem('portal_theme_preference', mode);
  };

  // Determine current active theme
  const getComputedTheme = () => {
    if (themeMode !== 'auto' && THEME_CONFIGS[themeMode]) {
      return themeMode;
    }

    const pathname = location.pathname.toLowerCase();

    // Check pathname context first
    if (pathname.startsWith('/admin') || pathname.startsWith('/users')) {
      return 'admin';
    }
    if (pathname.startsWith('/agent')) {
      return 'agent';
    }
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/create-ticket')) {
      return 'employee';
    }

    // Default to user's normalized role for shared pages like /my-tickets, /reports, /settings
    const role = normalizeRole(user?.role);
    if (role === 'Admin') return 'admin';
    if (role === 'Agent') return 'agent';
    return 'employee';
  };

  const currentTheme = getComputedTheme();
  const themeConfig = THEME_CONFIGS[currentTheme] || THEME_CONFIGS.employee;

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        themeConfig,
        themeMode,
        setThemeMode,
        availableThemes: THEME_CONFIGS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
