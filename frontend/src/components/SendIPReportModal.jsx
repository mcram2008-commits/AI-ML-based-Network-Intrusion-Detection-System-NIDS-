import React, { useState, useEffect } from 'react';
import { Mail, Send, X, ShieldAlert, CheckCircle, Eye, FileText, ExternalLink, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sendIPIncidentReport } from '../api/client';
import ToastNotification from './ToastNotification';

export const SendIPReportModal = ({
  isOpen,
  onClose,
  initialSourceIp = '185.220.101.5',
  initialDestinationIp = '10.0.0.1'
}) => {
  const { user } = useAuth();

  const [sourceIp, setSourceIp] = useState(initialSourceIp);
  const [destinationIp, setDestinationIp] = useState(initialDestinationIp);
  const [recipientEmail, setRecipientEmail] = useState(user?.email || 'analyst@nids.sec');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'preview'

  useEffect(() => {
    if (initialSourceIp) setSourceIp(initialSourceIp);
    if (initialDestinationIp) setDestinationIp(initialDestinationIp);
    if (user?.email) setRecipientEmail(user.email);
  }, [initialSourceIp, initialDestinationIp, user]);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!sourceIp || !destinationIp || !recipientEmail) {
      setToast({ type: 'warning', message: 'Please provide Source IP, Destination IP, and Recipient Email.' });
      return;
    }

    setSending(true);
    setDispatchResult(null);
    try {
      const res = await sendIPIncidentReport({
        source_ip: sourceIp,
        destination_ip: destinationIp,
        recipient_email: recipientEmail,
        notes: notes.trim() || undefined
      });

      setDispatchResult(res);
      setToast({
        type: 'success',
        message: res.simulated
          ? `Security Report generated & preview ready for ${recipientEmail}!`
          : `Security Report successfully sent to ${recipientEmail}!`
      });
      setActiveTab('preview');
    } catch (err) {
      console.error('Email dispatch error:', err);
      const errDetail = err.response?.data?.detail || 'Failed to dispatch security report email.';
      setToast({ type: 'error', message: typeof errDetail === 'string' ? errDetail : 'Error dispatching email' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <ToastNotification
        type={toast?.type}
        message={toast?.message}
        onClose={() => setToast(null)}
      />

      <div className="glass-card w-full max-w-3xl bg-[#0B1120] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Mail size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Dispatch IP Incident Email Report</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">
                  SOC Mailer
                </span>
              </h3>
              <p className="text-xs text-slate-400">Generate executive threat report for endpoint IP pairing and dispatch via Email</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
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
              <span>Report Controls</span>
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
              <span>Live HTML Email Dispatch Preview</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'form' ? (
            <form onSubmit={handleSend} className="space-y-5">
              {/* Endpoint IP Pair Card */}
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Endpoint IP Pairing Parameters
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-red-400 mb-1">
                      Sending Side IP (Source / Attacker)
                    </label>
                    <input
                      type="text"
                      value={sourceIp}
                      onChange={(e) => setSourceIp(e.target.value)}
                      placeholder="e.g. 185.220.101.5"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-sm text-white focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-emerald-400 mb-1">
                      Destination Side IP (Target / Server)
                    </label>
                    <input
                      type="text"
                      value={destinationIp}
                      onChange={(e) => setDestinationIp(e.target.value)}
                      placeholder="e.g. 10.0.0.1"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-sm text-white focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Recipient & Analyst Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="analyst@company.sec"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:border-blue-500 focus:outline-none"
                    required
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Defaults to registered account email ({user?.email || 'user'}).
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    Sender Account
                  </label>
                  <div className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 flex items-center justify-between">
                    <span className="font-mono text-xs">{user?.full_name} ({user?.role})</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">Verified</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Analyst Assessment Notes (Included in Email)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Enter custom incident response notes or instructions for the recipient..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-600/30 border border-blue-400/30 flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  {sending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Building & Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Dispatch Incident Email Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
                  <CheckCircle size={18} />
                  <span>{dispatchResult.message}</span>
                </div>
                
                {/* Alternative Direct Webmail / Client Launchers */}
                <div className="flex items-center gap-2">
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(dispatchResult.recipient)}&su=${encodeURIComponent(`🛡️ NIDS Incident Report: ${sourceIp} ➔ ${destinationIp}`)}&body=${encodeURIComponent(`NIDS Security Report\nSource IP: ${sourceIp}\nDestination IP: ${destinationIp}\nAnalyst Notes: ${notes || 'None'}\n\nPlease check full report in SOC console.`)}`}
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
                      a.download = `nids_security_report_${sourceIp}_to_${destinationIp}.html`;
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

              {/* Rendered HTML Email Preview inside sandboxed Container */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-black">
                <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 text-xs text-slate-400 flex items-center justify-between font-mono">
                  <span>To: {dispatchResult.recipient}</span>
                  <span>HTML Mail Render</span>
                </div>
                <iframe
                  title="Security Email Report Preview"
                  srcDoc={dispatchResult.html_preview}
                  className="w-full h-[400px] border-0"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendIPReportModal;
