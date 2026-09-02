import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Activity, Play, Pause, RefreshCw, Filter, Search, ShieldAlert, ArrowUpRight } from 'lucide-react';
import ToastNotification from '../components/ToastNotification';

import SimulatorControlWidget from '../components/SimulatorControlWidget';

export const LiveMonitoringPage = () => {
  const [flows, setFlows] = useState([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [searchIP, setSearchIP] = useState('');
  const [toast, setToast] = useState(null);

  const fetchRecentFlows = async () => {
    try {
      const res = await client.get('/predict/recent-flows?limit=60');
      setFlows(res.data);
    } catch (err) {
      console.error("Fetch flows error:", err);
    }
  };

  const triggerLiveTick = async () => {
    try {
      const res = await client.get('/predict/generate-live-tick');
      setFlows(prev => [res.data, ...prev.slice(0, 59)]);
      if (res.data.threat_severity === 'CRITICAL' || res.data.threat_severity === 'HIGH') {
        setToast({
          type: 'warning',
          message: `NEW ALERT: ${res.data.attack_category} attack detected from ${res.data.source_ip} (${res.data.confidence}% confidence)`
        });
      }
    } catch (err) {
      console.error("Tick error:", err);
    }
  };

  useEffect(() => {
    fetchRecentFlows();
  }, []);

  useEffect(() => {
    let interval = null;
    if (isStreaming) {
      interval = setInterval(() => {
        triggerLiveTick();
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming]);

  const filteredFlows = flows.filter(f => {
    if (severityFilter && f.threat_severity !== severityFilter) return false;
    if (searchIP) {
      const s = searchIP.toLowerCase();
      return f.source_ip.toLowerCase().includes(s) || f.destination_ip.toLowerCase().includes(s);
    }
    return true;
  });

  const getSeverityBadge = (sev) => {
    const map = {
      LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/40 font-bold animate-pulse'
    };
    return map[sev] || map.LOW;
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <ToastNotification type={toast?.type} message={toast?.message} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Activity className="text-emerald-400 animate-pulse" size={24} />
            Live Network Flow Monitoring
          </h1>
          <p className="text-slate-400 text-xs mt-1">Real-time packet capture telemetry streaming & instant ML threat classification</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-4 py-2 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
              isStreaming
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause size={16} />
                <span>Pause Live Stream</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Resume Live Stream</span>
              </>
            )}
          </button>

          <button
            onClick={triggerLiveTick}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium border border-blue-400/30 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={14} />
            <span>Generate Flow Tick</span>
          </button>
        </div>
      </div>

      {/* Traffic Simulator Controls */}
      <SimulatorControlWidget />

      {/* Filters Toolbar */}
      <div className="glass-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Search size={16} /></span>
            <input
              type="text"
              value={searchIP}
              onChange={(e) => setSearchIP(e.target.value)}
              placeholder="Search Source or Dest IP..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Threat Severities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing <span className="text-blue-400 font-bold">{filteredFlows.length}</span> live flow records
        </div>
      </div>

      {/* Live Flows Table */}
      <div className="glass-card rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Source IP : Port</th>
                <th className="px-4 py-3">Destination IP : Port</th>
                <th className="px-4 py-3">Proto</th>
                <th className="px-4 py-3">Packets / Bytes</th>
                <th className="px-4 py-3">Rate (B/s)</th>
                <th className="px-4 py-3">Prediction</th>
                <th className="px-4 py-3">Attack Category</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredFlows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-slate-500">
                    Awaiting Live Network Flow Packets...
                  </td>
                </tr>
              ) : (
                filteredFlows.map((f, idx) => (
                  <tr key={f.id || idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {new Date(f.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {f.source_ip}:<span className="text-blue-400">{f.source_port}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">
                      {f.destination_ip}:<span className="text-purple-400">{f.destination_port}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
                        {f.protocol}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {f.packet_count} pkts / {f.byte_count} B
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {(f.rate ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-bold">
                      <span className={f.prediction === 'Normal' ? 'text-emerald-400' : 'text-red-400'}>
                        {f.prediction}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">
                      {f.attack_category}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {f.confidence}%
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${getSeverityBadge(f.threat_severity)}`}>
                        {f.threat_severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-400 truncate max-w-[180px]" title={f.recommended_action}>
                      {f.recommended_action}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitoringPage;
