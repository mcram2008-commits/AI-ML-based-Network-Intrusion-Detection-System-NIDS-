import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Globe, Search, ShieldAlert, Activity, Clock, Server, Mail } from 'lucide-react';
import ToastNotification from '../components/ToastNotification';
import SendIPReportModal from '../components/SendIPReportModal';

export const IPInvestigationPage = () => {
  const [ipInput, setIpInput] = useState('185.220.101.5');
  const [ipData, setIpData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);

  const fetchIPDetails = async (targetIP) => {
    setLoading(true);
    try {
      const res = await client.get(`/ip/${targetIP}`);
      setIpData(res.data);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to retrieve IP telemetry details' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIPDetails('185.220.101.5');
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (ipInput.trim()) {
      fetchIPDetails(ipInput.trim());
    }
  };

  const getThreatColor = (score) => {
    if (score > 75) return 'text-red-400 border-red-500/40 bg-red-500/10';
    if (score > 50) return 'text-orange-400 border-orange-500/40 bg-orange-500/10';
    if (score > 20) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <ToastNotification type={toast?.type} message={toast?.message} onClose={() => setToast(null)} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Globe className="text-blue-400" size={24} />
          IP Threat Investigation Console
        </h1>
        <p className="text-slate-400 text-xs mt-1">Deep forensic telemetry, historical connection timeline, and threat score assessment</p>
      </div>

      {/* Search & Email Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="glass-panel p-4 rounded-xl flex items-center gap-3 max-w-xl flex-1">
          <form onSubmit={handleSearch} className="flex items-center gap-3 w-full">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Search size={16} /></span>
              <input
                type="text"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                placeholder="Enter IP address e.g. 185.220.101.5"
                className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors border border-blue-400/30 flex items-center gap-1.5"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : 'Investigate'}
            </button>
          </form>
        </div>

        <button
          onClick={() => setIsMailModalOpen(true)}
          className="px-4 py-3 bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl border border-indigo-400/40 shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
        >
          <Mail size={16} />
          <span>Dispatch IP Incident Email Report</span>
        </button>
      </div>

      <SendIPReportModal
        isOpen={isMailModalOpen}
        onClose={() => setIsMailModalOpen(false)}
        initialSourceIp={ipData?.ip_address || ipInput || '185.220.101.5'}
        initialDestinationIp={ipData?.destination_ips?.[0] || '10.0.0.1'}
      />

      {/* IP Telemetry Summary */}
      {ipData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Target Host IP</span>
              <div className="text-xl font-bold text-white font-mono">{ipData.ip_address}</div>
            </div>

            <div className="glass-card p-5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Total Flow Connections</span>
              <div className="text-xl font-bold text-blue-400 font-mono">{ipData.total_connections}</div>
            </div>

            <div className="glass-card p-5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Malicious Attacks</span>
              <div className="text-xl font-bold text-red-400 font-mono">{ipData.attack_count}</div>
            </div>

            <div className={`glass-card p-5 rounded-xl border ${getThreatColor(ipData.threat_score)}`}>
              <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Threat Rating</span>
              <div className="text-xl font-black font-mono">{ipData.threat_score} / 100 ({ipData.threat_level})</div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans mb-2">Targeted Destinations</h3>
              <div className="space-y-1">
                {ipData.destination_ips?.map((ip, i) => (
                  <div key={i} className="p-2 rounded bg-slate-950/60 border border-slate-800 text-slate-200">{ip}</div>
                ))}
              </div>
            </div>

            <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans mb-2">Ports & Protocols</h3>
              <div>
                <span className="text-slate-400 block mb-1">Ports Accessed:</span>
                <div className="flex flex-wrap gap-1">
                  {ipData.ports_accessed?.map((port, i) => (
                    <span key={i} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">:{port}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Protocols Used:</span>
                <div className="flex flex-wrap gap-1">
                  {ipData.protocols_used?.map((proto, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">{proto}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-3 text-xs font-mono">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans mb-2">First / Last Seen</h3>
              <div><span className="text-slate-400">First Seen:</span> <div className="text-white">{ipData.first_seen}</div></div>
              <div><span className="text-slate-400">Last Seen:</span> <div className="text-white">{ipData.last_seen}</div></div>
            </div>
          </div>

          {/* Historical Activity Timeline */}
          <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock size={16} className="text-blue-400" />
              Historical Connection Flow Timeline
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 font-mono">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2">Timestamp</th>
                    <th className="px-3 py-2">Destination Host</th>
                    <th className="px-3 py-2">Port</th>
                    <th className="px-3 py-2">Protocol</th>
                    <th className="px-3 py-2">Prediction</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {ipData.timeline?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="px-3 py-2 text-slate-400">{new Date(item.timestamp).toLocaleTimeString()}</td>
                      <td className="px-3 py-2 text-white">{item.destination_ip}</td>
                      <td className="px-3 py-2 text-purple-400">:{item.destination_port}</td>
                      <td className="px-3 py-2 text-slate-300">{item.protocol}</td>
                      <td className={`px-3 py-2 font-bold ${item.prediction === 'Normal' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {item.prediction}
                      </td>
                      <td className="px-3 py-2 text-slate-200">{item.attack_category}</td>
                      <td className="px-3 py-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                          {item.threat_severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IPInvestigationPage;
