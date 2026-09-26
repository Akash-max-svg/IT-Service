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
import VantaCloudsBackground from './components/VantaCloudsBackground';
import Footer from './components/Footer';

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
    <div className={`theme-${currentTheme} h-screen w-full flex flex-col overflow-hidden relative selection:bg-amber-400 selection:text-slate-950`}>
      {/* 3D Interactive Vanta Clouds Background Layer across all roles */}
      <VantaCloudsBackground />

      {/* Dashboard UI Wrapper: fills entire viewport, header at top, body below */}
      <div className="relative z-10 flex flex-col h-full w-full overflow-hidden">
        {/* Top Navbar: Firmly fixed at the top, locked height 64px, never moves or collapses */}
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Dashboard Work Area: Sidebar on left + vertically scrollable content on right */}
        <div className="flex-1 flex overflow-hidden w-full relative">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <div
            id="main-dashboard-scroll-container"
            className="flex-1 h-full overflow-y-auto overflow-x-hidden flex flex-col min-w-0 bg-transparent"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              <Outlet />
            </main>
            <Footer />
          </div>
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
                  <ProtectedRoute allowedRoles={['Admin']}>
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
