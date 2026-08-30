import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { UserCheck, Shield, Lock, Edit3, Key, LogOut } from 'lucide-react';
import ToastNotification from '../components/ToastNotification';

export const ProfilePage = () => {
  const { user, updateProfile, logout } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileImage, setProfileImage] = useState(user?.profile_image || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [toast, setToast] = useState(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await client.put('/auth/profile', {
        full_name: fullName,
        phone,
        profile_image: profileImage
      });
      updateProfile(res.data);
      setToast({ type: 'success', message: 'Profile updated successfully' });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to update profile' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setToast({ type: 'warning', message: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 8) {
      setToast({ type: 'warning', message: 'New password must be at least 8 characters long' });
      return;
    }

    setChangingPassword(true);
    try {
      const res = await client.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword
      });
      setToast({ type: 'success', message: res.data.message });
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to change password';
      setToast({ type: 'error', message: msg });
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <ToastNotification type={toast?.type} message={toast?.message} onClose={() => setToast(null)} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <UserCheck className="text-blue-400" size={24} />
          User Profile & Security
        </h1>
        <p className="text-slate-400 text-xs mt-1">Manage user account details, assigned SOC authorization role, and password security</p>
      </div>

      {/* Profile Overview Card */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-blue-600/20 border-2 border-blue-500/40 text-blue-300 font-black flex items-center justify-center text-2xl shadow-lg shadow-blue-500/10">
            {user.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user.full_name}</h2>
            <div className="text-xs text-slate-400 font-mono mt-0.5">@{user.username} • {user.email}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                user.role === 'Admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                user.role === 'Security Analyst' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                Role: {user.role}
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                STATUS: ACTIVE
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 flex items-center gap-2 transition-colors"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Account Info Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800 text-xs font-mono">
          <span className="text-slate-500 block mb-1">Account Provisioned Date</span>
          <span className="text-white font-bold">{new Date(user.created_at).toLocaleDateString()}</span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800 text-xs font-mono">
          <span className="text-slate-500 block mb-1">Last Logged In Session</span>
          <span className="text-blue-400 font-bold">{user.last_login ? new Date(user.last_login).toLocaleString() : 'Current Session'}</span>
        </div>
      </div>

      {/* Edit Profile & Password Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Edit Details */}
        <form onSubmit={handleUpdateProfile} className="glass-card p-6 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
            <Edit3 size={16} className="text-blue-400" />
            Edit Profile Details
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors border border-blue-400/30 flex items-center justify-center gap-2"
          >
            {savingProfile ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : 'Update Profile'}
          </button>
        </form>

        {/* Change Password */}
        <form onSubmit={handleChangePassword} className="glass-card p-6 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
            <Key size={16} className="text-purple-400" />
            Change Security Password
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Current Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Confirm New Password</label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-lg transition-colors border border-purple-400/30 flex items-center justify-center gap-2"
          >
            {changingPassword ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
