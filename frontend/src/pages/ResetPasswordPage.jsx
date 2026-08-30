import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import { Shield, Lock, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react';
import ToastNotification from '../components/ToastNotification';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setToast({ type: 'warning', message: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 8) {
      setToast({ type: 'warning', message: 'Password must be at least 8 characters long' });
      return;
    }

    setLoading(true);
    try {
      const res = await client.post('/auth/reset-password', {
        token,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword
      });
      setSuccess(true);
      setToast({ type: 'success', message: res.data.message });
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid or expired password reset token';
      setToast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A12] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:32px_32px] opacity-20 pointer-events-none"></div>

      <ToastNotification
        type={toast?.type}
        message={toast?.message}
        onClose={() => setToast(null)}
      />

      <div className="glass-card max-w-md w-full p-8 rounded-2xl border border-slate-800 shadow-2xl relative z-10">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-3">
            <Shield size={28} />
          </div>
          <h2 className="text-xl font-bold text-white">Set New Password</h2>
          <p className="text-slate-400 text-xs mt-1">Enter your new secure password below</p>
        </div>

        {success ? (
          <div className="text-center space-y-4 py-4">
            <CheckCircle size={48} className="text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-semibold text-white">Password Updated!</h3>
            <p className="text-xs text-slate-400">Redirecting to login portal...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Reset Token</label>
              <input
                type="text"
                value={token}
                readOnly
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-xs text-slate-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Lock size={16} /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full pl-9 pr-8 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Confirm New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Lock size={16} /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg transition-all shadow-lg shadow-blue-600/30 border border-blue-400/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <Link to="/login" className="text-xs text-blue-400 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
