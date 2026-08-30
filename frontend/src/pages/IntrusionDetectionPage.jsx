import React, { useState } from 'react';
import client from '../api/client';
import { Search, Cpu, ShieldAlert, CheckCircle, ArrowRight, Zap } from 'lucide-react';
import ToastNotification from '../components/ToastNotification';

export const IntrusionDetectionPage = () => {
  const [formData, setFormData] = useState({
    source_ip: '185.220.101.5',
    destination_ip: '10.0.0.1',
    source_port: 44102,
    destination_port: 80,
    protocol: 'TCP',
    packet_count: 25000,
    byte_count: 2500000,
    duration: 0.5,
    rate: 5000000
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const presets = [
    {
      name: 'DoS/DDoS Attack Preset',
      data: { source_ip: '185.220.101.5', destination_ip: '10.0.0.1', source_port: 54102, destination_port: 80, protocol: 'TCP', packet_count: 45000, byte_count: 3200000, duration: 0.2, rate: 16000000 }
    },
    {
      name: 'Port Scan Preset',
      data: { source_ip: '193.142.146.210', destination_ip: '172.16.1.100', source_port: 61002, destination_port: 22, protocol: 'TCP', packet_count: 2, byte_count: 120, duration: 0.01, rate: 12000 }
    },
    {
      name: 'Brute Force SSH Preset',
      data: { source_ip: '45.142.214.12', destination_ip: '10.0.0.5', source_port: 48900, destination_port: 22, protocol: 'TCP', packet_count: 65, byte_count: 8500, duration: 1.5, rate: 5666 }
    },
    {
      name: 'Benign HTTPS Flow Preset',
      data: { source_ip: '192.168.1.105', destination_ip: '10.0.0.1', source_port: 52100, destination_port: 443, protocol: 'HTTPS', packet_count: 120, byte_count: 65000, duration: 2.1, rate: 30952 }
    }
  ];

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await client.post('/predict', formData);
      setResult(res.data);
      setToast({ type: 'success', message: 'Flow analyzed by ML Intrusion Detection Engine' });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to analyze network flow' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <ToastNotification type={toast?.type} message={toast?.message} onClose={() => setToast(null)} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Search className="text-blue-400" size={24} />
          Intrusion Detection Flow Analyzer
        </h1>
        <p className="text-slate-400 text-xs mt-1">Manual flow feature diagnostic pipeline & instant ML prediction engine</p>
      </div>

      {/* Presets Bar */}
      <div className="glass-panel p-4 rounded-xl space-y-2">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Load Diagnostic Test Presets:</span>
        <div className="flex flex-wrap gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setFormData(p.data)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-blue-300 transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="glass-card p-6 rounded-xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Zap size={16} className="text-amber-400" />
            Network Flow Metrics Input
          </h2>

          <form onSubmit={handlePredict} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Source IP</label>
                <input
                  type="text"
                  value={formData.source_ip}
                  onChange={(e) => setFormData({ ...formData, source_ip: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Destination IP</label>
                <input
                  type="text"
                  value={formData.destination_ip}
                  onChange={(e) => setFormData({ ...formData, destination_ip: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Source Port</label>
                <input
                  type="number"
                  value={formData.source_port}
                  onChange={(e) => setFormData({ ...formData, source_port: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Dest Port</label>
                <input
                  type="number"
                  value={formData.destination_port}
                  onChange={(e) => setFormData({ ...formData, destination_port: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Protocol</label>
                <select
                  value={formData.protocol}
                  onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white"
                >
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                  <option value="HTTPS">HTTPS</option>
                  <option value="ICMP">ICMP</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Packet Count</label>
                <input
                  type="number"
                  value={formData.packet_count}
                  onChange={(e) => setFormData({ ...formData, packet_count: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Byte Count</label>
                <input
                  type="number"
                  value={formData.byte_count}
                  onChange={(e) => setFormData({ ...formData, byte_count: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Duration (s)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-all border border-blue-400/30 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Cpu size={16} />
                  <span>Execute ML Model Prediction</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Prediction Results Display */}
        <div className="glass-card p-6 rounded-xl border border-slate-800 space-y-6 flex flex-col justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Cpu size={16} className="text-purple-400" />
            ML Classification Diagnosis
          </h2>

          {result ? (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Threat Verdict:</span>
                  <span className={`text-lg font-black tracking-wider ${result.prediction === 'Normal' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.prediction.toUpperCase()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Attack Category:</span>
                  <span className="text-sm font-bold text-white font-mono">{result.attack_category}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Model Confidence:</span>
                  <span className="text-sm font-bold text-purple-300 font-mono">{result.confidence}%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Threat Severity:</span>
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                    result.threat_severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                    result.threat_severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                    result.threat_severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    {result.threat_severity}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Recommended Action:</div>
                <p className="text-xs text-slate-200 leading-relaxed font-mono">{result.recommended_action}</p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <Cpu size={48} className="mb-3 opacity-30 text-blue-400" />
              <p className="text-xs font-mono">Fill flow parameters and click "Execute ML Model Prediction"</p>
            </div>
          )}

          <div className="text-[11px] text-slate-500 font-mono border-t border-slate-800 pt-3">
            PIPELINE: Raw Traffic → Feature Scaling → Random Forest Classifier → Threat Severity Matrix
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntrusionDetectionPage;
