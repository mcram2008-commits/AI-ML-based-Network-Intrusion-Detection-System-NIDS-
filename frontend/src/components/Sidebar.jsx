import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Activity, Search, Bell, BarChart2,
  Globe, Database, Cpu, FileText, Users, Settings, UserCheck, Shield
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Security Analyst', 'Viewer'] },
    { label: 'Live Monitoring', path: '/monitoring', icon: Activity, roles: ['Admin', 'Security Analyst'] },
    { label: 'Intrusion Detection', path: '/detection', icon: Search, roles: ['Admin', 'Security Analyst'] },
    { label: 'Alerts Management', path: '/alerts', icon: Bell, roles: ['Admin', 'Security Analyst'] },
    { label: 'Attack Analytics', path: '/analytics', icon: BarChart2, roles: ['Admin', 'Security Analyst', 'Viewer'] },
    { label: 'IP Investigation', path: '/ip-investigation', icon: Globe, roles: ['Admin', 'Security Analyst'] },
    { label: 'Datasets', path: '/datasets', icon: Database, roles: ['Admin', 'Security Analyst'] },
    { label: 'ML Models', path: '/models', icon: Cpu, roles: ['Admin', 'Security Analyst'] },
    { label: 'Security Reports', path: '/reports', icon: FileText, roles: ['Admin', 'Security Analyst', 'Viewer'] },
    { label: 'User Management', path: '/users', icon: Users, roles: ['Admin'] },
    { label: 'System Settings', path: '/settings', icon: Settings, roles: ['Admin'] },
    { label: 'User Profile', path: '/profile', icon: UserCheck, roles: ['Admin', 'Security Analyst', 'Viewer'] },
  ];

  return (
    <aside className="w-64 bg-[#0B0F19] border-r border-slate-800/80 flex flex-col justify-between hidden md:flex h-screen sticky top-0 z-20">
      <div>
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80 bg-slate-900/30">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Shield size={22} className="animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-wide text-base leading-tight">AEGIS NIDS</h1>
            <span className="text-[10px] text-blue-400 font-mono tracking-wider">AI INTRUSION SYSTEM</span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navItems.map((item) => {
            if (!item.roles.includes(user.role)) return null;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Role Tag Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs">
            {user.full_name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
              user.role === 'Admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
              user.role === 'Security Analyst' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
              'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {user.role}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
