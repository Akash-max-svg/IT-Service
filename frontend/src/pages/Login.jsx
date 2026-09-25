import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import * as THREE from 'three';
import VantaNet from 'vanta/dist/vanta.net.min';
import useAuth from '../hooks/useAuth';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Headphones,
  UserCheck,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  User,
  Building2,
  Phone,
  Briefcase,
} from 'lucide-react';

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [activeTab, setActiveTab] = useState('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form state (supporting all roles: Employee, Agent, Admin)
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Employee',
    departmentName: 'Information Technology',
    phone: '',
    specialization: '',
  });

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Check if routed with prefilled email or success message from registration
  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMsg(location.state.successMessage);
    }
    if (location.state?.prefilledEmail) {
      setEmail(location.state.prefilledEmail);
    }
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'register') {
      setActiveTab('register');
    }
  }, [location.state, location.search]);

  const vantaRef = useRef(null);
  const effectRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.THREE = THREE;
    }

    const netInit = VantaNet.default || VantaNet;
    if (!effectRef.current && vantaRef.current) {
      try {
        effectRef.current = netInit({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          color: 0x10b981,
          backgroundColor: 0x020617,
          backgroundAlpha: 0.35,
          points: 12.0,
          maxDistance: 22.0,
          spacing: 16.0,
          showDots: true,
        });
      } catch (err) {
        console.error('Failed to init Vanta on Login:', err);
      }
    }

    return () => {
      if (effectRef.current) {
        effectRef.current.destroy();
        effectRef.current = null;
      }
    };
  }, []);

  // 1-Click Demo accounts that exist in MongoDB
  const handleQuickDemo = (demoEmail, demoPass) => {
    setActiveTab('login');
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setSuccessMsg('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      // POST /api/auth/login -> verifies against MongoDB with bcrypt.compare
      const user = await login(email, password);
      redirectByRole(user.role);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (regData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (regData.password !== regData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      // POST /api/auth/register -> hashes with bcrypt and stores in MongoDB
      const res = await register({
        name: regData.name,
        email: regData.email,
        password: regData.password,
        role: regData.role,
        departmentName: regData.departmentName,
        phone: regData.phone,
        specialization: regData.specialization,
      });

      // Switch to login tab and prefill the email
      setEmail(regData.email);
      setPassword('');
      setActiveTab('login');
      setSuccessMsg(res.message || 'Registration successful! Please sign in with your credentials.');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const redirectByRole = (role) => {
    if (role === 'Admin') navigate('/admin');
    else if (role === 'Agent') navigate('/agent');
    else navigate('/dashboard');
  };

  return (
    <div
      ref={vantaRef}
      className="signup-page relative flex min-h-screen items-center justify-center bg-slate-950 p-4 sm:p-6 lg:p-8 overflow-hidden"
    >
      {/* Background image layer beneath Vanta network */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1920&q=80')",
        }}
      />

      <div className={`relative w-full ${activeTab === 'register' ? 'max-w-xl' : 'max-w-md'} z-10 transition-all duration-300 pointer-events-auto`}>
        <div className="rounded-3xl p-6 sm:p-9 bg-slate-950/90 border border-slate-800/90 shadow-2xl backdrop-blur-2xl text-white">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white shadow-xl shadow-emerald-600/30 scale-105">
              <span className="font-mono text-2xl font-extrabold tracking-wider">IT</span>
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-white tracking-tight sm:text-3xl">
              ServiceDesk <span className="text-emerald-400">Pro</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Enterprise Incident Management & SLA Center
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="mt-6 flex rounded-2xl bg-slate-900/90 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register Account
            </button>
          </div>

          {/* Quick Demo Logins Bar (Visible on login tab) */}
          {activeTab === 'login' && (
            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-3 shadow-inner">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1.5 font-mono">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>1-Click Demo Accounts (MongoDB Verified)</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin@servicedesk.com', 'Admin@123')}
                  className="flex flex-col items-center justify-center rounded-xl border border-teal-500/30 bg-teal-950/40 p-2 text-xs text-teal-300 hover:bg-teal-900/60 transition-all hover:scale-105"
                >
                  <ShieldCheck className="h-4 w-4 mb-1 text-teal-400" />
                  <span className="font-bold">Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('agent@servicedesk.com', 'Agent@123')}
                  className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-2 text-xs text-emerald-300 hover:bg-emerald-900/60 transition-all hover:scale-105"
                >
                  <Headphones className="h-4 w-4 mb-1 text-emerald-400" />
                  <span className="font-bold">Agent</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('employee@servicedesk.com', 'Employee@123')}
                  className="flex flex-col items-center justify-center rounded-xl border border-sky-500/30 bg-sky-950/40 p-2 text-xs text-sky-300 hover:bg-sky-900/60 transition-all hover:scale-105"
                >
                  <UserCheck className="h-4 w-4 mb-1 text-sky-400" />
                  <span className="font-bold">Employee</span>
                </button>
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {error && (
            <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 shadow-md animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 shadow-md animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'login' ? (
            /* ==================== SIGN IN FORM ==================== */
            <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/90 py-3 pl-11 pr-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/90 py-3 pl-11 pr-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 transition-all"
              >
                {submitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Sign In to ServiceDesk</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="mt-5 text-center text-xs text-slate-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setError('');
                  }}
                  className="font-bold text-emerald-400 hover:text-emerald-300"
                >
                  Create one now
                </button>
              </div>
            </form>
          ) : (
            /* ==================== REGISTER FORM ==================== */
            <form onSubmit={handleRegisterSubmit} className="mt-5 space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Select Your Role / Position
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegData({ ...regData, role: 'Employee' })}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 transition-all ${
                      regData.role === 'Employee'
                        ? 'border-sky-500 bg-sky-950/60 text-sky-200 ring-2 ring-sky-500/30'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <UserCheck className="h-5 w-5 mb-1 text-sky-400" />
                    <span className="text-xs font-bold">Employee</span>
                    <span className="text-[10px] text-slate-500">Submit Issues</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegData({ ...regData, role: 'Agent' })}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 transition-all ${
                      regData.role === 'Agent'
                        ? 'border-emerald-500 bg-emerald-950/60 text-emerald-200 ring-2 ring-emerald-500/30'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Headphones className="h-5 w-5 mb-1 text-emerald-400" />
                    <span className="text-xs font-bold">Support Agent</span>
                    <span className="text-[10px] text-slate-500">Triage & Resolve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegData({ ...regData, role: 'Admin' })}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 transition-all ${
                      regData.role === 'Admin'
                        ? 'border-teal-500 bg-teal-950/60 text-teal-200 ring-2 ring-teal-500/30'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <ShieldCheck className="h-5 w-5 mb-1 text-teal-400" />
                    <span className="text-xs font-bold">Administrator</span>
                    <span className="text-[10px] text-slate-500">Full System Control</span>
                  </button>
                </div>
              </div>

              {/* Name & Corporate Email */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={regData.name}
                      onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                      placeholder="e.g. Alex Morgan"
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Corporate Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={regData.email}
                      onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                      placeholder="alex@company.com"
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Department & Phone */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Department</label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <select
                      value={regData.departmentName}
                      onChange={(e) => setRegData({ ...regData, departmentName: e.target.value })}
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="Information Technology">Information Technology</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Finance & Accounting">Finance & Accounting</option>
                      <option value="Operations">Operations</option>
                      <option value="Customer Support">Customer Support</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={regData.phone}
                      onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                      placeholder="+1 (555) 012-3456"
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {regData.role === 'Agent' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Specialization Domain</label>
                  <div className="relative">
                    <Briefcase className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={regData.specialization}
                      onChange={(e) => setRegData({ ...regData, specialization: e.target.value })}
                      placeholder="e.g. Network & Security, Cloud Infrastructure, Hardware"
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={regData.password}
                      onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                      placeholder="Min 6 characters"
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={regData.confirmPassword}
                      onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                      placeholder="Repeat password"
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 transition-all"
              >
                {submitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Create Account in MongoDB</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="mt-4 text-center text-xs text-slate-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setError('');
                  }}
                  className="font-bold text-emerald-400 hover:text-emerald-300"
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
