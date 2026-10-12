import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { BarChart2, ShieldAlert, Radio, Globe, Layers } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export const AttackAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await client.get('/attacks');
        setData(res.data);
      } catch (err) {
        console.error("Attack analytics error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-400">Loading Attack Vectors Analytics...</span>
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
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto w-full pb-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <BarChart2 size={18} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Attack Vector Analytics
          </h1>
        </div>
        <p className="text-slate-400 text-xs mt-1">Deep breakdown of attack categories, targeted ports, top attacking hosts, and trend timelines</p>
      </div>

      {/* Timeline Chart */}
      <div className="bezel-card p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
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
                  {cat.occurrences?.toLocaleString()} total detected occurrences ({cat.percentage}%)
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
    </div>
  );
};

export default AttackAnalyticsPage;
