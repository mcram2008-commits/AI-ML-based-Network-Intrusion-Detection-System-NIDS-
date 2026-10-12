import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Radio, Play, Square, Activity, Cpu, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function RealSnifferWidget() {
  const [interfaces, setInterfaces] = useState([]);
  const [selectedIface, setSelectedIface] = useState('');
  const [status, setStatus] = useState({
    is_running: false,
    active_interface: '',
    total_packets_captured: 0,
    total_flows_created: 0,
    threats_detected: 0
  });
  const [loading, setLoading] = useState(false);

  const fetchInterfaces = async () => {
    try {
      const res = await client.get('/sniffer/interfaces');
      setInterfaces(res.data);
      if (res.data.length > 0 && !selectedIface) {
        setSelectedIface(res.data[0].name);
      }
    } catch (err) {
      console.warn("Interfaces error:", err);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await client.get('/sniffer/status');
      setStatus(res.data);
    } catch (err) {
      console.warn("Status fetch error:", err);
    }
  };

  useEffect(() => {
    fetchInterfaces();
    fetchStatus();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchStatus, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    try {
      setLoading(true);
      const res = await client.post('/sniffer/start', {
        interface_name: selectedIface || 'Default Wi-Fi / Ethernet Adapter'
      });
      setStatus(res.data);
    } catch (err) {
      console.error("Start sniffer error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      setLoading(true);
      const res = await client.post('/sniffer/stop');
      setStatus(res.data);
    } catch (err) {
      console.error("Stop sniffer error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bezel-card p-5 space-y-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${status.is_running ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800/60 text-slate-400 border-slate-700/60'}`}>
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">Real Network Packet Capture Engine</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${status.is_running ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-slate-800/60 text-slate-400 border-slate-700/60'}`}>
                {status.is_running ? 'SNIFFER ACTIVE (SCAPY)' : 'IDLE'}
              </span>
            </div>
            <p className="text-xs text-slate-400">Capture real Wi-Fi / Ethernet frames and feed into ML threat classifier</p>
          </div>
        </div>

        {/* Start / Stop Toggle */}
        <div className="flex items-center gap-3">
          {status.is_running ? (
            <button
              onClick={handleStop}
              disabled={loading}
              className="group relative px-4 py-2 bg-red-600/90 hover:bg-red-500 text-white font-semibold text-xs rounded-lg shadow-lg shadow-red-600/20 border border-red-400/30 flex items-center gap-2 transition-all active:translate-y-px"
            >
              <span className="w-4 h-4 rounded bg-white/10 flex items-center justify-center">
                <Square size={11} className="fill-current" />
              </span>
              <span>Stop Capture</span>
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={loading}
              className="group relative px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-lg shadow-emerald-600/20 border border-emerald-400/30 flex items-center gap-2 transition-all active:translate-y-px"
            >
              <span className="w-4 h-4 rounded bg-white/10 flex items-center justify-center">
                <Play size={11} className="fill-current" />
              </span>
              <span>Start Real Packet Capture</span>
            </button>
          )}
        </div>
      </div>

      {/* Adapter Selector & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Interface Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Select Network Adapter</label>
          <select
            value={selectedIface}
            onChange={(e) => setSelectedIface(e.target.value)}
            disabled={status.is_running}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
          >
            {interfaces.map((iface, idx) => (
              <option key={idx} value={iface.name}>
                {iface.name} ({iface.ip})
              </option>
            ))}
          </select>
        </div>

        {/* Metrics Cards */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 font-mono">
          <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">Total Packets Captured</span>
          <div className="text-lg font-bold text-emerald-400">{status.total_packets_captured.toLocaleString()} pkts</div>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 font-mono">
          <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">Flows Aggregated</span>
          <div className="text-lg font-bold text-cyan-400">{status.total_flows_created.toLocaleString()} flows</div>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 font-mono">
          <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">Threats Detected</span>
          <div className="text-lg font-bold text-red-400">{status.threats_detected.toLocaleString()} threats</div>
        </div>
      </div>
    </div>
  );
}
