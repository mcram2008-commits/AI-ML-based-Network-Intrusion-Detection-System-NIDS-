import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A12] flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium tracking-wide">Authenticating SOC Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const normalizeRole = (r) => {
    if (!r) return 'viewer';
    return String(r).toLowerCase().trim();
  };

  const userRoleNorm = normalizeRole(user?.role);
  const isAllowed = !allowedRoles || allowedRoles.some(r => normalizeRole(r) === userRoleNorm);

  if (!isAllowed) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="glass-card max-w-md w-full p-8 rounded-xl text-center border border-red-500/30">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-slate-400 text-sm mb-6">
            Your current role (<span className="text-amber-400 font-semibold">{user.role}</span>) does not have authorization to view this section. Requires: {allowedRoles.join(', ')}.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm rounded-lg transition-colors border border-slate-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
