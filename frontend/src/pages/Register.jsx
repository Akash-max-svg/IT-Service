import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as THREE from 'three';
import VantaHalo from 'vanta/dist/vanta.halo.min';
import VantaBirds from 'vanta/dist/vanta.birds.min';
import useAuth from '../hooks/useAuth';
import {
  User,
  Mail,
  Lock,
  Phone,
  Briefcase,
  ArrowRight,
  AlertCircle,
  Building2,
  ShieldCheck,
  Headphones,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
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

  const { register } = useAuth();
  const navigate = useNavigate();

  const vantaRef = useRef(null);
  const effectRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.THREE = THREE;
    }

    if (effectRef.current) {
      try {
        effectRef.current.destroy();
      } catch (e) {
        // ignore
      }
      effectRef.current = null;
    }

    if (vantaRef.current) {
      try {
        const isAgentOrAdmin = formData.role === 'Agent' || formData.role === 'Admin';

        if (isAgentOrAdmin) {
          // VANTA.BIRDS for Agent & Admin
          const birdsInit = (window.VANTA && window.VANTA.BIRDS) || VantaBirds.default || VantaBirds;
          effectRef.current = birdsInit({
            el: vantaRef.current,
            THREE: THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            backgroundColor: 0x000000,
          });
        } else {
          // VANTA.HALO for Employee / Default
          const haloInit = (window.VANTA && window.VANTA.HALO) || VantaHalo.default || VantaHalo;
          effectRef.current = haloInit({
            el: vantaRef.current,
            THREE: THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            backgroundColor: 0x000000,
          });
        }
      } catch (err) {
        console.error('Failed to init Vanta effect on Register:', err);
      }
    }

    return () => {
      if (effectRef.current) {
        try {
          effectRef.current.destroy();
        } catch (e) {
          // ignore
        }
        effectRef.current = null;
      }
    };
  }, [formData.role]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        departmentName: formData.departmentName,
        phone: formData.phone,
        specialization: formData.specialization,
      });

      setSuccessMsg(res.message || 'Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', {
          state: {
            successMessage: 'Account created successfully! Please sign in with your credentials.',
            prefilledEmail: formData.email,
          },
        });
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={vantaRef}
      className="signup-page relative flex min-h-screen items-center justify-center bg-black p-4 sm:p-6 lg:p-8 overflow-hidden"
      style={{ backgroundColor: '#000000' }}
    >

      <div className="relative w-full max-w-xl z-10 animate-in fade-in duration-300 pointer-events-auto">
        <div className="glass-panel rounded-3xl p-6 sm:p-9 border border-slate-800 shadow-2xl backdrop-blur-2xl">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white shadow-xl shadow-emerald-600/30 scale-105">
              <span className="font-mono text-2xl font-extrabold tracking-wider">IT</span>
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-white tracking-tight sm:text-3xl">
              Create an Account
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Join the IT Service Desk & Incident Management Portal
            </p>
          </div>

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

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Select Your Role / Position
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'Employee' })}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 transition-all ${
                    formData.role === 'Employee'
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
                  onClick={() => setFormData({ ...formData, role: 'Agent' })}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 transition-all ${
                    formData.role === 'Agent'
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
                  onClick={() => setFormData({ ...formData, role: 'Admin' })}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 transition-all ${
                    formData.role === 'Admin'
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
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
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
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
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
                    name="departmentName"
                    value={formData.departmentName}
                    onChange={handleChange}
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
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 012-3456"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {formData.role === 'Agent' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Specialization Domain</label>
                <div className="relative">
                  <Briefcase className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
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
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
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
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
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
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-emerald-400 hover:text-emerald-300">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
