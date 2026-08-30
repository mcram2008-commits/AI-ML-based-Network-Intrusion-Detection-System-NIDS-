import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Cpu, Activity, Lock, ArrowRight, CheckCircle, Database, Bell } from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 relative overflow-hidden flex flex-col justify-between">
      {/* Background Cybersecurity Glow Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:32px_32px] opacity-25 pointer-events-none"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Shield size={24} className="animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-wide text-lg">AEGIS NIDS</h1>
            <span className="text-[10px] text-blue-400 font-mono tracking-widest">NEXT-GEN CYBERSECURITY</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-lg shadow-blue-600/30 border border-blue-400/30"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Hero Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-16 text-center flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
          <span>AI-POWERED NETWORK INTRUSION DETECTION ENGINE</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
          Real-Time Threat Intelligence & <br />
          <span className="cyber-gradient-text">Automated Network Defense</span>
        </h1>

        <p className="max-w-2xl text-slate-400 text-base sm:text-lg mb-10 leading-relaxed">
          Monitor, detect, classify, and mitigate malicious network flow attacks including DoS/DDoS, Port Scans, Brute Force, and Botnets with machine learning classifiers trained on CICIDS2017 benchmark datasets.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Link
            to="/register"
            className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base transition-all shadow-xl shadow-blue-600/40 border border-blue-400/40 flex items-center gap-2 group"
          >
            Get Started
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/login"
            className="px-8 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-base transition-all border border-slate-700/80 flex items-center gap-2"
          >
            <Lock size={18} className="text-blue-400" />
            Access Dashboard
          </Link>
        </div>

        {/* Core Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="glass-card p-6 rounded-xl border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/20">
              <Activity size={20} />
            </div>
            <h3 className="text-white font-semibold text-base mb-2">Live Traffic Monitoring</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Real-time packet and flow ingestion with automated feature scaling, protocol classification, and instant threat severity scoring.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/20">
              <Cpu size={20} />
            </div>
            <h3 className="text-white font-semibold text-base mb-2">Multi-Model ML Suite</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Train & compare Random Forest, Decision Tree, Logistic Regression, SVM, Gradient Boosting, and Neural Networks with empirical metrics.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
              <Bell size={20} />
            </div>
            <h3 className="text-white font-semibold text-base mb-2">SOC Threat Operations</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Automated alert lifecycle management, IP threat investigation timeline, attack category analytics, and executive PDF/CSV security reporting.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/60 py-6 text-center text-slate-500 text-xs font-mono">
        AEGIS NIDS © 2026 • AI-POWERED NETWORK INTRUSION DETECTION SYSTEM
      </footer>
    </div>
  );
};

export default LandingPage;
