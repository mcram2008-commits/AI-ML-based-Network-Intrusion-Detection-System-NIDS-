import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Shield, Lock, Clock, Eye, AlertTriangle, Key, CheckCircle, RefreshCw, FileText, Server, Download, Copy } from 'lucide-react';

const API_URLS = [
  'http://127.0.0.1:8000/api',
  'http://localhost:8000/api'
];

export const SharedReportViewerPage = () => {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  // Passphrase protection state
  const [isProtected, setIsProtected] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [passphraseError, setPassphraseError] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const fetchSharedLink = async () => {
    setLoading(true);
    setError(null);
    let lastErr = null;

    for (const baseUrl of API_URLS) {
      try {
        const res = await axios.get(`${baseUrl}/share/view/${token}`);
        if (res.data.is_protected) {
          setIsProtected(true);
          setReportData(res.data);
        } else {
          setIsProtected(false);
          setReportData(res.data);
        }
        setLoading(false);
        return;
      } catch (err) {
        lastErr = err;
      }
    }

    console.error("View shared link error:", lastErr);
    setError(lastErr?.response?.data?.detail || "Failed to connect to backend server or secret link has expired.");
    setLoading(false);
  };

  useEffect(() => {
    if (token) {
      fetchSharedLink();
    }
  }, [token]);

  const handleVerifyPassphrase = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setPassphraseError(null);
    let lastErr = null;

    for (const baseUrl of API_URLS) {
      try {
        const res = await axios.post(`${baseUrl}/share/verify-passphrase`, {
          token: token,
          passphrase: passphrase
        });
        setIsProtected(false);
        setReportData(res.data);
        setVerifying(false);
        return;
      } catch (err) {
        lastErr = err;
      }
    }

    console.error("Passphrase error:", lastErr);
    setPassphraseError(lastErr?.response?.data?.detail || "Incorrect secret passcode. Access denied.");
    setVerifying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A12] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4">
        <div className="glass-card p-6 rounded-2xl border border-emerald-500/30 flex items-center gap-3 text-emerald-400 font-semibold shadow-2xl shadow-emerald-950/40 animate-pulse">
          <RefreshCw size={24} className="animate-spin text-emerald-400" />
          <span className="text-sm">Decrypting & Loading Shared Security Data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#070A12] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-slate-900/90 border border-rose-500/30 p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
          <div className="inline-flex p-4 rounded-full bg-rose-500/10 text-rose-400 mb-2 border border-rose-500/20">
            <AlertTriangle size={36} />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Access Denied / Expired Link</h2>
          <p className="text-slate-300 text-xs leading-relaxed font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800">{error}</p>
          <div className="pt-2">
            <a
              href="/"
              className="inline-block px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20"
            >
              Return to AEGIS NIDS Portal
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Renders Passphrase Form if Protected
  if (isProtected) {
    return (
      <div className="min-h-screen bg-[#070A12] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6">
        <div className="bg-slate-900/95 border border-emerald-500/40 p-8 rounded-2xl max-w-md w-full shadow-2xl shadow-emerald-950/50 space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 mb-1 animate-bounce">
              <Lock size={32} />
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider block w-fit mx-auto">
              Protected Secret Share
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">{reportData?.title || 'Passcode Protected Link'}</h2>
            <p className="text-slate-300 text-xs leading-relaxed">
              This shared link is encrypted with a passcode. Please enter the password to unlock and view the contents.
            </p>
          </div>

          {passphraseError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs text-center font-semibold animate-fadeIn">
              ⚠️ {passphraseError}
            </div>
          )}

          <form onSubmit={handleVerifyPassphrase} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                <Key size={14} className="text-emerald-400" />
                Enter Passcode
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Type secret passcode here..."
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 uppercase tracking-wider"
            >
              {verifying ? (
                'Verifying Passcode...'
              ) : (
                <>
                  <Lock size={15} />
                  Unlock Shared Data
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const rawPayload = reportData?.payload;
  const payload = (rawPayload && typeof rawPayload === 'object' && !Array.isArray(rawPayload)) ? rawPayload : {};
  const isCustomContent = Boolean(payload?.custom_content);

  return (
    <div className="min-h-screen bg-[#070A12] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-6 md:p-12 max-w-5xl mx-auto space-y-8">

      {/* Header Badge */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Shield size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold tracking-wider uppercase">
                Encrypted Secret Share
              </span>
              {reportData?.mask_pii && (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-semibold">
                  PII Anonymized
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">{reportData?.title || "Security Data Export"}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-amber-400" />
            <span>Shared: {reportData?.created_at ? new Date(reportData.created_at).toLocaleString() : 'N/A'}</span>
          </div>
          {reportData?.view_count ? (
            <div className="flex items-center gap-1.5">
              <Eye size={14} className="text-emerald-400" />
              <span>Views: {reportData.view_count}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Shared Payload Render */}
      <div className="space-y-6">
        
        {/* Render Shared Bulk File Download Card if file is attached */}
        {(reportData?.has_file || reportData?.file_name) && (
          <div className="bg-slate-900/90 border border-emerald-500/40 p-6 rounded-2xl shadow-xl space-y-4 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Server size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    📁 {reportData.file_name || 'Encrypted Bulk File Share'}
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5 font-mono">
                    Size: {reportData.file_size_bytes ? (reportData.file_size_bytes / (1024 * 1024)).toFixed(2) + ' MB' : 'Bulk Dataset'} • Encryption: AES-256
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  const passParam = passphrase ? `?passphrase=${encodeURIComponent(passphrase)}` : '';
                  window.location.href = `http://127.0.0.1:8000/api/share/download-file/${token}${passParam}`;
                }}
                className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Download size={16} />
                <span>Decrypt & Download File</span>
              </button>
            </div>

            {reportData.destination_ip_lock && (
              <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs text-blue-300 flex items-center gap-2">
                <Shield size={16} className="text-blue-400" />
                <span>🎯 Destination IP Restriction Active: Only requests from IP <strong>{reportData.destination_ip_lock}</strong> can decrypt this file.</span>
              </div>
            )}
          </div>
        )}

        {/* Render Custom User Input Content if present */}
        {payload?.custom_content ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText size={18} className="text-emerald-400" />
                Custom Shared User Payload & Packet Telemetry
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const blob = new Blob([payload.custom_content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `shared-payload-${token}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs flex items-center gap-1.5 border border-slate-700 transition-all"
                >
                  <Download size={14} />
                  <span>Download File</span>
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(payload.custom_content);
                    alert("Custom payload copied to clipboard!");
                  }}
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold rounded-lg text-xs flex items-center gap-1.5 border border-emerald-500/30 transition-all"
                >
                  <Copy size={14} />
                  <span>Copy Content</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-xs text-emerald-400 whitespace-pre-wrap leading-relaxed overflow-x-auto shadow-inner">
              {payload.custom_content}
            </div>

            {payload.shared_at && (
              <div className="text-[11px] text-slate-500 font-mono">
                Payload Type: <span className="text-slate-400">{payload.data_type || 'User Custom Input'}</span> • Timestamp: <span className="text-slate-400">{new Date(payload.shared_at).toLocaleString()}</span>
              </div>
            )}
          </div>
        ) : typeof payload === 'object' ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileText size={18} className="text-emerald-400" />
              Shared Security Telemetry Summary
            </h3>

            {/* Key Value Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(payload).map(([k, v]) => {
                if (typeof v === 'object') return null;
                return (
                  <div key={k} className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {k.replace(/_/g, ' ')}
                    </span>
                    <p className="text-sm font-bold text-emerald-300 font-mono break-all">
                      {String(v)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Structured Table / Sub-objects */}
            {Object.entries(payload).map(([k, v]) => {
              if (Array.isArray(v) && v.length > 0) {
                return (
                  <div key={k} className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Server size={14} className="text-emerald-400" />
                      {k.replace(/_/g, ' ')} ({v.length} items)
                    </h4>
                    <div className="overflow-x-auto border border-slate-800 rounded-xl">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                          <tr>
                            {Object.keys(v[0]).slice(0, 6).map(header => (
                              <th key={header} className="p-3 font-semibold uppercase text-[10px]">
                                {header.replace(/_/g, ' ')}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                          {v.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/40">
                              {Object.keys(v[0]).slice(0, 6).map(header => (
                                <td key={header} className="p-3 font-mono">
                                  {String(item[header])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        )}

      </div>

      <div className="text-center pt-6 text-xs text-slate-500 border-t border-slate-900">
        AEGIS NIDS — Secure Encrypted Data Sharing Engine • Strictly Confidential
      </div>
    </div>
  );
};

export default SharedReportViewerPage;
