import React, { useState, useEffect } from 'react';
import client from '../api/client';
import {
  ShieldAlert, Activity, Cpu, AlertTriangle, CheckCircle,
  Zap, Globe, Radio, RefreshCw, Layers
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [resStats, resCharts] = await Promise.all([
        client.get('/dashboard/stats'),
        client.get('/dashboard/charts')
      ]);
      setStats(resStats.data);
      setCharts(resCharts.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-400">Loading NIDS Threat Analytics...</span>
        </div>
      </div>
    );
  }

  const threatColor = {
    LOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
  }[stats?.current_threat_level || 'LOW'];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Title & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Radio className="text-blue-400 animate-pulse" size={24} />
            NIDS Security Operations Center
          </h1>
          <p className="text-slate-400 text-xs mt-1">Real-time network traffic telemetry & machine learning intrusion detection</p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-2 ${threatColor}`}>
            <span>THREAT LEVEL:</span>
            <span>{stats?.current_threat_level}</span>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors flex items-center gap-2 text-xs font-medium"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards (8 key metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Flows Analyzed</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center"><Activity size={18} /></div>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{(stats?.total_flows ?? 0).toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">Monitored Connection Flows</div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Normal Traffic</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><CheckCircle size={18} /></div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">{(stats?.normal_traffic_count ?? 0).toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">Benign Packets</div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attacks Detected</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center"><AlertTriangle size={18} /></div>
          </div>
          <div className="text-2xl font-extrabold text-red-400 font-mono">{(stats?.attack_count ?? 0).toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">Malicious Flow Attempts</div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detection Accuracy</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center"><Cpu size={18} /></div>
          </div>
          <div className="text-2xl font-extrabold text-purple-300 font-mono">{stats?.detection_accuracy}%</div>
          <div className="text-[11px] text-slate-500 mt-1">{stats?.active_model_name}</div>
        </div>
      </div>

      {/* 8 Interactive Charts Grid */}

      {/* Row 1: Traffic Over Time & Normal vs Malicious */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-5 rounded-xl border border-slate-800 lg:col-span-2">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Activity size={16} className="text-blue-400" />
            1. Network Traffic Volume Over Time
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.traffic_over_time || []}>
                <defs>
                  <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="normal" name="Normal Packets" stroke="#10B981" fillOpacity={1} fill="url(#colorNormal)" />
                <Area type="monotone" dataKey="attacks" name="Attacks" stroke="#EF4444" fillOpacity={1} fill="url(#colorAttacks)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Layers size={16} className="text-emerald-400" />
            2. Normal vs Malicious Traffic
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.normal_vs_malicious || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(charts?.normal_vs_malicious || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Attack Categories & Threat Severity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-400" />
            3. Attack Category Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.attack_distribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="category" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="count" name="Occurrences" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400" />
            4. Threat Severity Breakdown
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.threat_severity || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis type="number" stroke="#64748B" fontSize={11} />
                <YAxis dataKey="level" type="category" stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="count" name="Flow Count" fill="#F59E0B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Detection Rate & Protocol Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Zap size={16} className="text-purple-400" />
            5. Detection Accuracy Rate (%)
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.detection_rate_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                <YAxis domain={[95, 100]} stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
                <Line type="monotone" dataKey="rate" stroke="#8B5CF6" strokeWidth={2.5} dot={{ fill: '#8B5CF6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Globe size={16} className="text-blue-400" />
            6. Protocol Distribution
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts?.protocol_distribution || []} dataKey="count" nameKey="protocol" cx="50%" cy="50%" outerRadius={70} fill="#3B82F6" label>
                  {(charts?.protocol_distribution || []).map((entry, idx) => (
                    <Cell key={idx} fill={['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'][idx % 4]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Top Source IPs & Top Destination IPs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Radio size={16} className="text-red-400" />
            7. Top Source IP Activity (Attacker Hosts)
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.top_source_ips || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="ip" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="count" name="Flow Count" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Globe size={16} className="text-emerald-400" />
            8. Top Destination IP Activity (Target Systems)
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.top_dest_ips || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="ip" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="count" name="Received Flows" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
