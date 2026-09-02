import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Play, Square, Radio, Activity, RefreshCw } from 'lucide-react';

export default function SimulatorControlWidget() {
  const [isRunning, setIsRunning] = useState(false);
  const [preset, setPreset] = useState('DoS/DDoS');
  const [pps, setPps] = useState(5);
  const [totalFlows, setTotalFlows] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await client.get('/simulator/status');
      if (res.data) {
        setIsRunning(res.data.is_running);
        if (res.data.total_flows_generated !== undefined) {
          setTotalFlows(res.data.total_flows_generated);
        }
      }
    } catch (err) {
      console.warn('Simulator status fetch warning:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async () => {
    setLoading(true);
    const nextState = !isRunning;
    setIsRunning(nextState); // Instant UI optimistic feedback

    try {
      if (nextState) {
        const res = await client.post('/simulator/start', {
          attack_preset: preset,
          packets_per_sec: parseInt(pps),
          target_ip: '10.0.0.1'
        });
        if (res.data) {
          setIsRunning(res.data.is_running);
          setTotalFlows(res.data.total_flows_generated || totalFlows);
        }
      } else {
        const res = await client.post('/simulator/stop', {});
        if (res.data) {
          setIsRunning(res.data.is_running);
        }
      }
    } catch (err) {
      console.warn('Backend API simulator toggle warning, running locally:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border transition-all ${
            isRunning 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse' 
              : 'bg-slate-800/80 border-slate-700 text-slate-400'
          }`}>
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Live Traffic Replay Simulator</h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 border ${
                isRunning 
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                <Radio className={`w-3 h-3 ${isRunning ? 'animate-ping text-rose-400' : ''}`} />
                {isRunning ? 'SIMULATION ACTIVE' : 'IDLE / STOPPED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Synthesized Attack Packets Generated: <span className="text-cyan-400 font-mono font-bold">{totalFlows}</span>
            </p>
          </div>
        </div>

        {/* Simulator Controls */}
        <div className="flex items-center gap-3">
          {!isRunning && (
            <>
              <div>
                <select
                  value={preset}
                  onChange={(e) => setPreset(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-xs font-medium rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="DoS/DDoS">DoS / DDoS Burst</option>
                  <option value="Port Scan">Port Scan Sweep</option>
                  <option value="Brute Force">Brute Force Attempt</option>
                  <option value="Mixed">Mixed Attack Traffic</option>
                </select>
              </div>

              <div>
                <select
                  value={pps}
                  onChange={(e) => setPps(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-xs font-medium rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value={2}>2 pkts/sec</option>
                  <option value={5}>5 pkts/sec</option>
                  <option value={10}>10 pkts/sec</option>
                </select>
              </div>
            </>
          )}

          <button
            onClick={handleToggle}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
              isRunning
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 border border-rose-400/30'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30 border border-cyan-400/30'
            }`}
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isRunning ? (
              <Square className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isRunning ? 'Stop Simulation' : 'Launch Simulation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
