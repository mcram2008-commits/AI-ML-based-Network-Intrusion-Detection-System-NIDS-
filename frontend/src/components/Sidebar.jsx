import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Activity, Search, Bell, BarChart2,
  Globe, Navigation, Database, Cpu, FileText, Users, Settings, UserCheck, Shield, Zap, Network, Sparkles, Lock, X
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setMobileOpen((prev) => !prev);
    window.addEventListener('toggle-aegis-mobile-menu', handleToggle);
    return () => window.removeEventListener('toggle-aegis-mobile-menu', handleToggle);
  }, []);

  if (!user) return null;

  const navSections = [
    {
      title: 'COMMAND CENTER',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Security Analyst', 'Viewer'] },
        { label: 'AI Security Copilot', path: '/copilot', icon: Sparkles, roles: ['Admin', 'Security Analyst', 'Viewer'] },
        { label: 'Live Monitoring', path: '/monitoring', icon: Activity, roles: ['Admin', 'Security Analyst'] },
      ]
    },
    {
      title: 'THREAT DEFENSE & SOAR',
      items: [
        { label: 'Intrusion Detection', path: '/detection', icon: Search, roles: ['Admin', 'Security Analyst'] },
        { label: 'Alerts Management', path: '/alerts', icon: Bell, roles: ['Admin', 'Security Analyst'] },
        { label: 'SOAR Playbooks', path: '/playbooks', icon: Zap, roles: ['Admin', 'Security Analyst'] },
        { label: 'SOAR Firewall Center', path: '/firewall', icon: Lock, roles: ['Admin', 'Security Analyst'] },
      ]
    },
    {
      title: 'INTELLIGENCE & FORENSICS',
      items: [
        { label: 'Topology & GeoMap', path: '/network-topology', icon: Network, roles: ['Admin', 'Security Analyst', 'Viewer'] },
        { label: 'Attack Analytics', path: '/analytics', icon: BarChart2, roles: ['Admin', 'Security Analyst', 'Viewer'] },
        { label: 'IP Investigation', path: '/ip-investigation', icon: Globe, roles: ['Admin', 'Security Analyst'] },
        { label: 'IP Identification', path: '/route-optimization', icon: Navigation, roles: ['Admin', 'Security Analyst'] },
      ]
    },
    {
      title: 'ML ENGINE & DATA',
      items: [
        { label: 'Datasets', path: '/datasets', icon: Database, roles: ['Admin', 'Security Analyst'] },
        { label: 'ML Models', path: '/models', icon: Cpu, roles: ['Admin', 'Security Analyst'] },
        { label: 'Security Reports', path: '/reports', icon: FileText, roles: ['Admin', 'Security Analyst', 'Viewer'] },
      ]
    },
    {
      title: 'SYSTEM & ACCESS',
      items: [
        { label: 'User Management', path: '/users', icon: Users, roles: ['Admin'] },
        { label: 'System Settings', path: '/settings', icon: Settings, roles: ['Admin'] },
        { label: 'User Profile', path: '/profile', icon: UserCheck, roles: ['Admin', 'Security Analyst', 'Viewer'] },
      ]
    }
  ];

  const userRoleNorm = (user?.role || 'viewer').toLowerCase().trim();

  const renderNavContent = () => (
    <>
      {/* Brand Header */}
      <div className="h-16 flex-shrink-0 flex items-center justify-between px-5 border-b border-slate-800/80 bg-[#06090F]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 shadow-inner">
            <Shield size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tracking-wider text-sm leading-tight">AEGIS</span>
              <span className="text-[10px] px-1 py-0.2 rounded font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/20">SOC</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">NIDS / SOAR v2.4</span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation List grouped by Category */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-4">
        {navSections.map((section, sIdx) => {
          const visibleItems = section.items.filter(item =>
            item.roles.some(r => r.toLowerCase().trim() === userRoleNorm)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={sIdx} className="space-y-1">
              <div className="px-3 pt-2 pb-1 text-[10px] font-mono font-semibold tracking-wider text-slate-300 uppercase">
                {section.title}
              </div>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-slate-800/90 text-white border border-slate-700/80 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon
                            size={16}
                            className={`flex-shrink-0 transition-colors ${
                              isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User Role Tag Footer with Double-Bezel */}
      <div className="flex-shrink-0 p-3 border-t border-slate-800/80 bg-[#06090F]">
        <div className="p-2 rounded-lg bg-[#0B0F19] border border-slate-800/80 flex items-center gap-2.5 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-300 flex-shrink-0 font-mono">
            {user.full_name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-200 truncate leading-tight">{user.full_name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-medium ${
                user.role === 'Admin' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' :
                user.role === 'Security Analyst' ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' :
                'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              }`}>
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="w-64 bg-[#0B0F19] border-r border-slate-800/80 hidden md:flex flex-col h-screen sticky top-0 z-20 flex-shrink-0">
        {renderNavContent()}
      </aside>

      {/* Mobile Drawer Backdrop and Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-[#0B0F19] border-r border-slate-800 flex flex-col z-50 shadow-2xl">
            {renderNavContent()}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
