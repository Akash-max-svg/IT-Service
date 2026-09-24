import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  User,
  Briefcase,
  Phone,
  Building2,
  CheckCircle2,
  RotateCw,
  KeyRound,
} from 'lucide-react';

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, verifyEmail, resendCode } = useAuth();

  // Mode: 'login' or 'register'
  const [activeTab, setActiveTab] = useState('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form state (supporting all positions: Admin, Agent, Employee)
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Employee', // Employee | Agent | Admin
    departmentName: 'Information Technology',
    phone: '',
    specialization: '',
  });

  // Email verification state
  const [verificationPending, setVerificationPending] = useState(false);
  const [targetEmail, setTargetEmail] = useState('');
  const [targetRole, setTargetRole] = useState('Employee');
  const [otpCode, setOtpCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Status & feedback
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If query string has ?tab=register, switch to register tab
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'register') {
      setActiveTab('register');
    }
  }, [location.search]);

  // Resend cooldown timer effect
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleQuickDemo = (demoEmail, demoPass) => {
    setActiveTab('login');
    setVerificationPending(false);
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const user = await login(email, password);
      redirectByRole(user.role);
    } catch (err) {
      const resData = err.response?.data;
      if (resData?.requiresVerification) {
        // Unverified email caught during login
        setTargetEmail(resData.email || email);
        setTargetRole(resData.role || 'Employee');
        setDevCode(resData.devCode || '');
        setVerificationPending(true);
        setResendTimer(60);
        setError('');
        setSuccessMsg(resData.message || 'Please verify your email address to continue.');
      } else {
        setError(resData?.message || 'Login failed. Please verify your credentials.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (regData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (regData.password !== regData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await register({
        name: regData.name,
        email: regData.email,
        password: regData.password,
        role: regData.role,
        departmentName: regData.departmentName,
        phone: regData.phone,
        specialization: regData.specialization,
      });

      // Show verification step
      setTargetEmail(res.email || regData.email);
      setTargetRole(res.role || regData.role);
      setDevCode(res.devCode || '');
      setVerificationPending(true);
      setResendTimer(60);
      setSuccessMsg(res.message || `Verification code sent to ${regData.email}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const verifiedUser = await verifyEmail(targetEmail, otpCode.trim());
      setSuccessMsg('Email verified successfully! Redirecting...');
      setTimeout(() => {
        redirectByRole(verifiedUser.role || targetRole);
      }, 900);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError('');
    try {
      const res = await resendCode(targetEmail);
      setDevCode(res.devCode || '');
      setResendTimer(60);
      setSuccessMsg(`New verification code sent to ${targetEmail}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    }
  };

  const redirectByRole = (role) => {
    if (role === 'Admin') navigate('/admin');
    else if (role === 'Agent') navigate('/agent');
    else navigate('/dashboard');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Decorative ambient blurred glow spheres */}
      <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-indigo-600/15 blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 -right-40 h-[520px] w-[520px] rounded-full bg-purple-600/15 blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-[110px] pointer-events-none" />

      <div className={`relative w-full ${activeTab === 'register' && !verificationPending ? 'max-w-xl' : 'max-w-md'} z-10 transition-all duration-300`}>
        {/* Main Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-9 border border-slate-800 shadow-2xl backdrop-blur-2xl">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-600/30 scale-105">
              <span className="font-mono text-2xl font-extrabold tracking-wider">IT</span>
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-white tracking-tight sm:text-3xl">
              ServiceDesk <span className="text-indigo-400">Pro</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Enterprise Incident Management & SLA Center
            </p>
          </div>

          {/* Tab Switcher (Sign In vs Register) */}
          {!verificationPending && (
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
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
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
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Register Account
              </button>
            </div>
          )}

          {/* Quick Demo Logins Bar (Visible only on login tab) */}
          {activeTab === 'login' && !verificationPending && (
            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-3 shadow-inner">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1.5 font-mono">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>1-Click Demo Accounts</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin@servicedesk.com', 'Admin@123')}
                  className="flex flex-col items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-2 text-xs text-indigo-300 hover:bg-indigo-900/60 transition-all hover:scale-105"
                >
                  <ShieldCheck className="h-4 w-4 mb-1 text-indigo-400" />
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
            <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 shadow-md">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 shadow-md">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* 1. EMAIL VERIFICATION STEP (OTP Verification)            */}
          {/* ======================================================== */}
          {verificationPending ? (
            <form onSubmit={handleVerifySubmit} className="mt-6 space-y-4">
              <div className="text-center rounded-2xl bg-indigo-950/40 border border-indigo-500/30 p-4">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 mb-2">
                  <Mail className="h-6 w-6 animate-pulse" />
                </div>
                <h3 className="text-base font-bold text-white">Email Verification Code</h3>
                <p className="mt-1 text-xs text-slate-300">
                  We sent a 6-digit confirmation code to:
                </p>
                <p className="font-mono text-sm font-bold text-indigo-300 mt-0.5">{targetEmail}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Role: {targetRole}
                </div>
              </div>

              {/* Dev mode preview helper */}
              {devCode && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-2.5 text-center">
                  <span className="text-[11px] text-amber-300 font-medium">
                    ⚡ Quick Autofill Code:{' '}
                    <button
                      type="button"
                      onClick={() => setOtpCode(devCode)}
                      className="font-mono font-bold text-amber-200 underline hover:text-white"
                    >
                      {devCode}
                    </button>
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Enter 6-Digit Code
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full tracking-[8px] text-center font-mono text-lg font-bold rounded-2xl border border-slate-700/80 bg-slate-900/90 py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || otpCode.length !== 6}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                {submitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Verify & Continue to ServiceDesk</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendTimer > 0}
                  className="flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                >
                  <RotateCw className={`h-3 w-3 ${resendTimer > 0 ? 'animate-spin' : ''}`} />
                  <span>
                    {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVerificationPending(false);
                    setOtpCode('');
                    setError('');
                  }}
                  className="text-slate-400 hover:text-slate-200 underline"
                >
                  Change email
                </button>
              </div>
            </form>
          ) : activeTab === 'login' ? (
            /* ======================================================== */
            /* 2. SIGN IN FORM                                          */
            /* ======================================================== */
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
                    className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/90 py-3 pl-11 pr-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner transition-all"
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
                    className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/90 py-3 pl-11 pr-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 transition-all"
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
                Need an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setError('');
                  }}
                  className="font-bold text-indigo-400 hover:text-indigo-300"
                >
                  Register here (Admin, Agent, Employee)
                </button>
              </div>
            </form>
          ) : (
            /* ======================================================== */
            /* 3. REGISTER FORM FOR ALL POSITIONS                       */
            /* ======================================================== */
            <form onSubmit={handleRegisterSubmit} className="mt-5 space-y-4">
              {/* Role Selection Badge Cards */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Select System Role / Position
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
                        ? 'border-indigo-500 bg-indigo-950/60 text-indigo-200 ring-2 ring-indigo-500/30'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <ShieldCheck className="h-5 w-5 mb-1 text-indigo-400" />
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
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
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
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Department & Specialization (if agent) */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Department</label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <select
                      value={regData.departmentName}
                      onChange={(e) => setRegData({ ...regData, departmentName: e.target.value })}
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-white focus:border-indigo-500 focus:outline-none"
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
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
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
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
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
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={regData.confirmPassword}
                      onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                      placeholder="Repeat password"
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 transition-all"
              >
                {submitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Save Details & Send Verification Email</span>
                    <Mail className="h-4 w-4" />
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
                  className="font-bold text-indigo-400 hover:text-indigo-300"
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
