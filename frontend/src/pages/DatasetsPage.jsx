import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { 
  Database, Upload, CheckCircle2, AlertTriangle, Layers, Cpu, 
  FileText, ArrowRight, Zap, RefreshCw, ShieldAlert, Brain, 
  Activity, Play, Search, Eye, Filter 
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import ToastNotification from '../components/ToastNotification';
import XaiExplanationModal from '../components/XaiExplanationModal';

export const DatasetsPage = () => {
  const [activeTab, setActiveTab] = useState('pcap'); // default to 'pcap' to showcase feature!
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [toast, setToast] = useState(null);

  // PCAP DPI State
  const [pcapFile, setPcapFile] = useState(null);
  const [pcapLoading, setPcapLoading] = useState(false);
  const [pcapReport, setPcapReport] = useState(null);
  const [pcapMaxPackets, setPcapMaxPackets] = useState(3000);
  const [selectedFlowForXai, setSelectedFlowForXai] = useState(null);
  const [flowSearch, setFlowSearch] = useState('');

  const fetchDatasets = async () => {
    try {
      const res = await client.get('/datasets');
      setDatasets(res.data);
    } catch (err) {
      console.error("Fetch datasets error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await client.post('/datasets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setToast({ type: 'success', message: `Dataset '${res.data.original_filename}' uploaded successfully!` });
      setFile(null);
      fetchDatasets();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Dataset upload failed';
      setToast({ type: 'error', message: msg });
    } finally {
      setUploading(false);
    }
  };

  const handlePreprocess = async (datasetId) => {
    try {
      const res = await client.post(`/datasets/${datasetId}/preprocess`);
      setToast({ type: 'success', message: res.data.message });
      fetchDatasets();
    } catch (err) {
      setToast({ type: 'error', message: 'Preprocessing failed' });
    }
  };

  const handleUploadPcap = async (e) => {
    e.preventDefault();
    if (!pcapFile) return;

    const formData = new FormData();
    formData.append('file', pcapFile);

    setPcapLoading(true);
    try {
      const res = await client.post(`/datasets/upload-pcap?max_packets=${pcapMaxPackets}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPcapReport(res.data);
      setToast({ type: 'success', message: `PCAP parsed & classified: ${res.data.pcap_metadata.total_packets} packets processed` });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to analyze PCAP file';
      setToast({ type: 'error', message: msg });
    } finally {
      setPcapLoading(false);
    }
  };

  const handleLoadSamplePcap = async () => {
    setPcapLoading(true);
    try {
      const res = await client.get('/datasets/sample-pcap-demo');
      setPcapReport(res.data);
      setToast({ type: 'success', message: 'Demo attack PCAP capture loaded & inspected successfully!' });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load demo PCAP' });
    } finally {
      setPcapLoading(false);
    }
  };

  const filteredPcapFlows = (pcapReport?.flows || []).filter(f => {
    if (!flowSearch) return true;
    const q = flowSearch.toLowerCase();
    return f.source_ip?.toLowerCase().includes(q) || 
           f.destination_ip?.toLowerCase().includes(q) || 
           f.attack_category?.toLowerCase().includes(q) ||
           String(f.destination_port).includes(q);
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto w-full pb-10">
      <ToastNotification type={toast?.type} message={toast?.message} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
              <Database size={19} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Datasets & Wireshark PCAP Deep Packet Inspection
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Ingest CSV flow benchmarks or upload raw PCAP/PCAPNG network packet captures for automated AI threat extraction
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('pcap')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'pcap'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity size={14} />
            <span>Wireshark PCAP (DPI)</span>
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'csv'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span>CSV Benchmark Datasets</span>
          </button>
        </div>
      </div>

      {/* TAB 1: WIRESHARK PCAP DEEP PACKET INSPECTION */}
      {activeTab === 'pcap' && (
        <div className="space-y-6">
          
          {/* PCAP Upload Card */}
          <div className="bezel-card p-6 space-y-5 border-l-4 border-l-cyan-500">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Activity size={16} className="text-cyan-400" />
                  Wireshark Packet Capture Ingestion (.pcap / .pcapng)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Upload raw captures exported from Wireshark, tcpdump, or Zeek. Scapy reconstructs bi-directional 5-tuple flows for instant ML inference.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLoadSamplePcap}
                disabled={pcapLoading}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 active:translate-y-px"
              >
                <Zap size={14} />
                <span>⚡ Load Demo Attack PCAP (SYN Flood + Port Scan)</span>
              </button>
            </div>

            <form onSubmit={handleUploadPcap} className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-800/80">
              <input
                type="file"
                accept=".pcap,.pcapng,.cap"
                onChange={(e) => setPcapFile(e.target.files[0])}
                className="text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
              />

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Max Packets:</span>
                <select
                  value={pcapMaxPackets}
                  onChange={(e) => setPcapMaxPackets(Number(e.target.value))}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                >
                  <option value={1000}>1,000 Packets (Fast)</option>
                  <option value={3000}>3,000 Packets</option>
                  <option value={5000}>5,000 Packets (Deep)</option>
                  <option value={10000}>10,000 Packets (Max)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!pcapFile || pcapLoading}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all border border-blue-400/30 disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {pcapLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Analyzing PCAP Streams...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>Analyze PCAP with Deep Packet Inspection</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* PCAP Results Dashboard */}
          {pcapReport && (
            <div className="space-y-6 animate-in fade-in zoom-in-95">
              
              {/* Meta & Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bezel-card p-4 space-y-1 border-l-4 border-l-blue-500">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Packets Inspected</span>
                  <div className="text-2xl font-bold text-white font-mono">
                    {pcapReport.pcap_metadata?.total_packets?.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Duration: {pcapReport.pcap_metadata?.capture_duration_sec}s ({pcapReport.pcap_metadata?.file_size_mb} MB)
                  </span>
                </div>

                <div className="bezel-card p-4 space-y-1 border-l-4 border-l-purple-500">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Reconstructed Flows</span>
                  <div className="text-2xl font-bold text-purple-300 font-mono">
                    {pcapReport.threat_summary?.total_flows?.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    5-Tuple Conversations
                  </span>
                </div>

                <div className="bezel-card p-4 space-y-1 border-l-4 border-l-red-500">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Malicious Flows</span>
                  <div className="text-2xl font-bold text-red-400 font-mono">
                    {pcapReport.threat_summary?.malicious_count?.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-red-400/80 font-mono">
                    {pcapReport.threat_summary?.threat_ratio_pct}% Threat Density
                  </span>
                </div>

                <div className="bezel-card p-4 space-y-1 border-l-4 border-l-emerald-500">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Normal Traffic</span>
                  <div className="text-2xl font-bold text-emerald-400 font-mono">
                    {pcapReport.threat_summary?.normal_count?.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-emerald-400/80 font-mono">
                    Benign Network Activity
                  </span>
                </div>
              </div>

              {/* Protocol Breakdown & Attack Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bezel-card p-5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">
                    Protocol Distribution in Capture
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(pcapReport.pcap_metadata?.protocols || {}).map(([proto, count]) => (
                      <span key={proto} className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 flex items-center gap-2">
                        <span className="font-bold text-blue-400">{proto}</span>
                        <span className="text-slate-500">|</span>
                        <span>{count} packets</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bezel-card p-5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">
                    AI Classified Attack Categories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(pcapReport.threat_summary?.attack_breakdown || {}).map(([cat, count]) => (
                      <span key={cat} className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 ${
                        cat === 'Normal' || cat === 'BENIGN'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}>
                        <span>{cat}</span>
                        <span className="text-slate-500">|</span>
                        <span>{count} flows</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reconstructed Flows Table */}
              <div className="bezel-card overflow-hidden shadow-2xl space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      Reconstructed Network Flows & Verdicts
                    </h3>
                    <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                      Showing {filteredPcapFlows.length} flows
                    </span>
                  </div>

                  <div className="relative w-64">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Filter IP, port, attack..."
                      value={flowSearch}
                      onChange={(e) => setFlowSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300 font-mono">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="px-3 py-2.5">Flow #</th>
                        <th className="px-3 py-2.5">Source IP</th>
                        <th className="px-3 py-2.5">Destination IP</th>
                        <th className="px-3 py-2.5">Port / Proto</th>
                        <th className="px-3 py-2.5">Packets / Bytes</th>
                        <th className="px-3 py-2.5">Rate (B/s)</th>
                        <th className="px-3 py-2.5">Verdict</th>
                        <th className="px-3 py-2.5">Confidence</th>
                        <th className="px-3 py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredPcapFlows.map((f) => {
                        const isMalicious = f.prediction === 'Malicious';
                        return (
                          <tr key={f.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-3 py-2 text-slate-500">#{f.id}</td>
                            <td className="px-3 py-2 text-cyan-300">{f.source_ip}:{f.source_port}</td>
                            <td className="px-3 py-2 text-slate-200">{f.destination_ip}:{f.destination_port}</td>
                            <td className="px-3 py-2">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {f.protocol} / {f.destination_port}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-400">
                              {f.packet_count} pkts ({f.byte_count} B)
                            </td>
                            <td className="px-3 py-2 text-slate-400">
                              {Number(f.rate).toLocaleString()}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                isMalicious
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              }`}>
                                {f.attack_category}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-purple-300">
                              {f.confidence}%
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                onClick={() => setSelectedFlowForXai(f)}
                                className="px-2 py-1 rounded bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-[10px] font-semibold flex items-center gap-1 transition-all ml-auto"
                              >
                                <Brain size={11} />
                                <span>Explain XAI</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* TAB 2: CSV BENCHMARK DATASETS */}
      {activeTab === 'csv' && (
        <div className="space-y-6">
          {/* Upload Box */}
          <div className="bezel-card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Upload size={15} className="text-blue-400" />
              Upload Network Traffic Flow Dataset (CSV)
            </h2>

            <form onSubmit={handleUpload} className="flex flex-wrap items-center gap-4">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={(e) => setFile(e.target.files[0])}
                className="text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
              />
              <button
                type="submit"
                disabled={!file || uploading}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors border border-blue-400/30 disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {uploading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  'Upload & Parse Dataset'
                )}
              </button>
            </form>
          </div>

          {/* Uploaded Datasets Cards */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white tracking-tight">Registered Datasets ({datasets.length})</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {datasets.map((ds) => {
                const pieData = [
                  { name: 'Normal Traffic', value: ds.normal_count, color: '#10B981' },
                  { name: 'Attack Traffic', value: ds.attack_count, color: '#EF4444' }
                ];

                return (
                  <div key={ds.id} className="bezel-card p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-bold text-white">{ds.original_filename}</h3>
                        <span className="text-[11px] text-slate-400 font-mono">Uploaded: {new Date(ds.uploaded_at).toLocaleString()}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded text-xs font-mono font-medium ${ds.is_preprocessed ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>
                        {ds.is_preprocessed ? 'PREPROCESSED' : 'RAW UNCLEANED'}
                      </span>
                    </div>

                    {/* Stats Table */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#06090F] p-3 rounded-lg border border-slate-800 text-xs font-mono">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Records</span>
                        <span className="text-white font-bold tabular-nums">{(ds.num_records ?? 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Features</span>
                        <span className="text-purple-400 font-bold tabular-nums">{ds.num_features}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Missing Values</span>
                        <span className={ds.missing_values > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{ds.missing_values}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Attack Ratio</span>
                        <span className="text-red-400 font-bold tabular-nums">{ds.attack_percentage}%</span>
                      </div>
                    </div>

                    {/* Pie Chart Distribution */}
                    <div className="h-44 flex items-center justify-between">
                      <div className="w-1/2 h-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4}>
                              {pieData.map((e, idx) => (
                                <Cell key={idx} fill={e.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1E293B', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-1/2 text-xs font-mono space-y-2">
                        <div>
                          <span className="text-emerald-400 font-semibold block text-[11px]">Normal Traffic:</span>
                          <span className="text-slate-300 tabular-nums">{(ds.normal_count ?? 0).toLocaleString()} ({ds.normal_percentage}%)</span>
                        </div>
                        <div>
                          <span className="text-red-400 font-semibold block text-[11px]">Attack Traffic:</span>
                          <span className="text-slate-300 tabular-nums">{(ds.attack_count ?? 0).toLocaleString()} ({ds.attack_percentage}%)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handlePreprocess(ds.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#06090F] hover:bg-slate-800 text-blue-300 hover:text-white text-xs font-medium border border-slate-700/80 transition-colors flex items-center gap-1.5"
                      >
                        <Cpu size={13} />
                        <span>Run Data Preprocessing</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* XAI Modal for PCAP Flows */}
      <XaiExplanationModal
        isOpen={!!selectedFlowForXai}
        flowData={selectedFlowForXai}
        onClose={() => setSelectedFlowForXai(null)}
      />
    </div>
  );
};

export default DatasetsPage;
