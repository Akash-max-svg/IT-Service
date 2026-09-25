import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { adminAPI, authAPI } from '../services/api';
import PriorityBadge from '../components/PriorityBadge';
import {
  Settings as SettingsIcon,
  User,
  Layers,
  Building,
  Clock,
  Plus,
  Save,
  Check,
  AlertCircle,
  Shield,
  Palette,
  Sparkles,
} from 'lucide-react';

const Settings = () => {
  const { user, updateUserState } = useAuth();
  const { currentTheme, themeMode, setThemeMode, availableThemes } = useTheme();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'categories', 'departments', 'sla'

  // Profile Form
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    specialization: user?.specialization || '',
    password: '',
  });
  const [profileMsg, setProfileMsg] = useState('');

  // Categories & SLA state
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [slaRules, setSlaRules] = useState([]);

  // New Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatSubs, setNewCatSubs] = useState('');
  const [newCatPriority, setNewCatPriority] = useState('MEDIUM');

  // New Dept Form
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');

  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      if (!user || !['Agent', 'Admin'].includes(user.role)) return;

      try {
        setLoadingData(true);
        const calls = [adminAPI.getCategories(), adminAPI.getDepartments()];
        if (user.role === 'Admin') {
          calls.push(adminAPI.getSLARules());
        }

        const results = await Promise.all(calls);
        setCategories(results[0]?.data || []);
        setDepartments(results[1]?.data || []);
        if (results[2]) {
          setSlaRules(results[2]?.data || []);
        }
      } catch (err) {
        console.error('Failed to load settings configs', err);
      } finally {
        setLoadingData(false);
      }
    };
    loadConfig();
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    try {
      const payload = {
        name: profileData.name,
        phone: profileData.phone,
        specialization: profileData.specialization,
      };
      if (profileData.password) {
        payload.password = profileData.password;
      }
      const { data } = await authAPI.updateProfile(payload);
      updateUserState(data);
      setProfileMsg('Profile updated successfully!');
      setProfileData({ ...profileData, password: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      const subs = newCatSubs.split(',').map((s) => s.trim()).filter(Boolean);
      const { data } = await adminAPI.createCategory({
        name: newCatName,
        subcategories: subs,
        defaultPriority: newCatPriority,
      });
      setCategories([...categories, data]);
      setNewCatName('');
      setNewCatSubs('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add category');
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName || !newDeptCode) return;
    try {
      const { data } = await adminAPI.createDepartment({
        name: newDeptName,
        code: newDeptCode.toUpperCase(),
      });
      setDepartments([...departments, data]);
      setNewDeptName('');
      setNewDeptCode('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add department');
    }
  };

  const handleUpdateSLA = async (priority, respMins, resMins) => {
    try {
      const { data } = await adminAPI.updateSLARule({
        priority,
        responseTimeMinutes: Number(respMins),
        resolutionTimeMinutes: Number(resMins),
      });
      setSlaRules((prev) =>
        prev.map((s) => (s.priority === priority ? data : s))
      );
      alert(`SLA for ${priority} updated successfully!`);
    } catch (err) {
      alert('Failed to update SLA rule');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Settings & Configuration</h1>
        <p className="mt-1 text-xs text-slate-400">
          Personal profile details, incident classification categories, organization units, and SLA response targets.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 pb-3 px-4 border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="h-4 w-4" /> My Profile
        </button>

        {['Agent', 'Admin'].includes(user?.role) && (
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 pb-3 px-4 border-b-2 transition-colors ${
              activeTab === 'categories'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" /> Incident Categories
          </button>
        )}

        {user?.role === 'Admin' && (
          <>
            <button
              onClick={() => setActiveTab('departments')}
              className={`flex items-center gap-2 pb-3 px-4 border-b-2 transition-colors ${
                activeTab === 'departments'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building className="h-4 w-4" /> Departments
            </button>
            <button
              onClick={() => setActiveTab('sla')}
              className={`flex items-center gap-2 pb-3 px-4 border-b-2 transition-colors ${
                activeTab === 'sla'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="h-4 w-4" /> SLA Policies
            </button>
          </>
        )}
      </div>

      {/* TAB 1: Profile */}
      {activeTab === 'profile' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl max-w-2xl">
          <h3 className="text-base font-bold text-white mb-1">User Account Details</h3>
          <p className="text-xs text-slate-400 mb-6">
            Signed in as <strong className="text-indigo-400">{user?.email}</strong> ({user?.role})
          </p>

          {profileMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400">
              <Check className="h-4 w-4" />
              <span>{profileMsg}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Full Name</label>
              <input
                type="text"
                required
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Phone Number</label>
              <input
                type="text"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {user?.role === 'Agent' && (
              <div>
                <label className="block text-slate-300 font-medium mb-1">Specialization</label>
                <input
                  type="text"
                  value={profileData.specialization}
                  onChange={(e) =>
                    setProfileData({ ...profileData, specialization: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/80 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                New Password (leave blank to keep current)
              </label>
              <input
                type="password"
                value={profileData.password}
                onChange={(e) => setProfileData({ ...profileData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
              >
                <Save className="h-4 w-4" /> Save Profile
              </button>
            </div>
          </form>

          {/* Theme & Visual Appearance Customization */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Palette className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Portal Background Theme & Color</h4>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Select your preferred color theme or keep it synced to your active portal role (Admin, Employee, or Agent). Note: Login & Signup pages remain on their independent dark canvas.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Auto Sync */}
              <div
                onClick={() => setThemeMode('auto')}
                className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                  themeMode === 'auto'
                    ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/30'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    <span className="font-bold text-xs text-white">Auto (Role Sync)</span>
                  </div>
                  {themeMode === 'auto' && <Check className="h-4 w-4 text-indigo-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Automatically adapts theme based on whether you are viewing Admin, Employee, or Agent consoles.
                </p>
              </div>

              {/* Admin Theme */}
              <div
                onClick={() => setThemeMode('admin')}
                className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                  themeMode === 'admin'
                    ? 'border-purple-500 bg-purple-950/40 ring-2 ring-purple-500/30'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
                    <span className="font-bold text-xs text-purple-300">Admin Mode</span>
                  </div>
                  {themeMode === 'admin' && <Check className="h-4 w-4 text-purple-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Royal Obsidian & Deep Velvet Violet with command highlights.
                </p>
              </div>

              {/* Employee Theme */}
              <div
                onClick={() => setThemeMode('employee')}
                className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                  themeMode === 'employee'
                    ? 'border-sky-500 bg-sky-950/40 ring-2 ring-sky-500/30'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full bg-sky-500 shadow-sm shadow-sky-500/50" />
                    <span className="font-bold text-xs text-sky-300">Employee Mode</span>
                  </div>
                  {themeMode === 'employee' && <Check className="h-4 w-4 text-sky-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Oceanic Midnight & Electric Sapphire corporate workspace.
                </p>
              </div>

              {/* Agent Theme */}
              <div
                onClick={() => setThemeMode('agent')}
                className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                  themeMode === 'agent'
                    ? 'border-emerald-500 bg-emerald-950/40 ring-2 ring-emerald-500/30'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                    <span className="font-bold text-xs text-emerald-300">Agent Mode</span>
                  </div>
                  {themeMode === 'agent' && <Check className="h-4 w-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Cyber Matrix & Tactical Emerald triage operations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Add Category */}
          {user?.role === 'Admin' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
              <h3 className="text-sm font-semibold text-white mb-3">Add Incident Category</h3>
              <form onSubmit={handleCreateCategory} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <input
                  type="text"
                  required
                  placeholder="Category Name (e.g. Cloud Services)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
                />
                <input
                  type="text"
                  placeholder="Subcategories (comma-separated)"
                  value={newCatSubs}
                  onChange={(e) => setNewCatSubs(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
                />
                <select
                  value={newCatPriority}
                  onChange={(e) => setNewCatPriority(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
                >
                  <option value="LOW">Default LOW Priority</option>
                  <option value="MEDIUM">Default MEDIUM Priority</option>
                  <option value="HIGH">Default HIGH Priority</option>
                  <option value="CRITICAL">Default CRITICAL Priority</option>
                </select>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 p-2 font-semibold text-white hover:bg-indigo-500"
                >
                  Create Category
                </button>
              </form>
            </div>
          )}

          {/* List Categories */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <div key={cat._id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">{cat.name}</h4>
                  <PriorityBadge priority={cat.defaultPriority || 'MEDIUM'} size="xs" />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {cat.subcategories?.map((sub, i) => (
                    <span
                      key={i}
                      className="rounded bg-slate-800 border border-slate-700/60 px-2 py-0.5 text-[10px] text-slate-300"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Departments */}
      {activeTab === 'departments' && user?.role === 'Admin' && (
        <div className="space-y-6 max-w-3xl">
          {/* Add Dept Form */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
            <h3 className="text-sm font-semibold text-white mb-3">Register Organization Department</h3>
            <form onSubmit={handleCreateDepartment} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <input
                type="text"
                required
                placeholder="Department Name (e.g. Legal & Compliance)"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
              />
              <input
                type="text"
                required
                placeholder="Code (e.g. LEG)"
                value={newDeptCode}
                onChange={(e) => setNewDeptCode(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-white uppercase"
              />
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 p-2 font-semibold text-white hover:bg-indigo-500"
              >
                Add Department
              </button>
            </form>
          </div>

          {/* List Depts */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 uppercase tracking-wider text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Department Name</th>
                  <th className="px-5 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {departments.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-mono font-bold text-indigo-400">{d.code}</td>
                    <td className="px-5 py-3 font-semibold text-white">{d.name}</td>
                    <td className="px-5 py-3 text-slate-400">{d.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SLA Policies */}
      {activeTab === 'sla' && user?.role === 'Admin' && (
        <div className="space-y-4 max-w-3xl">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
            <h3 className="text-sm font-semibold text-white mb-1">Service Level Agreement (SLA) Thresholds</h3>
            <p className="text-xs text-slate-400 mb-4">
              Configure maximum allowable minutes before first support response and incident resolution.
            </p>

            <div className="space-y-3">
              {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => {
                const rule = slaRules.find((s) => s.priority === priority) || {
                  priority,
                  responseTimeMinutes: priority === 'CRITICAL' ? 30 : priority === 'HIGH' ? 60 : 120,
                  resolutionTimeMinutes: priority === 'CRITICAL' ? 240 : priority === 'HIGH' ? 480 : 1440,
                };

                return (
                  <div
                    key={priority}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-800/40 p-4 text-xs"
                  >
                    <div className="w-28">
                      <PriorityBadge priority={priority} />
                    </div>

                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Response Target (Mins)</span>
                        <input
                          type="number"
                          defaultValue={rule.responseTimeMinutes}
                          id={`resp-${priority}`}
                          className="w-24 rounded border border-slate-700 bg-slate-900 p-1.5 text-white font-mono"
                        />
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px]">Resolution Target (Mins)</span>
                        <input
                          type="number"
                          defaultValue={rule.resolutionTimeMinutes}
                          id={`res-${priority}`}
                          className="w-24 rounded border border-slate-700 bg-slate-900 p-1.5 text-white font-mono"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const resp = document.getElementById(`resp-${priority}`).value;
                        const res = document.getElementById(`res-${priority}`).value;
                        handleUpdateSLA(priority, resp, res);
                      }}
                      className="rounded bg-indigo-600 px-3 py-1.5 font-semibold text-white hover:bg-indigo-500"
                    >
                      Update SLA
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
