import React, { useState, useEffect } from 'react';
import client from '../api/client';
import {
  Navigation, Search, ShieldCheck, ShieldAlert, Cpu, ArrowRight,
  Globe, Radio, Server, Mail, Download, CheckCircle2, AlertTriangle, XCircle, Zap,
  Send, Eye, FileText, ExternalLink, MessageSquare, Phone
} from 'lucide-react';
import ToastNotification from '../components/ToastNotification';

export const RouteOptimizationPage = () => {
  const [senderContact, setSenderContact] = useState('+91-9876543210');
  const [senderLocation, setSenderLocation] = useState('Chennai, India');
  const [receiverContact, setReceiverContact] = useState('+1-555-0199');
  const [receiverLocation, setReceiverLocation] = useState('New York, USA');

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [toast, setToast] = useState(null);

  // Email & SMS Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [reportNotes, setReportNotes] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'preview'

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!senderContact || !senderLocation || !receiverContact || !receiverLocation) {
      setToast({ type: 'error', message: 'Please fill in all Sender and Receiver details.' });
      return;
    }

    setLoading(true);
    try {
      const res = await client.post('/routes/analyze', {
        sender_contact: senderContact,
        sender_location: senderLocation,
        receiver_contact: receiverContact,
        receiver_location: receiverLocation
      });
      setAnalysis(res.data);
      if (res.data?.best_route) {
        setSelectedRouteId(res.data.best_route.route_id);
      }
      setToast({ type: 'success', message: 'Smart Route Optimization completed successfully!' });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to analyze network routes.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDetectSender = async () => {
    if (!senderContact.trim()) {
      setToast({ type: 'error', message: 'Please enter a Sender contact number first.' });
      return;
    }
    try {
      const res = await client.get(`/routes/lookup-phone?phone=${encodeURIComponent(senderContact.trim())}`);
      if (res.data?.detected_location) {
        setSenderLocation(res.data.detected_location);
        setToast({ type: 'success', message: `Sender location auto-detected as ${res.data.detected_location}` });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to auto-detect location from phone number.' });
    }
  };

  const handleAutoDetectReceiver = async () => {
    if (!receiverContact.trim()) {
      setToast({ type: 'error', message: 'Please enter a Receiver contact number first.' });
      return;
    }
    try {
      const res = await client.get(`/routes/lookup-phone?phone=${encodeURIComponent(receiverContact.trim())}`);
      if (res.data?.detected_location) {
        setReceiverLocation(res.data.detected_location);
        setToast({ type: 'success', message: `Receiver location auto-detected as ${res.data.detected_location}` });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to auto-detect location from phone number.' });
    }
  };

  useEffect(() => {
    handleAnalyze();
  }, []);

  const handleSendReport = async (e) => {
    e.preventDefault();
    if (!recipientEmail) {
      setToast({ type: 'error', message: 'Please enter a valid recipient email.' });
      return;
    }
    setSendingEmail(true);
    setDispatchResult(null);
    try {
      const res = await client.post('/routes/send-report', {
        analysis_id: analysis.analysis_id,
        recipient_email: recipientEmail,
        recipient_phone: recipientPhone || null,
        notes: reportNotes || null
      });
      setDispatchResult(res.data);
      setToast({
        type: 'success',
        message: res.data?.sms_dispatch
          ? `Route Report dispatched via Email to ${recipientEmail} and SMS to ${recipientPhone}!`
          : `Route Report successfully dispatched via Email to ${recipientEmail}!`
      });
      setActiveTab('preview');
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to dispatch route report.' });
    } finally {
      setSendingEmail(false);
    }
  };

  const activeRoute = analysis?.routes?.find(r => r.route_id === selectedRouteId) || analysis?.best_route;

  const getThreatBadge = (level) => {
    switch (level) {
      case 'LOW':
        return <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5"><ShieldCheck size={14} /> LOW RISK</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-1 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5"><AlertTriangle size={14} /> MEDIUM THREAT</span>;
      case 'HIGH':
      case 'CRITICAL':
        return <span className="px-2.5 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1.5"><ShieldAlert size={14} /> HIGH THREAT</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-100">
      <ToastNotification type={toast?.type} message={toast?.message} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Navigation className="text-blue-400" size={26} />
            Smart Route Finder & NIDS Threat Optimizer
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            4-Step Intelligence Pipeline: <strong>1. IP Find</strong> &rarr; <strong>2. Route Find</strong> &rarr; <strong>3. Threat Find</strong> &rarr; <strong>4. Best Route Suggestion</strong>
          </p>
        </div>

        {analysis && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 text-xs font-medium transition-all flex items-center gap-2"
            >
              <Mail size={16} /> Send Report
            </button>
          </div>
        )}
      </div>

      {/* Inputs Form */}
      <div className="bg-[#0D1322] border border-slate-800/80 rounded-xl p-5 shadow-lg">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sender Column */}
            <div className="space-y-3 bg-slate-900/40 p-4 rounded-lg border border-slate-800/60">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                <Radio size={18} className="animate-pulse" /> SENDER ENDPOINT DETAILS
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Sender Contact Number</label>
                  <input
                    type="text"
                    value={senderContact}
                    onChange={(e) => setSenderContact(e.target.value)}
                    placeholder="+91-9876543210"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-slate-400">Sender Location / City</label>
                    <button
                      type="button"
                      onClick={handleAutoDetectSender}
                      className="text-[10px] text-blue-400 hover:underline font-mono"
                    >
                      ⚡ Auto-Detect
                    </button>
                  </div>
                  <input
                    type="text"
                    value={senderLocation}
                    onChange={(e) => setSenderLocation(e.target.value)}
                    placeholder="Auto-detected or enter location..."
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Receiver Column */}
            <div className="space-y-3 bg-slate-900/40 p-4 rounded-lg border border-slate-800/60">
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                <Server size={18} /> RECEIVER ENDPOINT DETAILS
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Receiver Contact Number</label>
                  <input
                    type="text"
                    value={receiverContact}
                    onChange={(e) => setReceiverContact(e.target.value)}
                    placeholder="+1-555-0199"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-slate-400">Receiver Location / City</label>
                    <button
                      type="button"
                      onClick={handleAutoDetectReceiver}
                      className="text-[10px] text-purple-400 hover:underline font-mono"
                    >
                      ⚡ Auto-Detect
                    </button>
                  </div>
                  <input
                    type="text"
                    value={receiverLocation}
                    onChange={(e) => setReceiverLocation(e.target.value)}
                    placeholder="Auto-detected or enter location..."
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shadow-md shadow-blue-600/20"
            >
              {loading ? <Cpu className="animate-spin" size={18} /> : <Zap size={18} />}
              {loading ? 'Analyzing Routes & NIDS Threat Scoring...' : 'Analyze & Optimize Routes'}
            </button>
          </div>
        </form>
      </div>

      {/* Analysis Results Display */}
      {analysis && (
        <div className="space-y-6">

          {/* STEP 1: IP FIND CARD */}
          <div className="bg-[#0D1322] border border-slate-800/80 rounded-xl p-5">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider mb-4">
              <Globe size={16} /> STEP 1: IP RESOLUTION & TELEMETRY DISCOVERY
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sender Resolved IP */}
              <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800 flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                  <Globe size={24} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400">Sender Resolved IP</span>
                  <div className="text-xl font-bold font-mono text-white">{analysis.sender_info.resolved_ip}</div>
                  <div className="text-xs text-slate-300 font-medium">{analysis.sender_info.location} ({analysis.sender_info.contact_number})</div>
                  <div className="text-[11px] text-slate-400">{analysis.sender_info.carrier} | {analysis.sender_info.asn}</div>
                </div>
              </div>

              {/* Receiver Resolved IP */}
              <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800 flex items-start gap-4">
                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
                  <Server size={24} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400">Receiver Resolved IP</span>
                  <div className="text-xl font-bold font-mono text-white">{analysis.receiver_info.resolved_ip}</div>
                  <div className="text-xs text-slate-300 font-medium">{analysis.receiver_info.location} ({analysis.receiver_info.contact_number})</div>
                  <div className="text-[11px] text-slate-400">{analysis.receiver_info.carrier} | {analysis.receiver_info.asn}</div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 4: BEST ROUTE RECOMMENDATION BANNER */}
          <div className="bg-gradient-to-r from-blue-950/60 via-slate-900/80 to-slate-950 border border-blue-500/40 rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 px-4 py-1 bg-emerald-500/20 text-emerald-300 border-b border-l border-emerald-500/40 font-mono text-[11px] font-bold tracking-wider rounded-bl-lg">
              OPTIMAL ROUTE SELECTED
            </div>

            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
              <CheckCircle2 size={16} /> STEP 4: SUGGESTED BEST ROUTE RECOMMENDATION
            </div>

            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-extrabold text-white">{analysis.best_route.route_name}</h3>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {analysis.best_route.route_id}
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                {analysis.best_route.recommendation_reason}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-mono">THREAT SCORE</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">{analysis.best_route.threat_score} / 100</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-mono">AVG LATENCY</span>
                  <span className="text-lg font-bold text-white font-mono">{analysis.best_route.avg_latency_ms} ms</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-mono">PACKET LOSS</span>
                  <span className="text-lg font-bold text-white font-mono">{analysis.best_route.packet_loss_pct}%</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-mono">BANDWIDTH</span>
                  <span className="text-lg font-bold text-blue-400 font-mono">{analysis.best_route.bandwidth_gbps} Gbps</span>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2 & STEP 3: DISCOVERED ROUTES & THREAT FIND MATRIX */}
          <div className="bg-[#0D1322] border border-slate-800/80 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                <Radio size={16} /> STEP 2 & 3: ROUTE COMPARISON & THREAT ANALYSIS MATRIX
              </div>
              <span className="text-xs text-slate-400 font-mono">{analysis.routes.length} Routing Paths Discovered</span>
            </div>

            {/* Route Cards Tabs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {analysis.routes.map((rt) => {
                const isSelected = rt.route_id === (selectedRouteId || analysis.best_route.route_id);
                return (
                  <div
                    key={rt.route_id}
                    onClick={() => setSelectedRouteId(rt.route_id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/10'
                        : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{rt.route_id}</span>
                      {getThreatBadge(rt.threat_level)}
                    </div>
                    <h4 className="font-bold text-sm text-white mb-1">{rt.route_name}</h4>
                    <span className="text-[11px] text-slate-400 block mb-3">{rt.transit_type}</span>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800/60">
                      <div>
                        <span className="text-slate-500 block text-[10px]">THREAT SCORE</span>
                        <span className={`font-bold ${rt.threat_score < 25 ? 'text-emerald-400' : rt.threat_score < 60 ? 'text-amber-400' : 'text-red-400'}`}>
                          {rt.threat_score}/100
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">LATENCY</span>
                        <span className="text-slate-200 font-bold">{rt.avg_latency_ms} ms</span>
                      </div>
                    </div>

                    {rt.is_recommended && (
                      <div className="mt-3 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded text-center">
                        RECOMMENDED BEST ROUTE
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Route Detailed Hops Breakdown Table */}
            {activeRoute && (
              <div className="space-y-4 pt-2 border-t border-slate-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Server size={16} className="text-blue-400" />
                    Hop-by-Hop Network Telemetry & Threat Analysis ({activeRoute.route_id})
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span>Hops: {activeRoute.hops.length}</span>
                    <span>Distance: {activeRoute.total_distance_km} km</span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Hop #</th>
                        <th className="p-3">Node Name</th>
                        <th className="p-3">IP Address</th>
                        <th className="p-3">Location</th>
                        <th className="p-3">Latency (ms)</th>
                        <th className="p-3">Packet Loss</th>
                        <th className="p-3">Security Telemetry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {activeRoute.hops.map((hop) => (
                        <tr key={hop.hop_number} className="hover:bg-slate-900/40">
                          <td className="p-3 font-bold text-slate-300">{hop.hop_number}</td>
                          <td className="p-3 font-semibold text-white">{hop.node_name}</td>
                          <td className="p-3 text-blue-400 font-bold">{hop.ip_address}</td>
                          <td className="p-3 text-slate-300">{hop.location}</td>
                          <td className="p-3 text-slate-300">{hop.latency_ms} ms</td>
                          <td className="p-3 text-slate-300">{hop.packet_loss_pct}%</td>
                          <td className="p-3">
                            {hop.security_status === 'Clean' && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">CLEAN</span>
                            )}
                            {hop.security_status === 'Suspicious' && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">SUSPICIOUS</span>
                            )}
                            {hop.security_status === 'Threat Detected' && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-300 border border-red-500/30">THREAT DETECTED</span>
                            )}
                            {hop.threat_detail && (
                              <p className="text-[10px] text-red-400 mt-1 font-sans">{hop.threat_detail}</p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* DISPATCH REPORT MODAL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Dispatch Route Intelligence Report</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">
                      Email & SMS Dispatch
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Dispatch executive route telemetry report via Email & optional SMS Gateway</p>
                </div>
              </div>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Navigation Tabs if report dispatched */}
            {dispatchResult && (
              <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2">
                <button
                  onClick={() => setActiveTab('form')}
                  className={`pb-2.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                    activeTab === 'form'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText size={14} />
                  <span>Report Form</span>
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`pb-2.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                    activeTab === 'preview'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye size={14} />
                  <span>Live HTML & SMS Dispatch Preview</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {activeTab === 'form' ? (
                <form onSubmit={handleSendReport} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                      Recipient Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="analyst@security.org"
                      className="w-full px-3 me-2 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                      Recipient Phone (Optional SMS Dispatch)
                    </label>
                    <input
                      type="text"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="+91-9876543210 or +1-555-0199"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Entering a phone number triggers automated SOC SMS dispatch notification.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                      Additional Forensic Notes
                    </label>
                    <textarea
                      rows="3"
                      value={reportNotes}
                      onChange={(e) => setReportNotes(e.target.value)}
                      placeholder="Include special security instructions for transmission path selection..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsEmailModalOpen(false)}
                      className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sendingEmail}
                      className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
                    >
                      {sendingEmail ? <Cpu className="animate-spin" size={16} /> : <Send size={16} />}
                      {sendingEmail ? 'Dispatching Email & SMS...' : 'Dispatch Report'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {/* Dispatch Success Alert Banner */}
                  <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-emerald-400 text-xs font-medium">
                      <CheckCircle2 size={18} />
                      <span>{dispatchResult.message}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(dispatchResult.recipient_email)}&su=${encodeURIComponent(`🗺️ AEGIS Route Intelligence Report: ${analysis?.analysis_id}`)}&body=${encodeURIComponent(`Smart Route Intelligence Report\nAnalysis ID: ${analysis?.analysis_id}\nOptimal Route: ${analysis?.best_route?.route_name}\nThreat Score: ${analysis?.best_route?.threat_score}/100\nLatency: ${analysis?.best_route?.avg_latency_ms}ms\n\nPlease find full HTML report attached.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink size={14} />
                        <span>Open in Gmail</span>
                      </a>

                      <button
                        onClick={() => {
                          const blob = new Blob([dispatchResult.html_preview], { type: 'text/html' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `route_report_${analysis?.analysis_id || 'ANL'}.html`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Download size={14} />
                        <span>Save Report (.html)</span>
                      </button>
                    </div>
                  </div>

                  {/* SMS Dispatch Info Card if applicable */}
                  {dispatchResult.sms_dispatch && (
                    <div className="p-3.5 bg-purple-950/30 border border-purple-500/30 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-300 flex items-center gap-2">
                          <MessageSquare size={16} />
                          SMS Dispatch: {dispatchResult.sms_dispatch.recipient_phone}
                        </span>
                        <a
                          href={dispatchResult.sms_dispatch.whatsapp_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-purple-400 hover:underline flex items-center gap-1 font-mono"
                        >
                          <Phone size={12} /> Launch Web SMS / WhatsApp
                        </a>
                      </div>
                      <p className="text-xs text-slate-300 font-mono bg-slate-950/60 p-2.5 rounded border border-slate-800">
                        {dispatchResult.sms_dispatch.message_text}
                      </p>
                    </div>
                  )}

                  {/* Sandboxed HTML Email Render Container */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-black">
                    <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 text-xs text-slate-400 flex items-center justify-between font-mono">
                      <span>To: {dispatchResult.recipient_email}</span>
                      <span>HTML Email Render</span>
                    </div>
                    <iframe
                      title="Route Intelligence Email Preview"
                      srcDoc={dispatchResult.html_preview}
                      className="w-full h-[380px] border-0"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteOptimizationPage;
