import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import useAuth from './hooks/useAuth';
import ProtectedRoute from './routes/ProtectedRoute';
import { normalizeRole } from './utils/roleUtils';

// Layout Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateTicket from './pages/CreateTicket';
import MyTickets from './pages/MyTickets';
import TicketDetails from './pages/TicketDetails';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentTheme } = useTheme();

  return (
    <div className={`theme-${currentTheme} min-h-screen flex flex-col bg-slate-50 text-slate-900 transition-colors duration-300 relative selection:bg-amber-400 selection:text-slate-950`}>
      {/* Background Ambient Decorative Light Orbs tailored for White & Gold */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-amber-400/10 blur-[130px]" />
        <div className="absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-yellow-500/10 blur-[140px]" />
        <div className="absolute -bottom-20 left-1/3 h-96 w-96 rounded-full bg-amber-300/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex flex-1">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

// Root index redirector based on user role
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const role = normalizeRole(user.role);
  if (role === 'Admin') return <Navigate to="/admin" replace />;
  if (role === 'Agent') return <Navigate to="/agent" replace />;
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ThemeProvider>
          <Routes>
            {/* Public Authentication Routes - Untouched Vanta/Canvas UI */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Application Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<RootRedirect />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['Employee']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-ticket"
                element={
                  <ProtectedRoute allowedRoles={['Employee']}>
                    <CreateTicket />
                  </ProtectedRoute>
                }
              />
              <Route path="/my-tickets" element={<MyTickets />} />
              <Route path="/tickets/:id" element={<TicketDetails />} />
              <Route
                path="/agent"
                element={
                  <ProtectedRoute allowedRoles={['Agent']}>
                    <AgentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={['Agent', 'Admin']}>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ThemeProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
