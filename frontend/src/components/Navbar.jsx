import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Sparkles, Menu, Cpu } from 'lucide-react';

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

  const handleToggleMobileMenu = () => {
    window.dispatchEvent(new CustomEvent('toggle-aegis-mobile-menu'));
  };

  if (!user) return null;

  return (
    <header className="h-16 bg-[#06090F]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 sticky top-0 z-30 flex items-center">
      <div className="max-w-[1600px] mx-auto w-full flex items-center justify-between">
        {/* Left: Mobile Menu & SOC Telemetry Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleMobileMenu}
            className="p-1.5 -ml-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden flex items-center justify-center transition-colors"
            title="Open Menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
            <span className="tracking-wide">SOC ENGINE ONLINE</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
            <Cpu size={13} className="text-blue-400" />
            <span>MODEL: RANDOM FOREST v1.4</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Ask Aegis AI Button (Button-in-Button precision style) */}
          <button
            onClick={handleToggleAiCopilot}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-700/80 hover:border-blue-500/40 text-slate-200 text-xs font-medium flex items-center gap-2 transition-all group shadow-sm"
          >
            <div className="w-5 h-5 rounded bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <Sparkles size={12} />
            </div>
            <span className="hidden sm:inline font-sans">Ask Aegis AI</span>
          </button>

          {/* User Info & Quick Actions */}
          <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-800">
            <Link
              to="/profile"
              className="flex items-center gap-2.5 p-1 sm:p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-blue-300 font-bold flex items-center justify-center text-xs font-mono">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-white leading-tight">{user.full_name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
