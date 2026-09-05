import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, User, Bell, ChevronDown, Sparkles } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleToggleAiCopilot = () => {
    window.dispatchEvent(new CustomEvent('toggle-aegis-ai-copilot'));
  };

  if (!user) return null;

  return (
    <header className="h-16 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: System Status Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>SOC MONITORING ONLINE</span>
        </div>
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono">
          <span>MODEL: RANDOM FOREST v1.4</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Ask Aegis AI Button */}
        <button
          onClick={handleToggleAiCopilot}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
        >
          <Sparkles size={15} className="text-purple-400 animate-pulse" />
          <span>Ask Aegis AI</span>
        </button>

        {/* User Info & Quick Actions */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <Link
            to="/profile"
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-400/40 text-blue-300 font-bold flex items-center justify-center text-sm">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-white leading-tight">{user.full_name}</div>
              <div className="text-[10px] text-slate-400">{user.email}</div>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
