import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Cpu, Activity, Lock, ArrowRight, Bell, Zap, Globe } from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#06090F] text-slate-100 relative overflow-hidden flex flex-col justify-between">
      {/* Background Precision Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:32px_32px] opacity-25 pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
            <Shield size={22} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tracking-wider text-base leading-tight">AEGIS SOC</span>
              <span className="text-[10px] px-1 py-0.2 rounded font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/20">ENTERPRISE</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">NIDS / SOAR PLATFORM</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-600/25 border border-blue-400/30"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Hero Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 text-center flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-mono mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span>
          <span>AI-POWERED INTRUSION DETECTION & SOAR DEFENSE</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-5 leading-tight">
          Enterprise SOC Telemetry & <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
            Autonomous Cyber Defense
          </span>
        </h1>

        <p className="max-w-2xl text-slate-400 text-sm sm:text-base mb-8 leading-relaxed font-sans">
          Continuously ingest, classify, and mitigate high-velocity network attacks with multi-model machine learning classifiers trained on CICIDS2017 benchmark datasets, paired with instant one-click OS firewall mitigation.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
          <Link
            to="/register"
            className="pl-6 pr-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/30 border border-blue-400/40 flex items-center gap-3 group"
          >
            <span>Launch Security Portal</span>
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
              <ArrowRight size={14} />
            </div>
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 rounded-xl bg-[#0B0F19] hover:bg-slate-900 text-slate-200 font-semibold text-sm transition-all border border-slate-700/80 flex items-center gap-2"
          >
            <Lock size={15} className="text-blue-400" />
            <span>Sign In to Dashboard</span>
          </Link>
        </div>

        {/* Asymmetric Bento Architecture Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full text-left">
          {/* Bento Hero Card (col-span-2) */}
          <div className="bezel-card p-6 md:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <Activity size={18} />
                </div>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  REAL-TIME TELEMETRY
                </span>
              </div>
              <h3 className="text-white font-semibold text-base mb-1.5">Intelligent Flow Inspection</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Live packet streaming with sub-second ML classification across DoS/DDoS, Port Scans, Brute Force, and Botnet vectors with automated confidence scoring.
              </p>
            </div>
            <div className="mt-5 p-3 rounded-lg bg-[#06090F] border border-slate-800 flex items-center justify-between font-mono text-xs">
              <span className="text-slate-400">BENCHMARK ACCURACY:</span>
              <span className="text-emerald-400 font-bold tabular-nums">98.42% (Random Forest)</span>
            </div>
          </div>

          {/* Bento Card 2: SOAR Firewalls */}
          <div className="bezel-card p-6 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center mb-4 border border-red-500/20">
                <Zap size={18} />
              </div>
              <h3 className="text-white font-semibold text-base mb-1.5">SOAR Active Defense</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Direct integration with Windows Advanced Firewall (`netsh`) and Linux `iptables` for automated one-click attacker IP isolation.
              </p>
            </div>
            <div className="mt-5 text-[11px] font-mono text-blue-400">
              One-click OS host isolation &rarr;
            </div>
          </div>

          {/* Bento Card 3: Multi-Model Machine Learning */}
          <div className="bezel-card p-6">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/20">
              <Cpu size={18} />
            </div>
            <h3 className="text-white font-semibold text-base mb-1.5">Multi-Model AI Suite</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Compare Random Forest, Decision Tree, SVM, Gradient Boosting, and Deep MLP architectures with precision-recall trade-offs.
            </p>
          </div>

          {/* Bento Card 4: IP Forensics & GeoMap (col-span-2) */}
          <div className="bezel-card p-6 md:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Globe size={18} />
                </div>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  FORENSICS
                </span>
              </div>
              <h3 className="text-white font-semibold text-base mb-1.5">Forensics & Route Geolocation</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Autonomous hop-by-hop route risk analysis, Tor exit node classification, threat intelligence timeline, and multi-channel incident report dispatch.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Encrypted report dispatch via Email & SMS</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 py-5 text-center text-slate-500 text-xs font-mono">
        AEGIS NIDS © 2026 • AI-POWERED NETWORK INTRUSION DETECTION & SOAR PLATFORM
      </footer>
    </div>
  );
};

export default LandingPage;
