import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, Mail, Phone, Check, X, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import ToastNotification from '../components/ToastNotification';

export const RegisterPage = () => {
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Viewer');
  const [terms, setTerms] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { label: 'None', color: 'text-slate-500', width: '0%', score: 0 };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { label: 'Weak', color: 'text-red-400', width: '25%', bg: 'bg-red-500', score };
    if (score === 2) return { label: 'Fair', color: 'text-amber-400', width: '50%', bg: 'bg-amber-500', score };
    if (score === 3) return { label: 'Good', color: 'text-blue-400', width: '75%', bg: 'bg-blue-500', score };
    return { label: 'Strong', color: 'text-emerald-400', width: '100%', bg: 'bg-emerald-500', score };
  }, [password]);

  // Validation rules check
  const isEmailValid = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);
  const isMinLength = useMemo(() => password.length >= 8, [password]);
  const isPasswordMatch = useMemo(() => password && password === confirmPassword, [password, confirmPassword]);

  const isFormValid = fullName.trim() && username.trim() && isEmailValid && isMinLength && isPasswordMatch && terms;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      setToast({ type: 'warning', message: 'Please complete all validation requirements before submitting.' });
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: fullName,
        username,
        email,
        phone: phone || null,
        password,
        confirm_password: confirmPassword,
        role,
        terms
      });
      setToast({ type: 'success', message: 'Account registered successfully! Redirecting to login...' });
      setTimeout(() => {
        navigate('/login');
      }, 400);
    } catch (err) {
      let msg = err.response?.data?.detail;
      if (Array.isArray(msg)) {
        msg = msg.map(item => (typeof item === 'string' ? item : item.msg || item.message || JSON.stringify(item))).join('. ');
      } else if (typeof msg === 'object') {
        msg = msg?.msg || msg?.message || JSON.stringify(msg);
      }
      if (!msg) msg = 'Registration failed. Please check your inputs.';
      setToast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A12] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:32px_32px] opacity-20 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-purple-600/10 blur-[140px] rounded-full pointer-events-none"></div>

      <ToastNotification
        type={toast?.type}
        message={toast?.message}
        onClose={() => setToast(null)}
      />

      <div className="glass-card max-w-lg w-full p-8 rounded-2xl border border-slate-800 shadow-2xl relative z-10 my-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-3 shadow-lg shadow-blue-600/20">
            <ShieldCheck size={28} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create NIDS Account</h2>
          <p className="text-slate-400 text-xs mt-1">Register for SOC access and threat intelligence dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Full Name *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><User size={16} /></span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Username *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><User size={16} /></span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Email Address *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Mail size={16} /></span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@nids.sec"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Phone (Optional)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Phone size={16} /></span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+15550199"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Assigned Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Viewer">Viewer (Read-Only Traffic & Analytics)</option>
              <option value="Security Analyst">Security Analyst (Alerts, Live Monitoring, IP Investigation)</option>
              <option value="Admin">Admin (Full System Access & User Controls)</option>
            </select>
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Password *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Lock size={16} /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars"
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
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Confirm Password *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Lock size={16} /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Password Strength Meter */}
          {password && (
            <div className="space-y-1.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Password Strength:</span>
                <span className={`font-semibold ${passwordStrength.color}`}>{passwordStrength.label}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-300 ${passwordStrength.bg}`} style={{ width: passwordStrength.width }}></div>
              </div>
            </div>
          )}

          {/* Validation Indicators Checklist */}
          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 space-y-1 text-xs">
            <div className="flex items-center gap-2">
              {isMinLength ? <Check size={14} className="text-emerald-400" /> : <X size={14} className="text-slate-500" />}
              <span className={isMinLength ? 'text-slate-200' : 'text-slate-500'}>At least 8 characters long</span>
            </div>
            <div className="flex items-center gap-2">
              {isPasswordMatch ? <Check size={14} className="text-emerald-400" /> : <X size={14} className="text-slate-500" />}
              <span className={isPasswordMatch ? 'text-slate-200' : 'text-slate-500'}>Passwords match</span>
            </div>
            <div className="flex items-center gap-2">
              {isEmailValid ? <Check size={14} className="text-emerald-400" /> : <X size={14} className="text-slate-500" />}
              <span className={isEmailValid ? 'text-slate-200' : 'text-slate-500'}>Valid email address format</span>
            </div>
          </div>

          {/* Terms Checkbox */}
          <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
              required
            />
            <span>I accept the Terms & Security Policies for AEGIS NIDS operations.</span>
          </label>

          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg transition-all shadow-lg shadow-blue-600/30 border border-blue-400/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 font-semibold hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
