import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { 
  BarChart2, ShieldAlert, Radio, Globe, Layers, 
  Grid, Shield, AlertTriangle, ArrowRight, X, ExternalLink, 
  CheckCircle2, Flame, RefreshCw 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export const AttackAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [mitreData, setMitreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTechnique, setSelectedTechnique] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [resAttacks, resMitre] = await Promise.all([
        client.get('/attacks'),
        client.get('/attacks/mitre-matrix')
      ]);
      setData(resAttacks.data);
      setMitreData(resMitre.data);
    } catch (err) {
      console.error("Attack analytics error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-400 font-mono">Loading MITRE ATT&CK Matrix & Analytics...</span>
        </div>
      </div>
    );
  }

  const chartTooltipStyle = {
    backgroundColor: '#0B0F19',
    borderColor: '#1E293B',
    borderRadius: '8px',
    color: '#F1F5F9',
    fontSize: '11px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
    padding: '8px 12px'
  };

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-[1600px] mx-auto w-full pb-10">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-sm">
              <BarChart2 size={19} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Attack Vector Analytics & MITRE ATT&CK Matrix
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Real-time MITRE ATT&CK v14 tactics mapping, hourly distribution trends, and targeted port telemetry
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchAnalytics}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
          title="Refresh Telemetry"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* MITRE ATT&CK ENTERPRISE MATRIX HEATMAP SECTION */}
      <div className="bezel-card p-5 sm:p-6 space-y-5 border border-purple-500/20 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Grid size={17} className="text-purple-400" />
                MITRE ATT&CK® Enterprise Matrix Heatmap
              </h2>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded font-mono font-bold">
                Enterprise v14
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live adversary tactics mapped to detected network intrusion flows. Red/Amber glowing badges indicate active intrusions.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">
              Active Techniques Triggered: <strong className="text-red-400">{mitreData?.total_active_techniques ?? 6}</strong>
            </span>
          </div>
        </div>

        {/* Matrix Grid Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {(mitreData?.tactics || []).map((tactic) => (
            <div key={tactic.tactic_id} className="space-y-2">
              {/* Column Header */}
              <div 
                className="p-2.5 rounded-lg border text-xs font-mono font-bold text-white flex flex-col justify-between min-h-[58px]"
                style={{ 
                  backgroundColor: `${tactic.color}15`, 
                  borderColor: `${tactic.color}40`,
                  borderTopWidth: '3px',
                  borderTopColor: tactic.color
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">{tactic.tactic_id}</span>
                  <span className="text-[10px] text-slate-500">Stage {tactic.phase}</span>
                </div>
                <div className="truncate text-xs font-bold text-slate-100" title={tactic.tactic_name}>
                  {tactic.tactic_name}
                </div>
              </div>

              {/* Techniques in this Tactic */}
              <div className="space-y-2">
                {tactic.techniques?.map((tech) => {
                  const hasAttacks = tech.detected_count > 0;
                  return (
                    <div
                      key={tech.technique_id}
                      onClick={() => setSelectedTechnique(tech)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 text-left space-y-1.5 ${
                        hasAttacks 
                          ? 'bg-slate-950 hover:bg-slate-900 border-red-500/40 shadow-sm shadow-red-500/10 hover:border-red-400' 
                          : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-purple-400 font-bold">
                          {tech.technique_id}
                        </span>
                        {hasAttacks && (
                          <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[9px] font-mono font-bold animate-pulse">
                            {tech.detected_count} ALERTS
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-semibold text-white leading-tight font-sans line-clamp-2">
                        {tech.technique_name}
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                        <span>{tech.mapped_category}</span>
                        <span className={tech.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}>
                          {tech.severity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="bezel-card p-5 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2 font-mono">
          <Radio size={15} className="text-red-400" />
          Attack Category Timeline (Hourly Distribution)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.attack_timeline || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#141C2E" />
              <XAxis dataKey="hour" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Area type="monotone" dataKey="DoS" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.4} strokeWidth={1.5} />
              <Area type="monotone" dataKey="PortScan" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.4} strokeWidth={1.5} />
              <Area type="monotone" dataKey="BruteForce" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.4} strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per Category Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(data?.categories || []).map((cat, idx) => (
          <div key={idx} className="bezel-card p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-white">{cat.category}</h3>
                <div className="text-[11px] text-slate-400 mt-0.5 font-mono tabular-nums">
                  {cat.occurrences?.toLocaleString()} detected occurrences ({cat.percentage}%)
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                cat.severity === 'CRITICAL' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                cat.severity === 'HIGH' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' :
                'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}>
                {cat.severity}
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 bg-[#06090F] p-3.5 rounded-lg border border-slate-800 font-mono">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-sans text-[11px]">Average Confidence:</span>
                <span className="text-purple-300 font-semibold tabular-nums">{cat.average_confidence}%</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 font-sans text-[11px]">Top Attacking Source IPs:</span>
                <div className="flex flex-wrap gap-1">
                  {cat.top_source_ips?.map((ip, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-[#0B0F19] rounded text-red-400 border border-slate-800 text-[10px] font-mono">{ip}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 font-sans text-[11px]">Targeted Destination IPs:</span>
                <div className="flex flex-wrap gap-1">
                  {cat.top_destination_ips?.map((ip, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-[#0B0F19] rounded text-blue-400 border border-slate-800 text-[10px] font-mono">{ip}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 font-sans text-[11px]">Target Ports:</span>
                <div className="flex flex-wrap gap-1">
                  {cat.frequently_targeted_ports?.map((port, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-[#0B0F19] text-purple-300 border border-slate-800 rounded text-[10px] font-mono">:{port}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MITRE Technique Drill-Down Modal */}
      {selectedTechnique && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bezel-card max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 border border-purple-500/40">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                    {selectedTechnique.technique_id}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {selectedTechnique.sub_technique}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedTechnique.technique_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTechnique(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Mapped NIDS Category</span>
                  <span className="text-white font-bold">{selectedTechnique.mapped_category}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Severity Level</span>
                  <span className={`font-bold font-mono ${selectedTechnique.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`}>
                    {selectedTechnique.severity}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Active Detections</span>
                  <span className="text-red-400 font-bold font-mono">{selectedTechnique.detected_count} flows</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-1 uppercase tracking-wider font-mono">
                  Technique Adversary Behavior:
                </span>
                <p className="text-slate-300 text-xs leading-relaxed p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  {selectedTechnique.description}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-emerald-400 block mb-1 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Shield size={14} />
                  SOC Countermeasures & Mitigation:
                </span>
                <p className="text-slate-200 text-xs leading-relaxed p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 font-mono">
                  {selectedTechnique.mitigation}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedTechnique(null)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
              >
                Close Technique Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AttackAnalyticsPage;
