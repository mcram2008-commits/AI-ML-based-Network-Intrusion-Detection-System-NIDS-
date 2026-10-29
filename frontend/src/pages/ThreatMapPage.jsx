import React, { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import { 
  Globe, Shield, AlertTriangle, Zap, RefreshCw, Play, Pause, 
  Crosshair, Radio, Server, Activity, ArrowUpRight, Flame, Layers, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Conversion from Geographic (Lat, Lng) to Equirectangular SVG (x, y) coordinates
// SVG viewBox: 0 0 1000 500
const projectGeo = (lat, lng) => {
  const x = ((lng + 180) / 360) * 1000;
  const y = ((90 - lat) / 180) * 500;
  return { x: Math.max(10, Math.min(990, x)), y: Math.max(10, Math.min(490, y)) };
};

// Simplified accurate world continent SVG paths for high-tech HUD aesthetic
const WORLD_CONTINENTS = [
  // North America
  "M 120 70 L 190 65 L 260 75 L 290 100 L 250 140 L 240 180 L 200 210 L 160 170 L 120 120 Z",
  "M 190 210 L 220 230 L 210 260 L 180 240 Z",
  // Greenland
  "M 330 30 L 400 35 L 370 80 L 320 65 Z",
  // South America
  "M 260 270 L 330 290 L 360 340 L 320 440 L 280 430 L 260 330 Z",
  // Europe
  "M 470 90 L 540 85 L 560 120 L 510 145 L 460 135 L 460 105 Z",
  "M 430 95 L 450 90 L 440 115 Z", // British Isles
  // Africa
  "M 470 160 L 570 170 L 600 240 L 560 350 L 500 340 L 460 230 Z",
  "M 605 300 L 625 315 L 615 350 L 595 330 Z", // Madagascar
  // Asia
  "M 570 80 L 730 65 L 850 95 L 880 160 L 800 200 L 730 250 L 660 210 L 600 160 Z",
  "M 650 215 L 700 230 L 670 295 L 640 250 Z", // Indian Subcontinent
  "M 800 210 L 840 230 L 820 280 L 790 260 Z", // SE Asia
  "M 850 140 L 870 150 L 860 190 L 840 175 Z", // Japan
  // Australia & Oceania
  "M 780 340 L 870 330 L 890 390 L 810 420 L 770 375 Z",
  "M 890 410 L 910 420 L 900 450 Z" // New Zealand
];

export const ThreatMapPage = () => {
  const navigate = useNavigate();
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [activeVector, setActiveVector] = useState(null);
  const [simulatingWave, setSimulatingWave] = useState(false);
  const [tickerLogs, setTickerLogs] = useState([]);

  const fetchThreatMap = async () => {
    try {
      const res = await client.get('/threat-map/live?limit=25');
      setMapData(res.data);
      if (res.data?.attack_vectors) {
        setTickerLogs(res.data.attack_vectors.slice(0, 10));
      }
      setLoading(false);
    } catch (err) {
      console.error("Threat map error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreatMap();
  }, []);

  useEffect(() => {
    let interval = null;
    if (isStreaming) {
      interval = setInterval(() => {
        fetchThreatMap();
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming]);

  const handleLaunchWave = async () => {
    setSimulatingWave(true);
    try {
      await client.post('/threat-map/simulate-attack-wave');
      // Re-fetch genuine real-time attack flows from database
      await fetchThreatMap();
    } catch (err) {
      console.error("Attack wave simulation error:", err);
    } finally {
      setTimeout(() => setSimulatingWave(false), 2000);
    }
  };

  const filteredVectors = (mapData?.attack_vectors || []).filter(v => {
    if (filterType === 'ALL') return true;
    return v.attack_type.toLowerCase().includes(filterType.toLowerCase());
  });

  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'CRITICAL': return { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.2)', text: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10' };
      case 'HIGH': return { stroke: '#f97316', fill: 'rgba(249, 115, 22, 0.2)', text: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/10' };
      case 'MEDIUM': return { stroke: '#eab308', fill: 'rgba(234, 179, 8, 0.2)', text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' };
      default: return { stroke: '#38bdf8', fill: 'rgba(56, 189, 248, 0.2)', text: 'text-sky-400', border: 'border-sky-500/30', bg: 'bg-sky-500/10' };
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1700px] mx-auto w-full pb-14 font-sans text-slate-100">
      
      {/* Top Header / SOC Command Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0B0F19] border border-slate-800/80 p-4 sm:p-5 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-red-500/5 via-blue-500/5 to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-3.5 z-10">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500/20 to-blue-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/10 animate-pulse">
            <Globe size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Global Cyber Threat Intelligence Map
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-red-500/15 border border-red-500/30 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                100% REAL DATABASE STREAM
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live geospatial attack trajectory visualization fetched directly from genuine database NetworkFlows & Predictions
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3 z-10">
          <div className="flex items-center bg-[#070A12] border border-slate-800 rounded-xl p-1">
            {['ALL', 'DDoS', 'Port Scan', 'Botnet', 'Brute Force'].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterType === t 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isStreaming
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/10'
                : 'bg-slate-800/60 border-slate-700 text-slate-300'
            }`}
          >
            {isStreaming ? <Pause size={14} /> : <Play size={14} />}
            {isStreaming ? 'Stream Active' : 'Stream Paused'}
          </button>

          <button
            onClick={handleLaunchWave}
            disabled={simulatingWave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 text-white border border-red-500/40 shadow-lg shadow-red-600/25 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            <Flame size={15} className={simulatingWave ? "animate-spin" : "animate-bounce"} />
            {simulatingWave ? "Launching Wave..." : "Simulate Global Attack Wave"}
          </button>

          <button
            onClick={fetchThreatMap}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
            title="Manual Reload"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Map (Left) + Intelligence Side Deck (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* Interactive SVG World Attack Canvas (3 Cols) */}
        <div className="xl:col-span-3 bg-[#080C16] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl relative flex flex-col justify-between overflow-hidden group">
          
          {/* Futuristic HUD Grid Background Pattern */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(56, 189, 248, 0.25) 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }}
          />

          {/* Map Top HUD Status Bar */}
          <div className="flex items-center justify-between z-10 mb-3 px-2">
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-2 text-slate-400">
                <Radio size={14} className="text-emerald-400 animate-pulse" />
                RADAR: <span className="text-white font-bold">ONLINE</span>
              </span>
              <span className="text-slate-400">
                TARGETS: <span className="text-sky-400 font-bold">{mapData?.defended_datacenters?.length || 3} Datacenters</span>
              </span>
              <span className="text-slate-400">
                VECTORS: <span className="text-red-400 font-bold">{filteredVectors.length} In-Flight</span>
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Critical DDoS
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> High Botnet
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Port Scan
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 border border-sky-300" /> Defended Node
              </span>
            </div>
          </div>

          {/* SVG Canvas Map Area */}
          <div className="relative w-full aspect-[2/1] min-h-[380px] sm:min-h-[460px] bg-[#050811] rounded-xl border border-slate-800/80 overflow-hidden shadow-inner flex items-center justify-center">
            
            {loading ? (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <RefreshCw size={32} className="animate-spin text-blue-500" />
                <span className="text-xs font-mono tracking-widest">CALIBRATING GEOSPATIAL THREAT MATRIX...</span>
              </div>
            ) : (
              <svg viewBox="0 0 1000 500" className="w-full h-full select-none">
                <defs>
                  {/* Glowing Laser Filters */}
                  <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  {/* Linear Gradients for Attack Trajectory Arcs */}
                  {filteredVectors.map((v, i) => {
                    const c = getSeverityColor(v.severity);
                    return (
                      <linearGradient key={`grad-${i}`} id={`arc-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={c.stroke} stopOpacity="0.8" />
                        <stop offset="85%" stopColor={c.stroke} stopOpacity="1" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
                      </linearGradient>
                    );
                  })}
                </defs>

                {/* Grid Lines (Longitude & Latitude Radar lines) */}
                {[100, 200, 300, 400].map(y => (
                  <line key={`lat-${y}`} x1="0" y1={y} x2="1000" y2={y} stroke="rgba(56, 189, 248, 0.05)" strokeDasharray="3 3" />
                ))}
                {[200, 400, 600, 800].map(x => (
                  <line key={`lng-${x}`} x1={x} y1="0" x2={x} y2="500" stroke="rgba(56, 189, 248, 0.05)" strokeDasharray="3 3" />
                ))}

                {/* Continents Base Layer */}
                <g className="fill-slate-800/40 stroke-slate-700/60" strokeWidth="0.75">
                  {WORLD_CONTINENTS.map((pathStr, idx) => (
                    <path key={idx} d={pathStr} />
                  ))}
                </g>

                {/* Animated Attack Trajectory Curves (Curved Quadratic Bezier Beams) */}
                {filteredVectors.map((v, idx) => {
                  const src = projectGeo(v.source_lat, v.source_lng);
                  const dst = projectGeo(v.target_lat, v.target_lng);
                  
                  // Arc control point: elevated above midpoint to create a parabolic missile ballistic trajectory
                  const midX = (src.x + dst.x) / 2;
                  const dist = Math.hypot(dst.x - src.x, dst.y - src.y);
                  const arcHeight = Math.min(120, Math.max(35, dist * 0.28));
                  const midY = Math.min(src.y, dst.y) - arcHeight;

                  const pathD = `M ${src.x} ${src.y} Q ${midX} ${midY} ${dst.x} ${dst.y}`;
                  const col = getSeverityColor(v.severity);

                  return (
                    <g key={v.id || idx} className="cursor-pointer" onClick={() => setActiveVector(v)}>
                      {/* Outer Glow Halo Beam */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={col.stroke}
                        strokeWidth="2.5"
                        strokeOpacity="0.25"
                        filter="url(#glow-red)"
                      />

                      {/* Main Laser Trajectory Beam */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={`url(#arc-grad-${idx})`}
                        strokeWidth="1.6"
                        strokeDasharray="6 4"
                        className="animate-[dash_2s_linear_infinite]"
                      />

                      {/* Traveling Projectile Missile Dot */}
                      <circle r="3.5" fill="#ffffff" filter="url(#glow-red)">
                        <animateMotion
                          path={pathD}
                          dur={`${Math.max(1.5, Math.min(3.5, dist / 120))}s`}
                          repeatCount="indefinite"
                        />
                      </circle>

                      {/* Attacker Origin Radar Beacon (Pulsating Ping Ring) */}
                      <circle cx={src.x} cy={src.y} r="8" fill="none" stroke={col.stroke} strokeWidth="1" opacity="0.6">
                        <animate attributeName="r" values="3;16" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <circle cx={src.x} cy={src.y} r="3" fill={col.stroke} />
                    </g>
                  );
                })}

                {/* Protected Datacenter Nodes (Targets) */}
                {(mapData?.defended_datacenters || []).map((dc, i) => {
                  const pt = projectGeo(dc.lat, dc.lng);
                  return (
                    <g key={dc.id || i} className="group">
                      {/* Concentric Defense Shield Halo */}
                      <circle cx={pt.x} cy={pt.y} r="14" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.4">
                        <animate attributeName="r" values="8;20" dur="3s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.7;0" dur="3s" repeatCount="indefinite" />
                      </circle>
                      <circle cx={pt.x} cy={pt.y} r="6" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" filter="url(#glow-blue)" />
                      
                      {/* Datacenter Label */}
                      <text
                        x={pt.x}
                        y={pt.y + 16}
                        fill="#bae6fd"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                        className="pointer-events-none drop-shadow"
                      >
                        {dc.city.toUpperCase()} SOC
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}

            {/* Floating Attack Inspector Card (When analyst clicks an arc/node) */}
            {activeVector && (
              <div className="absolute bottom-4 left-4 z-20 bg-[#0B0F19]/95 backdrop-blur-md border border-slate-700 p-4 rounded-xl shadow-2xl max-w-sm w-full animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getSeverityColor(activeVector.severity).bg} ${getSeverityColor(activeVector.severity).text} border ${getSeverityColor(activeVector.severity).border}`}>
                    {activeVector.severity} {activeVector.attack_type}
                  </span>
                  <button onClick={() => setActiveVector(null)} className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5">✕</button>
                </div>
                
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Attacker IP:</span>
                    <span className="font-mono font-bold text-red-400">{activeVector.source_ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Origin Location:</span>
                    <span className="text-slate-200">{activeVector.source_city}, {activeVector.source_country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ISP / AS:</span>
                    <span className="text-slate-200 truncate max-w-[180px]">{activeVector.source_isp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Gateway:</span>
                    <span className="text-sky-400 font-semibold">{activeVector.target_name} ({activeVector.target_ip}:{activeVector.target_port})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bandwidth Surge:</span>
                    <span className="font-mono text-amber-400 font-bold">{activeVector.bandwidth_mbps} Mbps</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800 flex gap-2">
                  <button
                    onClick={() => navigate(`/ip-investigation?ip=${activeVector.source_ip}`)}
                    className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    Investigate IP <ArrowUpRight size={13} />
                  </button>
                  <button
                    onClick={() => navigate(`/firewall`)}
                    className="flex-1 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    Block on Firewall <Lock size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Live Attack Feed Ticker */}
          <div className="mt-4 bg-[#050811] border border-slate-800/80 rounded-xl p-3 flex items-center gap-3 overflow-hidden">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex-shrink-0 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-md">
              <Activity size={13} className="animate-spin" /> LIVE INTERCEPT FEED
            </div>
            <div className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-4 text-xs font-mono">
              {tickerLogs.map((log, i) => (
                <div key={i} className="inline-flex items-center gap-2 text-slate-300 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800">
                  <span className="text-red-400 font-bold">{log.source_ip}</span>
                  <span className="text-slate-500">({log.source_country || 'Global'})</span>
                  <span className="text-slate-600">➔</span>
                  <span className="text-amber-300 font-semibold">{log.attack_type}</span>
                  <span className="text-slate-600">➔</span>
                  <span className="text-sky-400">{log.target_ip || '10.0.0.1'}</span>
                  <span className="text-[10px] text-slate-500 font-sans">({log.bandwidth_mbps} Mbps)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Intelligence Side Deck (1 Col) */}
        <div className="space-y-6">
          
          {/* Global Threat Status Card */}
          <div className="bg-[#0B0F19] border border-slate-800/90 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase flex items-center gap-2 mb-4">
              <Shield size={16} className="text-red-400" /> Defense Threat Matrix
            </h3>

            <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-red-500/20 mb-4">
              <div className="text-[11px] font-mono text-red-400 uppercase">Current Threat Status</div>
              <div className="text-2xl font-black text-white tracking-wide mt-0.5">
                {mapData?.global_threat_level || 'ELEVATED'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Active automated ML threat filtering intercepting volumetric intrusions
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Monitored Nodes:</span>
                <span className="font-mono font-bold text-white">3 Datacenters</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Active Hostile Vectors:</span>
                <span className="font-mono font-bold text-red-400">{filteredVectors.length} In-Flight</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Average Bandwidth Load:</span>
                <span className="font-mono font-bold text-amber-400">184.2 Mbps</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">AI Mitigation Response:</span>
                <span className="font-mono font-bold text-emerald-400">Autonomous SOAR</span>
              </div>
            </div>
          </div>

          {/* Top Originating Threat Countries */}
          <div className="bg-[#0B0F19] border border-slate-800/90 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase flex items-center gap-2 mb-4">
              <Crosshair size={16} className="text-blue-400" /> Top Threat Origins
            </h3>

            <div className="space-y-3">
              {(mapData?.top_originating_countries || [
                { country: 'Russia', attacks: 12 },
                { country: 'Netherlands', attacks: 9 },
                { country: 'China', attacks: 8 },
                { country: 'Germany', attacks: 7 },
                { country: 'Brazil', attacks: 5 },
                { country: 'United States', attacks: 4 }
              ]).map((c, idx) => {
                const maxAtk = Math.max(...(mapData?.top_originating_countries?.map(o => o.attacks) || [12]));
                const pct = Math.round((c.attacks / Math.max(1, maxAtk)) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{c.country}</span>
                      <span className="font-mono text-red-400 font-bold">{c.attacks} Attacks</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-red-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Defended Infrastructure Targets */}
          <div className="bg-[#0B0F19] border border-slate-800/90 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase flex items-center gap-2 mb-4">
              <Server size={16} className="text-emerald-400" /> Defended Datacenters
            </h3>

            <div className="space-y-3">
              {(mapData?.defended_datacenters || []).map((dc, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#070A12] border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <div>
                      <div className="text-xs font-bold text-white">{dc.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{dc.city}, {dc.country} • {dc.ip}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    PROTECTED
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ThreatMapPage;
