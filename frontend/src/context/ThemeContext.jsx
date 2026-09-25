import React, { createContext, useContext, useMemo } from 'react';
import useAuth from '../hooks/useAuth';
import { normalizeRole } from '../utils/roleUtils';

export const ThemeContext = createContext();

export const THEME_CONFIGS = {
  admin: {
    id: 'admin',
    name: 'Executive Admin',
    shortName: 'Admin',
    accentColor: '#d97706',
    gradient: 'from-amber-500 via-yellow-500 to-amber-600',
    badgeClass: 'border-amber-300 bg-amber-50 text-amber-900',
    description: 'Crisp White & Royal Champagne Gold Command Center',
    iconName: 'Shield',
    positionTitle: 'Administrator Console',
  },
  employee: {
    id: 'employee',
    name: 'Employee Portal',
    shortName: 'Employee',
    accentColor: '#f59e0b',
    gradient: 'from-amber-400 via-yellow-500 to-amber-500',
    badgeClass: 'border-amber-300 bg-amber-50 text-amber-900',
    description: 'Crisp White & Radiant Sunlight Gold Workspace',
    iconName: 'Briefcase',
    positionTitle: 'Employee Service Desk',
  },
  agent: {
    id: 'agent',
    name: 'Agent Triage',
    shortName: 'Agent',
    accentColor: '#b45309',
    gradient: 'from-amber-500 via-amber-600 to-yellow-600',
    badgeClass: 'border-amber-300 bg-amber-50 text-amber-900',
    description: 'Crisp White & Tactical Amber Gold Operations',
    iconName: 'Headphones',
    positionTitle: 'Support Specialist Console',
  },
};

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();

  // Position is strictly locked to authenticated user role
  const currentTheme = useMemo(() => {
    const role = normalizeRole(user?.role);
    if (role === 'Admin') return 'admin';
    if (role === 'Agent') return 'agent';
    return 'employee';
  }, [user]);

  const themeConfig = THEME_CONFIGS[currentTheme] || THEME_CONFIGS.employee;

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        themeConfig,
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
