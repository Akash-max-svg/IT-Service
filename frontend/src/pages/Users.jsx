import React, { useState, useEffect } from 'react';
import { userAPI, adminAPI } from '../services/api';
import {
  Users as UsersIcon,
  Search,
  Filter,
  Shield,
  Headphones,
  Briefcase,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  PlusCircle,
  X,
  Check,
} from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Edit User Modal
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    role: '',
    departmentName: '',
    specialization: '',
    isActive: true,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await userAPI.getAllUsers({
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        search: search || undefined,
      });
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      role: user.role,
      departmentName: user.departmentName || '',
      specialization: user.specialization || '',
      isActive: user.isActive !== false,
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await userAPI.updateUser(editingUser._id, editFormData);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user');
    }
  };

  const toggleUserStatus = async (user) => {
    try {
      await userAPI.updateUser(user._id, { isActive: !user.isActive });
      fetchUsers();
    } catch (err) {
      alert('Failed to change user status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">User & Agent Directory</h1>
          <p className="mt-1 text-xs text-slate-600">
            Manage organization members, assign support agent roles, and configure specializations.
          </p>
        </div>

        <span className="text-xs text-slate-700 font-mono font-bold bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
          {users.length} registered member(s)
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-amber-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, department..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-2">
          {['ALL', 'Admin', 'Agent', 'Employee'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                roleFilter === r
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-amber-50/70 uppercase tracking-wider text-slate-700 border-b border-amber-200/80 font-mono text-[11px]">
                <tr>
                  <th className="px-5 py-4 font-bold text-slate-800">User</th>
                  <th className="px-4 py-4 font-bold text-slate-800">Role</th>
                  <th className="px-4 py-4 font-bold text-slate-800">Department</th>
                  <th className="px-4 py-4 font-bold text-slate-800">Specialization</th>
                  <th className="px-4 py-4 font-bold text-slate-800">Status</th>
                  <th className="px-4 py-4 font-bold text-right text-slate-800">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center font-black text-slate-950 text-xs shadow-sm">
                          {u.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-950">{u.name}</div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                          u.role === 'Admin'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : u.role === 'Agent'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}
                      >
                        {u.role === 'Admin' && <Shield className="h-3 w-3" />}
                        {u.role === 'Agent' && <Headphones className="h-3 w-3" />}
                        {u.role === 'Employee' && <Briefcase className="h-3 w-3" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-800 font-medium whitespace-nowrap">
                      {u.departmentName || 'General'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {u.specialization || (u.role === 'Agent' ? 'General Support' : '—')}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          u.isActive !== false
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            u.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {u.isActive !== false ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => toggleUserStatus(u)}
                          className={`rounded-lg p-1.5 transition-colors ${
                            u.isActive !== false
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.isActive !== false ? 'Deactivate User' : 'Activate User'}
                        >
                          {u.isActive !== false ? (
                            <UserX className="h-3.5 w-3.5" />
                          ) : (
                            <UserCheck className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white">Edit User Profile</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Role</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white"
                >
                  <option value="Employee">Employee</option>
                  <option value="Agent">Support Agent</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Department</label>
                <select
                  value={editFormData.departmentName}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, departmentName: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white"
                >
                  <option value="Information Technology">Information Technology</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Finance & Accounting">Finance & Accounting</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Specialization</label>
                <input
                  type="text"
                  value={editFormData.specialization}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, specialization: e.target.value })
                  }
                  placeholder="e.g. Network, Cloud, Hardware"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editFormData.isActive}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600"
                />
                <label htmlFor="isActive" className="text-slate-300 cursor-pointer">
                  Account is Active
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-lg px-4 py-2 text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
