import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { 
  Radar, ShieldAlert, Cpu, Activity, RefreshCw, Sliders, CheckCircle2, 
  AlertTriangle, ArrowRight, Zap, Database, Lock, Info, BarChart2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AnomalyDetectionPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [contamination, setContamination] = useState(0.05);
  const [toastMessage, setToastMessage] = useState(null);

  // Live Scanned Flows
  const [scannedData, setScannedData] = useState(null);
  const [scanning, setScanning] = useState(false);

  // Interactive Anomaly Lab State
  const [labFlow, setLabFlow] = useState({
    flow_duration: 120000,
    source_port: 49152,
    destination_port: 443,
    protocol: 'TCP',
    total_fwd_packets: 10,
    total_bwd_packets: 14,
    total_length_of_fwd_packets: 1600,
    flow_bytes_per_sec: 42000,
    flow_packets_per_sec: 80,
    fwd_packet_length_mean: 140,
    bwd_packet_length_mean: 310,
    syn_flag_count: 1,
    ack_flag_count: 8
  });

  const [evaluationResult, setEvaluationResult] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  const fetchStatusAndScans = async () => {
    try {
      const [statusRes, scanRes] = await Promise.all([
        client.get('/anomaly/status'),
        client.get('/anomaly/live-scan?limit=25')
      ]);
      setStatus(statusRes.data);
      setScannedData(scanRes.data);
      setLoading(false);
    } catch (err) {
      console.error("Anomaly fetch error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndScans();
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      const res = await client.post('/anomaly/train', { contamination });
      setToastMessage({ type: 'success', text: res.data?.message || 'Isolation Forest Baseline retrained!' });
      await fetchStatusAndScans();
    } catch (err) {
      setToastMessage({ type: 'error', text: 'Retrain failed: ' + (err.response?.data?.detail || err.message) });
    } finally {
      setRetraining(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleEvaluateLab = async () => {
    setEvaluating(true);
    try {
      const res = await client.post('/anomaly/detect', labFlow);
      setEvaluationResult(res.data);
    } catch (err) {
      console.error("Evaluation error:", err);
    } finally {
      setEvaluating(false);
    }
  };

  const loadPreset = (presetName) => {
    if (presetName === 'BENIGN_HTTPS') {
      setLabFlow({
        flow_duration: 115000,
        source_port: 52140,
        destination_port: 443,
        protocol: 'TCP',
        total_fwd_packets: 8,
        total_bwd_packets: 12,
        total_length_of_fwd_packets: 1200,
        flow_bytes_per_sec: 38000,
        flow_packets_per_sec: 70,
        fwd_packet_length_mean: 135,
        bwd_packet_length_mean: 280,
        syn_flag_count: 1,
        ack_flag_count: 7
      });
    } else if (presetName === 'NOVEL_SYN_FLOOD') {
      setLabFlow({
        flow_duration: 15000,
        source_port: 41200,
        destination_port: 80,
        protocol: 'TCP',
        total_fwd_packets: 180,
        total_bwd_packets: 2,
        total_length_of_fwd_packets: 11000,
        flow_bytes_per_sec: 540000,
        flow_packets_per_sec: 1400,
        fwd_packet_length_mean: 64,
        bwd_packet_length_mean: 40,
        syn_flag_count: 180,
        ack_flag_count: 0
      });
    } else if (presetName === 'EXFILTRATION_TUNNEL') {
      setLabFlow({
        flow_duration: 850000,
        source_port: 33890,
        destination_port: 8080,
        protocol: 'TCP',
        total_fwd_packets: 450,
        total_bwd_packets: 40,
        total_length_of_fwd_packets: 680000,
        flow_bytes_per_sec: 1200000,
        flow_packets_per_sec: 550,
        fwd_packet_length_mean: 1460,
        bwd_packet_length_mean: 50,
        syn_flag_count: 1,
        ack_flag_count: 40
      });
    }
  };

  // Run initial lab evaluation when loaded
  useEffect(() => {
    handleEvaluateLab();
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1700px] mx-auto w-full pb-14 font-sans text-slate-100">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
          toastMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0B0F19] border border-slate-800/80 p-5 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-emerald-500/5 via-blue-500/5 to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-3.5 z-10">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Radar size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Zero-Day Anomaly Detection Engine
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                UNSUPERVISED ISOLATION FOREST
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Autonomous outlier analysis to capture unknown, novel cyber attacks without relying on prior signature datasets
            </p>
          </div>
        </div>

        {/* Retrain Trigger Deck */}
        <div className="flex items-center gap-3 z-10">
          <div className="flex items-center gap-2 bg-[#070A12] border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
            <span className="text-slate-400">Contamination:</span>
            <input
              type="range"
              min="0.01"
              max="0.15"
              step="0.01"
              value={contamination}
              onChange={(e) => setContamination(parseFloat(e.target.value))}
              className="w-20 accent-emerald-500 cursor-pointer"
            />
            <span className="text-emerald-400 font-bold">{Math.round(contamination * 100)}%</span>
          </div>

          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={retraining ? "animate-spin" : ""} />
            {retraining ? "Retraining..." : "Retrain Baseline"}
          </button>
        </div>
      </div>

      {/* Academic Architecture Concept Comparison: Supervised vs Unsupervised */}
      <div className="bg-[#070A14] border border-slate-800 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <div className="flex items-center gap-2 text-blue-400 font-bold font-mono uppercase mb-1">
            <Database size={15} /> Supervised Learning (Signature NIDS)
          </div>
          <p className="text-slate-300 leading-relaxed">
            Models like <strong>Random Forest & Decision Trees</strong> require labeled training data (e.g. CICIDS2017). They excel at classifying <em>known</em> attack types (DDoS, Port Scan, Brute Force), but cannot detect brand-new, zero-day techniques.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono uppercase mb-1">
            <Radar size={15} /> Unsupervised Learning (Zero-Day Anomaly Detection)
          </div>
          <p className="text-slate-300 leading-relaxed">
            Our <strong>Isolation Forest Model</strong> models normal enterprise traffic without requiring attack labels. By isolating data points that deviate drastically in high-dimensional feature space, it detects <em>unknown zero-day intrusions</em> instantly.
          </p>
        </div>
      </div>

      {/* Model Health Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0B0F19] border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="text-slate-400 text-xs font-mono uppercase">Model Architecture</div>
          <div className="text-lg font-bold text-white mt-1">Isolation Forest</div>
          <div className="text-[11px] text-emerald-400 mt-1">150 Isolation Decision Trees</div>
        </div>

        <div className="bg-[#0B0F19] border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="text-slate-400 text-xs font-mono uppercase">Baseline Samples</div>
          <div className="text-lg font-bold text-white mt-1">
            {status?.total_baseline_samples?.toLocaleString() || '3,000'} Flows
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Benign traffic baseline reference</div>
        </div>

        <div className="bg-[#0B0F19] border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="text-slate-400 text-xs font-mono uppercase">Contamination Outlier Factor</div>
          <div className="text-lg font-bold text-white mt-1">
            {Math.round((status?.contamination_factor || 0.05) * 100)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Expected novel outlier margin</div>
        </div>

        <div className="bg-[#0B0F19] border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="text-slate-400 text-xs font-mono uppercase">Real-Time Anomaly Rate</div>
          <div className="text-lg font-bold text-amber-400 mt-1">
            {scannedData?.anomaly_rate_pct || 12.0}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {scannedData?.anomalies_detected || 3} of {scannedData?.scanned_flows_count || 25} live flows flagged
          </div>
        </div>
      </div>

      {/* Interactive Zero-Day Anomaly Lab (Testing Simulator) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lab Parameter Controls (2 cols) */}
        <div className="lg:col-span-2 bg-[#0B0F19] border border-slate-800/90 rounded-2xl p-5 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold font-mono tracking-wider text-slate-200 uppercase flex items-center gap-2">
                <Sliders size={16} className="text-emerald-400" /> Interactive Zero-Day Flow Simulator
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate arbitrary network telemetry parameters and observe real-time Isolation Forest anomaly scoring
              </p>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-mono">Presets:</span>
              <button
                onClick={() => { loadPreset('BENIGN_HTTPS'); }}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/20 transition-all"
              >
                Benign HTTPS
              </button>
              <button
                onClick={() => { loadPreset('NOVEL_SYN_FLOOD'); }}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold hover:bg-amber-500/20 transition-all"
              >
                Zero-Day SYN Surge
              </button>
              <button
                onClick={() => { loadPreset('EXFILTRATION_TUNNEL'); }}
                className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold hover:bg-red-500/20 transition-all"
              >
                Exfiltration Tunnel
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">Flow Duration (μs)</label>
              <input
                type="number"
                value={labFlow.flow_duration}
                onChange={(e) => setLabFlow({ ...labFlow, flow_duration: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#070A12] border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Destination Port</label>
              <input
                type="number"
                value={labFlow.destination_port}
                onChange={(e) => setLabFlow({ ...labFlow, destination_port: parseInt(e.target.value) || 80 })}
                className="w-full bg-[#070A12] border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Protocol</label>
              <select
                value={labFlow.protocol}
                onChange={(e) => setLabFlow({ ...labFlow, protocol: e.target.value })}
                className="w-full bg-[#070A12] border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
              >
                <option value="TCP">TCP (6)</option>
                <option value="UDP">UDP (17)</option>
                <option value="ICMP">ICMP (1)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Total Forward Packets</label>
              <input
                type="number"
                value={labFlow.total_fwd_packets}
                onChange={(e) => setLabFlow({ ...labFlow, total_fwd_packets: parseInt(e.target.value) || 1 })}
                className="w-full bg-[#070A12] border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Flow Bytes / Sec</label>
              <input
                type="number"
                value={labFlow.flow_bytes_per_sec}
                onChange={(e) => setLabFlow({ ...labFlow, flow_bytes_per_sec: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#070A12] border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Flow Packets / Sec</label>
              <input
                type="number"
                value={labFlow.flow_packets_per_sec}
                onChange={(e) => setLabFlow({ ...labFlow, flow_packets_per_sec: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#070A12] border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">SYN Flag Count</label>
              <input
                type="number"
                value={labFlow.syn_flag_count}
                onChange={(e) => setLabFlow({ ...labFlow, syn_flag_count: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#070A12] border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">ACK Flag Count</label>
              <input
                type="number"
                value={labFlow.ack_flag_count}
                onChange={(e) => setLabFlow({ ...labFlow, ack_flag_count: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#070A12] border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Fwd Pkt Length Mean</label>
              <input
                type="number"
                value={labFlow.fwd_packet_length_mean}
                onChange={(e) => setLabFlow({ ...labFlow, fwd_packet_length_mean: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#070A12] border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleEvaluateLab}
              disabled={evaluating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 transition-all"
            >
              <Zap size={14} className={evaluating ? "animate-spin" : ""} />
              {evaluating ? "Evaluating Anomaly..." : "Run Isolation Forest Scoring"}
            </button>
          </div>
        </div>

        {/* Evaluation Output Gauge Card (1 col) */}
        <div className="bg-[#0B0F19] border border-slate-800/90 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase flex items-center gap-2 mb-4">
              <Activity size={16} className="text-emerald-400" /> Real-Time Zero-Day Score
            </h2>

            {evaluationResult ? (
              <div className="space-y-4">
                {/* Visual Gauge */}
                <div className={`p-4 rounded-xl border text-center transition-all ${
                  evaluationResult.is_anomaly
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-emerald-500/10 border-emerald-500/30'
                }`}>
                  <div className="text-xs font-mono text-slate-400 uppercase">Anomaly Score Index</div>
                  <div className={`text-4xl font-black mt-1 ${
                    evaluationResult.is_anomaly ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {evaluationResult.anomaly_score}%
                  </div>
                  <div className="text-xs font-bold text-white mt-1">
                    {evaluationResult.verdict}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-tight">
                    {evaluationResult.recommendation}
                  </p>
                </div>

                {/* Explainability Breakdown (XAI for Unsupervised) */}
                <div>
                  <div className="text-xs font-mono text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                    <Info size={13} className="text-blue-400" /> Explainable Feature Deviations:
                  </div>

                  {evaluationResult.top_deviating_features && evaluationResult.top_deviating_features.length > 0 ? (
                    <div className="space-y-2">
                      {evaluationResult.top_deviating_features.map((dev, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-[#070A12] border border-slate-800 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-white font-semibold">{dev.feature}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                              dev.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                            }`}>
                              {dev.deviation_pct}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Observed: {dev.observed_value} vs Baseline Mean: {dev.baseline_mean}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-400/80 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10 text-center font-mono">
                      ✓ All parameters closely follow normal baseline distribution
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs font-mono">
                Click "Run Isolation Forest Scoring" to evaluate flow
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Live Stream Anomaly Scan Table */}
      <div className="bg-[#0B0F19] border border-slate-800/90 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase flex items-center gap-2">
            <BarChart2 size={16} className="text-blue-400" /> Live Network Anomaly Audit Stream
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Scanned {scannedData?.scanned_flows_count || 0} Flows
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#070A12] text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Flow ID</th>
                <th className="py-2.5 px-3">Source IP</th>
                <th className="py-2.5 px-3">Destination IP</th>
                <th className="py-2.5 px-3">Protocol</th>
                <th className="py-2.5 px-3">Anomaly Score</th>
                <th className="py-2.5 px-3">Classification Verdict</th>
                <th className="py-2.5 px-3">Top Deviating Attribute</th>
                <th className="py-2.5 px-3 text-right">SOAR Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {(scannedData?.results || []).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-2.5 px-3 text-slate-400">#{row.flow_id}</td>
                  <td className="py-2.5 px-3 text-white font-bold">{row.source_ip}:{row.source_port}</td>
                  <td className="py-2.5 px-3 text-slate-300">{row.destination_ip}:{row.destination_port}</td>
                  <td className="py-2.5 px-3 text-slate-400">{row.protocol}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      row.anomaly_score > 60.0 ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
                    }`}>
                      {row.anomaly_score}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      row.is_anomaly ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {row.verdict}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                    {row.top_deviating_features && row.top_deviating_features.length > 0 
                      ? `${row.top_deviating_features[0].feature} (${row.top_deviating_features[0].deviation_pct})`
                      : 'None (Baseline Normal)'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-sans">
                    {row.is_anomaly ? (
                      <button
                        onClick={() => navigate('/firewall')}
                        className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-md text-[10px] font-bold inline-flex items-center gap-1 transition-colors"
                      >
                        <Lock size={11} /> Block Host
                      </button>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Authorized</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AnomalyDetectionPage;
