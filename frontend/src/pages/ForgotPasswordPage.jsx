import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { Shield, Mail, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import ToastNotification from '../components/ToastNotification';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [demoLink, setDemoLink] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await client.post('/auth/forgot-password', { email });
      setToast({ type: 'success', message: res.data.message });
      if (res.data.demo_reset_link) {
        setDemoLink(res.data.demo_reset_link);
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to request password reset' });
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
            <KeyRound size={28} />
          </div>
          <h2 className="text-xl font-bold text-white">Reset SOC Password</h2>
          <p className="text-slate-400 text-xs mt-1">Enter your registered email address to receive password reset token</p>
        </div>

        {demoLink ? (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
              <p className="font-semibold mb-2">Reset link generated successfully!</p>
              <p className="text-slate-400 text-[11px] mb-3">For evaluation purposes, you can immediately proceed using the generated token link below:</p>
              <button
                onClick={() => navigate(demoLink)}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Proceed to Reset Password</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Registered Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Mail size={16} /></span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nids.sec"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
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
                'Send Reset Link'
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={14} />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
