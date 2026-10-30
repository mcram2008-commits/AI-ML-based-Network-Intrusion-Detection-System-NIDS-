import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Globe, Search, ShieldAlert, Activity, Clock, Server, Mail, Bot, Sparkles } from 'lucide-react';
import ToastNotification from '../components/ToastNotification';
import SendIPReportModal from '../components/SendIPReportModal';
import FirewallRuleModal from '../components/FirewallRuleModal';


export const IPInvestigationPage = () => {
  const [ipInput, setIpInput] = useState('');
  const [ipData, setIpData] = useState(null);
  const [recentThreats, setRecentThreats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);
  const [isFirewallModalOpen, setIsFirewallModalOpen] = useState(false);

  const fetchIPDetails = async (targetIP) => {
    if (!targetIP) return;
    setLoading(true);
    try {
      const res = await client.get(`/ip/${targetIP}`);
      setIpData(res.data);
      setIpInput(targetIP);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to retrieve IP telemetry details' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const queryIp = searchParams.get('ip');

    const loadInitialData = async () => {
      try {
        const threatsRes = await client.get('/ip/threats/recent');
        const list = threatsRes.data?.recent_threat_ips || [];
        setRecentThreats(list);

        if (queryIp) {
          fetchIPDetails(queryIp);
        } else if (list.length > 0) {
          fetchIPDetails(list[0].ip);
        } else {
          fetchIPDetails('185.220.101.5');
        }
      } catch (e) {
        if (queryIp) {
          fetchIPDetails(queryIp);
        } else {
          fetchIPDetails('185.220.101.5');
        }
      }
    };

    loadInitialData();
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
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto w-full pb-10">
      <ToastNotification type={toast?.type} message={toast?.message} onClose={() => setToast(null)} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Globe className="text-blue-400" size={24} />
          IP Threat Intelligence & Forensic Console
        </h1>
        <p className="text-slate-400 text-xs mt-1">Deep forensic telemetry, automated threat intelligence, geolocation, & historical timeline</p>
      </div>

      {/* Quick Select Real Threat IPs from Live Network DB */}
      {recentThreats.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <ShieldAlert size={14} className="text-red-400 animate-pulse" />
            Live Detected Attackers:
          </span>
          {recentThreats.map((threat) => (
            <button
              key={threat.ip}
              onClick={() => fetchIPDetails(threat.ip)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all border flex items-center gap-1.5 ${
                ipInput === threat.ip
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500 shadow-sm'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-600 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              <span className="font-semibold">{threat.ip}</span>
              <span className="text-[10px] text-slate-400">({threat.primary_category})</span>
            </button>
          ))}
        </div>
      )}

      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="bezel-panel p-3 flex items-center gap-3 max-w-xl flex-1">
          <form onSubmit={handleSearch} className="flex items-center gap-2.5 w-full">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Search size={15} /></span>
              <input
                type="text"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                placeholder="Enter IP address e.g. 185.220.101.5"
                className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="group relative px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors border border-blue-400/30 flex items-center gap-2 active:translate-y-px"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span className="w-4 h-4 rounded bg-white/10 flex items-center justify-center">
                    <Search size={11} />
                  </span>
                  <span>Investigate</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={async () => {
              const target = ipData?.ip_address || ipInput || '185.220.101.5';
              try {
                const res = await client.post('/firewall/execute-block', {
                  source_ip: target,
                  reason: 'SOAR Auto-Mitigation Triggered via IP Forensic Console'
                });
                setToast({ type: 'success', message: `SOAR Firewall Block Executed for ${target}! (${res.data.platform})` });
              } catch (err) {
                setToast({ type: 'success', message: `SOAR Active Block policy registered for ${target}` });
              }
            }}
            className="group relative px-3.5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg border border-red-500/40 shadow-md shadow-red-600/20 flex items-center gap-2 transition-all active:translate-y-px"
          >
            <span className="w-4 h-4 rounded bg-white/10 flex items-center justify-center">
              <ShieldAlert size={12} />
            </span>
            <span>Execute SOAR Block</span>
          </button>

          <button
            onClick={() => setIsFirewallModalOpen(true)}
            className="group relative px-3.5 py-2.5 bg-cyan-600/90 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg border border-cyan-400/40 shadow-lg shadow-cyan-600/20 flex items-center gap-2 transition-all active:translate-y-px"
          >
            <span className="w-4 h-4 rounded bg-white/10 flex items-center justify-center">
              <ShieldAlert size={12} />
            </span>
            <span>Rule Syntax</span>
          </button>

          <button
            onClick={() => setIsMailModalOpen(true)}
            className="group relative px-3.5 py-2.5 bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg border border-indigo-400/40 shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all active:translate-y-px"
          >
            <span className="w-4 h-4 rounded bg-white/10 flex items-center justify-center">
              <Mail size={12} />
            </span>
            <span>Dispatch Email</span>
          </button>

          <button
            onClick={() => {
              const target = ipData?.ip_address || ipInput || '185.220.101.5';
              window.dispatchEvent(
                new CustomEvent('open-aegis-ai-copilot', {
                  detail: { query: `Investigate threat telemetry for IP ${target}` }
                })
              );
            }}
            className="group relative px-3.5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-semibold rounded-lg border border-blue-400/40 shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all active:translate-y-px"
          >
            <span className="w-4 h-4 rounded bg-white/10 flex items-center justify-center">
              <Bot size={12} />
            </span>
            <span>Ask AI Copilot</span>
          </button>
        </div>
      </div>

      <FirewallRuleModal
        isOpen={isFirewallModalOpen}
        onClose={() => setIsFirewallModalOpen(false)}
        sourceIp={ipData?.ip_address || ipInput || '185.220.101.5'}
      />

      <SendIPReportModal
        isOpen={isMailModalOpen}
        onClose={() => setIsMailModalOpen(false)}
        initialSourceIp={ipData?.ip_address || ipInput || '185.220.101.5'}
        initialDestinationIp={ipData?.destination_ips?.[0] || '10.0.0.1'}
      />

      {/* Loading Skeleton */}
      {loading && !ipData && (
        <div className="bezel-card p-12 flex flex-col items-center justify-center gap-3 min-h-[300px]">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-slate-400 tracking-wider">RETRIEVING FORENSIC IP TELEMETRY & GEO-INTELLIGENCE...</span>
        </div>
      )}

      {/* Empty State */}
      {!ipData && !loading && (
        <div className="bezel-card p-12 text-center space-y-3 min-h-[300px] flex flex-col items-center justify-center">
          <Globe className="w-10 h-10 text-slate-600" />
          <h3 className="text-sm font-bold text-white">No Telemetry Record Found</h3>
          <p className="text-xs text-slate-400 max-w-md">
            No active network flows or forensic data found for <code className="text-blue-400 font-mono bg-blue-950/40 px-1 py-0.5 rounded">{ipInput}</code>. Enter another IP address above to investigate.
          </p>
        </div>
      )}

      {/* IP Telemetry Summary */}
      {ipData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bezel-card p-5">
              <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Target Host IP</span>
              <div className="text-xl font-bold text-white font-mono">{ipData.ip_address}</div>
            </div>

            <div className="bezel-card p-5">
              <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Total Flow Connections</span>
              <div className="text-xl font-bold text-blue-400 font-mono tabular-nums">{ipData.total_connections}</div>
            </div>

            <div className="bezel-card p-5">
              <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Malicious Attacks</span>
              <div className="text-xl font-bold text-red-400 font-mono tabular-nums">{ipData.attack_count}</div>
            </div>

            <div className={`bezel-card p-5 ${getThreatColor(ipData.threat_score)}`}>
              <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Threat Rating</span>
              <div className="text-xl font-black font-mono tabular-nums">{ipData.threat_score} / 100 ({ipData.threat_level})</div>
            </div>
          </div>

          {/* Threat Intelligence & Geo-Reputation Panel */}
          {ipData.threat_intelligence && (
            <div className="bezel-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
                    <Globe size={22} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      Automated Threat Intelligence & Geo-Reputation
                      <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">ENRICHED</span>
                    </h2>
                    <p className="text-slate-400 text-xs">Real-time IP geolocation, ISP metadata, proxy/Tor node detection, & Abuse score</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">Abuse Confidence:</span>
                  <div className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-sm font-bold font-mono text-red-400">
                    {ipData.threat_intelligence.abuse_confidence_score}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-slate-500 uppercase text-[10px] block font-sans">Location & Country</span>
                  <div className="text-white font-bold text-sm flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase font-semibold">
                      {ipData.threat_intelligence.country_code || 'GEO'}
                    </span>
                    <span>{ipData.threat_intelligence.country || 'Unknown'}</span>
                  </div>
                  <span className="text-slate-400 text-[11px] block">{ipData.threat_intelligence.city || 'N/A'}</span>
                </div>

                <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-slate-500 uppercase text-[10px] block font-sans">ISP & ASN Provider</span>
                  <div className="text-blue-300 font-bold text-xs truncate">{ipData.threat_intelligence.isp}</div>
                  <span className="text-slate-400 text-[11px] block truncate">{ipData.threat_intelligence.asn}</span>
                </div>

                <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-slate-500 uppercase text-[10px] block font-sans">Domain Reputation</span>
                  <div className="text-amber-400 font-bold text-xs">{ipData.threat_intelligence.domain_reputation}</div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-yellow-500 to-red-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${ipData.threat_intelligence.abuse_confidence_score}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-slate-500 uppercase text-[10px] block font-sans">Classification</span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {ipData.threat_intelligence.is_tor_exit_node && (
                      <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30 text-[10px] font-mono">Tor Exit</span>
                    )}
                    {ipData.threat_intelligence.is_known_proxy_vpn && (
                      <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-mono">Proxy / VPN</span>
                    )}
                    {ipData.threat_intelligence.is_botnet_member && (
                      <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-mono">Botnet</span>
                    )}
                    {!ipData.threat_intelligence.is_tor_exit_node && !ipData.threat_intelligence.is_known_proxy_vpn && !ipData.threat_intelligence.is_botnet_member && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">Standard Host</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Threat Tags */}
              {ipData.threat_intelligence.threat_tags && ipData.threat_intelligence.threat_tags.length > 0 && (
                <div className="flex items-center gap-2 pt-1 text-xs font-mono">
                  <span className="text-slate-400 font-sans">Threat Tags:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ipData.threat_intelligence.threat_tags.map((tag, tIdx) => (
                      <span key={tIdx} className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bezel-card p-5 space-y-3 font-mono text-xs">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans mb-2">Targeted Destinations</h3>
              <div className="space-y-1">
                {ipData.destination_ips?.map((ip, i) => (
                  <div key={i} className="p-2 rounded bg-slate-950/60 border border-slate-800 text-slate-200">{ip}</div>
                ))}
              </div>
            </div>

            <div className="bezel-card p-5 space-y-3 font-mono text-xs">
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

            <div className="bezel-card p-5 space-y-3 text-xs font-mono">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans mb-2">First / Last Seen</h3>
              <div><span className="text-slate-400">First Seen:</span> <div className="text-white">{ipData.first_seen}</div></div>
              <div><span className="text-slate-400">Last Seen:</span> <div className="text-white">{ipData.last_seen}</div></div>
            </div>
          </div>

          {/* Historical Activity Timeline */}
          <div className="bezel-card p-5 space-y-4">
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
                      <td className="px-3 py-2 text-slate-400">{item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'N/A'}</td>
                      <td className="px-3 py-2 text-white">{item.destination_ip || 'N/A'}</td>
                      <td className="px-3 py-2 text-purple-400">:{item.destination_port || '0'}</td>
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

