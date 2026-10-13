import React, { useState, useEffect, useMemo } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  Users, UserPlus, Trash2, Edit2, Shield, CheckCircle, 
  Search, Key, Phone, Mail, UserCheck, ShieldAlert, Eye, 
  X, RefreshCw 
} from 'lucide-react';
import ToastNotification from '../components/ToastNotification';

export const UserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Create Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'Security Analyst'
  });

  // Edit Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'Viewer',
    is_active: true
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await client.get('/users');
      setUsersList(res.data);
    } catch (err) {
      console.error("Fetch users error:", err);
      setToast({ type: 'error', message: err.response?.data?.detail || 'Failed to fetch users' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await client.post('/users', createFormData);
      setToast({ type: 'success', message: `User '${createFormData.username}' provisioned successfully` });
      setShowCreateModal(false);
      setCreateFormData({ full_name: '', username: '', email: '', phone: '', password: '', role: 'Security Analyst' });
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create user';
      setToast({ type: 'error', message: msg });
    }
  };

  const openEditModal = (u) => {
    setEditingUserId(u.id);
    setEditFormData({
      full_name: u.full_name || '',
      username: u.username || '',
      email: u.email || '',
      phone: u.phone || '',
      password: '', // blank unless resetting
      role: u.role || 'Viewer',
      is_active: u.is_active ?? true
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        full_name: editFormData.full_name,
        username: editFormData.username,
        email: editFormData.email,
        phone: editFormData.phone,
        role: editFormData.role,
        is_active: editFormData.is_active
      };
      if (editFormData.password && editFormData.password.trim()) {
        payload.password = editFormData.password.trim();
      }

      await client.put(`/users/${editingUserId}`, payload);
      setToast({ type: 'success', message: `User '${editFormData.username}' updated successfully` });
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update user';
      setToast({ type: 'error', message: msg });
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (currentUser?.id === userId) {
      setToast({ type: 'error', message: 'You cannot delete your own logged-in account' });
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user '${username}'? This action is permanent.`)) return;
    try {
      await client.delete(`/users/${userId}`);
      setToast({ type: 'success', message: `User '${username}' deleted successfully` });
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to delete user';
      setToast({ type: 'error', message: msg });
    }
  };

  const stats = useMemo(() => {
    const total = usersList.length;
    const admins = usersList.filter(u => u.role === 'Admin').length;
    const analysts = usersList.filter(u => u.role === 'Security Analyst').length;
    const viewers = usersList.filter(u => u.role === 'Viewer').length;
    return { total, admins, analysts, viewers };
  }, [usersList]);

  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        u.username.toLowerCase().includes(q) || 
        u.full_name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [usersList, roleFilter, searchQuery]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto w-full pb-10">
      <ToastNotification type={toast?.type} message={toast?.message} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-sm">
              <Users size={19} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                User & Role Management
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Centralized SOC authentication, access control, and account governance
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
            title="Refresh Users List"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-all border border-blue-400/30 shadow-lg shadow-blue-600/20"
          >
            <UserPlus size={15} />
            <span>Provision New User</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bezel-card p-4 flex items-center justify-between border-l-4 border-l-purple-500">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Total Users</span>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{stats.total}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Users size={20} />
          </div>
        </div>

        <div className="bezel-card p-4 flex items-center justify-between border-l-4 border-l-indigo-500">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Administrators</span>
            <div className="text-2xl font-bold text-indigo-300 mt-1 font-mono">{stats.admins}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <ShieldAlert size={20} />
          </div>
        </div>

        <div className="bezel-card p-4 flex items-center justify-between border-l-4 border-l-blue-500">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Security Analysts</span>
            <div className="text-2xl font-bold text-blue-300 mt-1 font-mono">{stats.analysts}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Shield size={20} />
          </div>
        </div>

        <div className="bezel-card p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Viewers</span>
            <div className="text-2xl font-bold text-emerald-300 mt-1 font-mono">{stats.viewers}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Eye size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bezel-card p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'Admin', 'Security Analyst', 'Viewer'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                roleFilter === r
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {r === 'ALL' ? 'All Roles' : r}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search username, name, email..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Users Grid Table */}
      <div className="bezel-card overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 font-mono">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-500">#{u.id}</td>
                      <td className="px-4 py-3 font-semibold text-white font-sans flex items-center gap-2">
                        <span>{u.full_name}</span>
                        {isCurrent && (
                          <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-1.5 py-0.2 rounded font-mono">
                            YOU
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-blue-400">
                        @{u.username}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          u.role === 'Admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                          u.role === 'Security Analyst' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          u.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}>
                          {u.is_active ? 'ACTIVE' : 'LOCKED'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {u.phone || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-[11px]">
                        {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                            title="Edit User & Permissions"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded transition-colors ${
                              isCurrent
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                            }`}
                            title={isCurrent ? "Cannot delete yourself" : "Delete User"}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision New User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bezel-card max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="text-blue-400" size={18} />
                Provision New SOC User
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Full Name</label>
                <input
                  type="text"
                  value={createFormData.full_name}
                  onChange={(e) => setCreateFormData({ ...createFormData, full_name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Username</label>
                <input
                  type="text"
                  value={createFormData.username}
                  onChange={(e) => setCreateFormData({ ...createFormData, username: e.target.value })}
                  placeholder="e.g. johndoe"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Email</label>
                <input
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  placeholder="johndoe@nids.sec"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Phone (Optional)</label>
                <input
                  type="tel"
                  value={createFormData.phone}
                  onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                  placeholder="+18005550199"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Password</label>
                <input
                  type="password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Role</label>
                <select
                  value={createFormData.role}
                  onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Viewer">Viewer (Read-only)</option>
                  <option value="Security Analyst">Security Analyst (Flow & Threat Ops)</option>
                  <option value="Admin">Admin (Full System Privilege)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-600/30"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bezel-card max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="text-purple-400" size={18} />
                Edit User & Permissions
              </h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Full Name</label>
                <input
                  type="text"
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Username</label>
                <input
                  type="text"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Email</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Phone</label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">
                  Reset Password <span className="text-slate-500 font-normal lowercase">(leave empty to keep current)</span>
                </label>
                <input
                  type="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  placeholder="New password (optional)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Role</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Viewer">Viewer</option>
                    <option value="Security Analyst">Security Analyst</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Status</label>
                  <select
                    value={editFormData.is_active ? "active" : "locked"}
                    onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.value === "active" })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="active">Active</option>
                    <option value="locked">Locked</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow-md shadow-purple-600/30"
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

export default UserManagementPage;
