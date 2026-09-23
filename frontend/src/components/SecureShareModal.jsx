import React, { useState } from 'react';
import client from '../api/client';
import { Shield, Lock, EyeOff, Clock, Copy, Check, X, Key, Share2, Sparkles, FileText, Edit3, Database, UploadCloud, Target, FileCheck } from 'lucide-react';

const SecureShareModal = ({ isOpen, onClose, reportTitle = "Security Report", payloadData = {}, onToast }) => {
  const [dataMode, setDataMode] = useState(payloadData && Object.keys(payloadData).length > 0 ? 'screen' : 'custom');
  const [title, setTitle] = useState(reportTitle || "SOC Security Audit Report");
  const [customData, setCustomData] = useState('');
  
  // Bulk File & Recipient IP Lock State
  const [selectedFile, setSelectedFile] = useState(null);
  const [destinationIp, setDestinationIp] = useState('');

  const [expiryHours, setExpiryHours] = useState(24);
  const [singleView, setSingleView] = useState(false);
  const [usePassphrase, setUsePassphrase] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [maskPii, setMaskPii] = useState(true);
  const [loading, setLoading] = useState(false);

  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const sampleTrafficLog = `[RAW PACKET TELEMETRY CAPTURE]
Timestamp: ${new Date().toISOString()}
Source IP: 192.168.1.105 (Port: 443) -> Dest IP: 10.0.0.1 (Port: 8080)
Protocol: TCP/TLS1.3 | Flags: SYN, ACK
Packet Length: 1460 bytes | Threat Vector: Possible Port Scan / SQL Injection
Payload Snapshot: GET /api/v1/users?id=1' UNION SELECT username,password FROM users-- HTTP/1.1`;

  const sampleIncidentNote = `[INCIDENT INVESTIGATION REPORT]
Analyst Note: High volume traffic detected from cable capture segment 04.
Identified Anomalies:
- 1,420 connection attempts in 30 seconds.
- Target IP: 10.0.0.45 (Database Server).
Action Recommended: Immediate firewall block for source subnet 185.220.x.x.`;

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGeneratedLink('');
    setErrorMsg('');
    setCopied(false);

    let finalTitle = title.trim() || reportTitle || "SOC Security Data Share";

    try {
      if (dataMode === 'file') {
        if (!selectedFile) {
          setErrorMsg("Please select or drop a bulk file / packet capture (.pcap, .csv, .log, .zip) to upload.");
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', finalTitle);
        formData.append('expiry_hours', singleView ? 0 : Number(expiryHours || 24));
        formData.append('single_view', singleView);
        if (usePassphrase && passphrase.trim()) {
          formData.append('passphrase', passphrase.trim());
        }
        formData.append('mask_pii', maskPii);
        if (destinationIp.trim()) {
          formData.append('destination_ip', destinationIp.trim());
        }

        const res = await client.post('/share/upload-file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const fullUrl = `${window.location.origin}${res.data.share_url}`;
        setGeneratedLink(fullUrl);
      } else {
        let finalPayload = {};
        if (dataMode === 'custom') {
          if (!customData.trim()) {
            setErrorMsg("Please enter or paste custom user data / packet logs to share.");
            setLoading(false);
            return;
          }
          try {
            finalPayload = JSON.parse(customData);
          } catch (err) {
            finalPayload = {
              "title": finalTitle,
              "custom_content": customData.trim(),
              "shared_at": new Date().toISOString(),
              "data_type": "Custom User Input Telemetry Data"
            };
          }
        } else {
          finalPayload = (payloadData && Object.keys(payloadData).length > 0)
            ? payloadData
            : { "summary": "AEGIS NIDS Executive Audit Report", "timestamp": new Date().toISOString() };
        }

        const res = await client.post('/share/create', {
          title: finalTitle,
          payload: finalPayload,
          expiry_hours: singleView ? 0 : Number(expiryHours || 24),
          single_view: singleView,
          passphrase: (usePassphrase && passphrase.trim()) ? passphrase.trim() : null,
          mask_pii: maskPii,
          destination_ip: destinationIp.trim() || null
        });

        const fullUrl = `${window.location.origin}${res.data.share_url}`;
        setGeneratedLink(fullUrl);
      }

      if (onToast) {
        onToast({ type: 'success', message: 'Secret share link generated securely!' });
      }
    } catch (err) {
      console.error("Create share link error:", err);
      const detail = err.response?.data?.detail || 'Failed to generate secret link. Make sure backend API is connected.';
      setErrorMsg(detail);
      if (onToast) {
        onToast({ type: 'error', message: detail });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    if (onToast) {
      onToast({ type: 'success', message: 'Secret link copied to clipboard!' });
    }
    setTimeout(() => setCopied(false), 2500);
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-emerald-950/30 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Generate Secret Share Link
              </h3>
              <p className="text-slate-400 text-xs">Encrypted, self-destructing data share with PII protection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">

          {generatedLink ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-3">
                <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 mb-1">
                  <Check size={24} />
                </div>
                <h4 className="text-base font-semibold text-white">Secret Share Link Ready!</h4>
                <p className="text-slate-300 text-xs">
                  This link contains your encrypted data snapshot. Send it safely to your recipient.
                </p>
                
                {/* Link Box */}
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg p-2 mt-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    className="bg-transparent text-emerald-300 text-xs w-full focus:outline-none font-mono px-2"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-md text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-md"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>🔒 PII Masking: <strong className="text-emerald-400">{maskPii ? 'Active' : 'Disabled'}</strong></span>
                <span>⏱ Expiry: <strong className="text-amber-400">{singleView ? 'Single View' : `${expiryHours} Hours`}</strong></span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGeneratedLink('')}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all"
                >
                  Create Another Link
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleGenerate} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center justify-between">
                  <span>{errorMsg}</span>
                  <button type="button" onClick={() => setErrorMsg('')} className="p-1 hover:text-white">&times;</button>
                </div>
              )}

              {/* Data Source Mode Tabs */}
              <div className="bg-slate-800/80 p-1 rounded-xl flex items-center border border-slate-700/60 gap-1">
                <button
                  type="button"
                  onClick={() => setDataMode('screen')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                    dataMode === 'screen'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Database size={13} />
                  <span>Screen Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDataMode('custom')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                    dataMode === 'custom'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Edit3 size={13} />
                  <span>Custom Input</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDataMode('file')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                    dataMode === 'file'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UploadCloud size={13} />
                  <span>Upload Bulk File (25GB)</span>
                </button>
              </div>

              {/* Share Title Input */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <FileText size={13} className="text-emerald-400" />
                  Report / Share Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter share title..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Mode 1: Screen Data Preview */}
              {dataMode === 'screen' ? (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1 font-mono">
                  <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                    <span>📊 Automatic Data Payload:</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Auto-Collected</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Captures active audit summary metrics, detection rates, and IP threat lists currently loaded on screen.
                  </p>
                </div>
              ) : dataMode === 'custom' ? (
                /* Mode 2: Custom User Data Input */
                <div className="space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-300">
                      Enter or Paste Custom User Data / Packet Logs:
                    </label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCustomData(sampleTrafficLog)}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-all"
                      >
                        + Packet Log
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomData(sampleIncidentNote)}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 transition-all"
                      >
                        + Incident Note
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    value={customData}
                    onChange={(e) => setCustomData(e.target.value)}
                    placeholder="Type or paste custom user network logs, captured telemetry, JSON payload, or confidential notes here..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-emerald-300 placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500 custom-scrollbar"
                  />
                </div>
              ) : (
                /* Mode 3: Bulk File Upload (up to 25GB) */
                <div className="space-y-3 animate-fadeIn">
                  <label className="block text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span>Upload Bulk Packet Capture / Dataset File:</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Max Capacity: 25 GB</span>
                  </label>

                  <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-4 bg-slate-950/60 text-center transition-all">
                    <input
                      type="file"
                      id="bulk-file-upload-input"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                    />
                    <label htmlFor="bulk-file-upload-input" className="cursor-pointer space-y-2 block">
                      <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <UploadCloud size={24} />
                      </div>
                      {selectedFile ? (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                            <FileCheck size={14} />
                            {selectedFile.name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            Size: {formatBytes(selectedFile.size)} • AES-256 Encryption Ready
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-semibold text-slate-200">
                            Click to Browse or Drag & Drop File Here
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Supports .pcap, .csv, .log, .json, .zip, .tar.gz, .bin, .txt files
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {/* Destination IP Restriction Lock */}
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Target size={14} className="text-blue-400" />
                  Designated Recipient IP Lock (Optional Security)
                </label>
                <input
                  type="text"
                  value={destinationIp}
                  onChange={(e) => setDestinationIp(e.target.value)}
                  placeholder="e.g. 192.168.1.50 or 10.0.0.45 (Only this IP can decrypt)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-blue-300 placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400">
                  If set, decryption will be strictly blocked for all other IP addresses.
                </p>
              </div>
              
              {/* Expiry Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-400" />
                  Link Expiration & Access Limit
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    disabled={singleView}
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    <option value={1}>Expires in 1 Hour</option>
                    <option value={24}>Expires in 24 Hours</option>
                    <option value={168}>Expires in 7 Days</option>
                  </select>

                  <label className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 cursor-pointer select-none text-xs text-slate-300 hover:border-slate-600 transition-all">
                    <input
                      type="checkbox"
                      checked={singleView}
                      onChange={(e) => setSingleView(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <EyeOff size={14} className="text-rose-400" />
                    1-Time Single View
                  </label>
                </div>
              </div>

              {/* Passphrase Option */}
              <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-3">
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    <Lock size={14} className="text-emerald-400" />
                    Protect with Secret Passcode
                  </span>
                  <input
                    type="checkbox"
                    checked={usePassphrase}
                    onChange={(e) => setUsePassphrase(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                  />
                </label>

                {usePassphrase && (
                  <div className="pt-1 animate-fadeIn">
                    <div className="relative">
                      <Key size={14} className="absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="password"
                        required
                        placeholder="Enter secret passcode for recipient..."
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* PII Masking Toggle */}
              <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={maskPii}
                    onChange={(e) => setMaskPii(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <Shield size={13} />
                      Anonymize IPs & Customer Credentials (PII Protection)
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Automatically masks internal IP addresses (e.g. 192.168.x.x) and user credentials before sharing.
                    </p>
                  </div>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {loading ? (
                    'Generating...'
                  ) : (
                    <>
                      <Share2 size={14} />
                      Generate Secret Link
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default SecureShareModal;
