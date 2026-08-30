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

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <BarChart2 className="text-purple-400" size={24} />
          Attack Vector Analytics
        </h1>
        <p className="text-slate-400 text-xs mt-1">Deep breakdown of attack categories, targeted ports, top attacking hosts, and trend timelines</p>
      </div>

      {/* Timeline Chart */}
      <div className="glass-card p-5 rounded-xl border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Radio size={16} className="text-red-400" />
          Attack Category Timeline (Hourly Distribution)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.attack_timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="hour" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="DoS" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
              <Area type="monotone" dataKey="PortScan" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
              <Area type="monotone" dataKey="BruteForce" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per Category Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.categories?.map((cat, idx) => (
          <div key={idx} className="glass-card p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-white">{cat.category}</h3>
                <div className="text-xs text-slate-400 mt-0.5">{cat.occurrences} total detected occurrences ({cat.percentage}%)</div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                cat.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                cat.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}>
                {cat.severity}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Average Confidence:</span>
                <span className="text-purple-300 font-semibold">{cat.average_confidence}%</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Top Attacking Source IPs:</span>
                <div className="flex flex-wrap gap-1">
                  {cat.top_source_ips?.map((ip, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-slate-900 rounded text-red-400 border border-slate-800 text-[10px]">{ip}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Targeted Destination IPs:</span>
                <div className="flex flex-wrap gap-1">
                  {cat.top_destination_ips?.map((ip, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-slate-900 rounded text-blue-400 border border-slate-800 text-[10px]">{ip}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Target Ports:</span>
                <div className="flex flex-wrap gap-1">
                  {cat.frequently_targeted_ports?.map((port, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px]">:{port}</span>
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
