import React, { useState, useEffect } from 'react';
import client from '../api/client';
import {
  Globe, Network, Shield, Server, Database, Cpu, Activity,
  Radio, ArrowRight, RefreshCw, AlertTriangle, CheckCircle, ExternalLink, MapPin
} from 'lucide-react';

export const NetworkTopologyPage = () => {
  const [viewMode, setViewMode] = useState('topology'); // 'topology' | 'geoip'
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);

  // GeoIP Lookup state
  const [lookupIp, setLookupIp] = useState('185.220.101.5');
  const [geoResult, setGeoResult] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const fetchTopologyData = async () => {
    try {
      setLoading(true);
      const res = await client.get('/topology/graph');
      setGraphData(res.data);
      if (res.data.nodes.length > 0 && !selectedNode) {
        setSelectedNode(res.data.nodes[0]);
      }
    } catch (err) {
      console.error('Failed to fetch network topology:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLookupGeoIp = async (ipToSearch) => {
    const targetIp = (typeof ipToSearch === 'string' && ipToSearch.trim()) ? ipToSearch.trim() : lookupIp.trim();
    if (!targetIp) return;
    setLookupIp(targetIp);
    try {
      setGeoLoading(true);
      const res = await client.get(`/topology/geoip/${targetIp}`);
      setGeoResult(res.data);
    } catch (err) {
      console.error('GeoIP lookup failed:', err);
    } finally {
      setGeoLoading(false);
    }
  };

  useEffect(() => {
    fetchTopologyData();
    handleLookupGeoIp('185.220.101.5');
  }, []);


  const getNodeIcon = (type) => {
    switch (type) {
      case 'gateway': return Server;
      case 'firewall': return Shield;
      case 'server': return Server;
      case 'database': return Database;
      case 'sensor': return Cpu;
      case 'attacker': return Radio;
      default: return Network;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Network size={22} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Network Topology & GeoIP Attack Map</h1>
            <p className="text-xs text-slate-400">Real-time Infrastructure Graph & Global Cyber Threat Coordinates</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewMode('topology')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'topology'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Network size={14} />
              🕸️ Topology Graph
            </button>
            <button
              onClick={() => setViewMode('geoip')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'geoip'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe size={14} />
              🌍 GeoIP Attack Map
            </button>
          </div>

          <button
            onClick={fetchTopologyData}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: NETWORK TOPOLOGY GRAPH */}
      {viewMode === 'topology' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Visualizer Canvas Panel */}
          <div className="lg:col-span-3 bg-[#0D121F] border border-slate-800/90 rounded-xl p-6 relative min-h-[500px] flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 z-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <h3 className="text-sm font-semibold text-white">Live Node Connection Topology</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Click any node to inspect details</span>
            </div>

            {/* Topology Diagram Container */}
            <div className="relative w-full h-[380px] bg-slate-950/60 rounded-xl border border-slate-800/80 my-4 p-4 overflow-auto flex items-center justify-center">
              {/* Render Nodes in a responsive layout grid */}
              <div className="grid grid-cols-3 gap-12 items-center justify-center w-full max-w-2xl text-center">
                {graphData.nodes.map((node) => {
                  const Icon = getNodeIcon(node.type);
                  const isSelected = selectedNode?.id === node.id;
                  const isAttacker = node.type === 'attacker';

                  return (
                    <button
                      key={node.id}
                      onClick={() => {
                        setSelectedNode(node);
                        if (isAttacker) handleLookupGeoIp(node.ip);
                      }}
                      className={`group relative p-4 rounded-2xl border transition-all flex flex-col items-center gap-2.5 ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-400 shadow-xl shadow-blue-500/20 scale-105'
                          : isAttacker
                          ? 'bg-red-950/30 border-red-500/40 hover:border-red-400'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {/* Pulse Indicator */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition ${
                        isAttacker
                          ? 'bg-red-500/20 border-red-500/40 text-red-400'
                          : 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                      }`}>
                        <Icon size={20} className={isAttacker ? 'animate-pulse' : ''} />
                      </div>

                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-blue-300 transition truncate max-w-[120px]">
                          {node.label}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{node.ip}</p>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold ${
                        node.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        node.status === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {node.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Status Ticker */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Healthy Node</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400"></span> High Load</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Attacker Threat</span>
              </div>
              <span className="font-mono text-[11px]">SOC Core Datacenter: 10.0.0.1</span>
            </div>
          </div>

          {/* Node Inspector Drawer */}
          <div className="bg-[#0D121F] border border-slate-800/90 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Activity size={16} className="text-blue-400" />
              Node Inspector
            </h3>

            {selectedNode ? (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Node Name</span>
                  <h4 className="text-sm font-bold text-white">{selectedNode.label}</h4>
                  <p className="text-blue-400 font-mono text-xs">{selectedNode.ip}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-400">
                    <span>Node Type</span>
                    <span className="font-semibold text-white capitalize">{selectedNode.type}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-400">
                    <span>Health Status</span>
                    <span className="font-semibold text-emerald-400">{selectedNode.status}</span>
                  </div>
                  {selectedNode.attack_category && (
                    <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-400">
                      <span>Detected Attack</span>
                      <span className="font-semibold text-red-400">{selectedNode.attack_category}</span>
                    </div>
                  )}
                </div>

                {selectedNode.type === 'attacker' && (
                  <button
                    onClick={() => {
                      handleLookupGeoIp(selectedNode.ip);
                      setViewMode('geoip');
                    }}
                    className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <Globe size={14} />
                    View GeoIP Location
                  </button>
                )}

              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">Select a node from the topology diagram to inspect real-time metrics.</p>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: GEOIP ATTACK MAP */}
      {viewMode === 'geoip' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* GeoIP Map Console */}
          <div className="lg:col-span-2 bg-[#0D121F] border border-slate-800/90 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe size={18} className="text-blue-400" />
                Global Cyber Threat Geo-Coordinates
              </h3>
              <span className="text-xs text-emerald-400 font-mono">SOC Target: Chennai (13.0827° N, 80.2707° E)</span>
            </div>

            {/* Simulated World Attack Canvas */}
            <div className="relative w-full h-80 bg-slate-950 rounded-xl border border-slate-800/80 p-4 flex flex-col justify-between overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>

              {/* Geo Attack Pin Highlights */}
              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { country: 'Russia (Moscow)', ip: '185.220.101.5', threat: 'CRITICAL', coords: '55.7558° N, 37.6173° E' },
                  { country: 'China (Beijing)', ip: '45.142.120.12', threat: 'HIGH', coords: '39.9042° N, 116.4074° E' },
                  { country: 'Netherlands (Amsterdam)', ip: '193.142.146.210', threat: 'HIGH', coords: '52.3676° N, 4.9041° E' },
                  { country: 'North Korea (Pyongyang)', ip: '103.251.140.88', threat: 'CRITICAL', coords: '39.0392° N, 125.7625° E' },
                  { country: 'USA (Dallas)', ip: '198.51.100.42', threat: 'MEDIUM', coords: '32.7767° N, -96.7970° W' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleLookupGeoIp(item.ip)}
                    className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/80 hover:border-blue-500 text-left transition space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">{item.country}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                        item.threat === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                      }`}>{item.threat}</span>
                    </div>
                    <p className="text-[10px] text-blue-400 font-mono">{item.ip}</p>
                    <p className="text-[9px] text-slate-500 font-mono">{item.coords}</p>
                  </button>
                ))}
              </div>

              {/* Target Datacenter Vector Banner */}
              <div className="relative z-10 bg-slate-900/90 border border-blue-500/30 p-3 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin size={16} className="text-blue-400" />
                  <span>Target SOC Headquarters Datacenter: <b>AEGIS India HQ</b></span>
                </div>
                <span className="text-emerald-400 font-mono font-semibold">Active Firewall Defense</span>
              </div>
            </div>

            {/* Quick GeoIP Search Bar */}
            <div className="flex items-center gap-3 pt-2">
              <input
                type="text"
                value={lookupIp}
                onChange={(e) => setLookupIp(e.target.value)}
                placeholder="Enter IP Address for GeoIP forensic analysis..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => handleLookupGeoIp()}
                disabled={geoLoading}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
              >
                Lookup GeoIP
              </button>
            </div>
          </div>

          {/* GeoIP Location Result Details Card */}
          <div className="bg-[#0D121F] border border-slate-800/90 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <MapPin size={16} className="text-amber-400" />
              GeoIP Forensic Card
            </h3>

            {geoResult ? (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Queried IP Address</span>
                  <h4 className="text-lg font-extrabold text-blue-400 font-mono">{geoResult.ip}</h4>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 font-mono font-semibold">
                    Threat: {geoResult.threat_level}
                  </span>
                </div>

                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Country</span>
                    <span className="font-semibold text-white">{geoResult.country} ({geoResult.country_code})</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">City Region</span>
                    <span className="font-semibold text-white">{geoResult.city}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Coordinates</span>
                    <span className="font-mono text-emerald-400">{geoResult.latitude}°, {geoResult.longitude}°</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">ISP Provider</span>
                    <span className="font-semibold text-slate-200">{geoResult.isp}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">Perform a GeoIP lookup to view origin coordinates.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkTopologyPage;
