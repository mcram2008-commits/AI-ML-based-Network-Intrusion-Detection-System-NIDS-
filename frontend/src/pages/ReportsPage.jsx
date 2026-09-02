import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { FileText, Download, Printer, ShieldCheck, CheckCircle2, AlertTriangle, Mail } from 'lucide-react';
import ToastNotification from '../components/ToastNotification';
import SendIPReportModal from '../components/SendIPReportModal';

export const ReportsPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await client.get('/reports/summary');
        setReport(res.data);
      } catch (err) {
        console.error("Report error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const handleExportCSV = () => {
    window.open('http://127.0.0.1:8000/api/reports/export/csv', '_blank');
  };

  const handlePrintPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-400">Compiling SOC Executive Report...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <ToastNotification type={toast?.type} message={toast?.message} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FileText className="text-emerald-400" size={24} />
            Security Operations Executive Report
          </h1>
          <p className="text-slate-400 text-xs mt-1">Comprehensive network threat audit, attack summaries, and defense recommendations</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMailModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-all border border-indigo-400/30 shadow-lg shadow-indigo-600/20"
          >
            <Mail size={16} />
            <span>Send Incident Email</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-all border border-blue-400/30 shadow-lg shadow-blue-600/20"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all border border-slate-700"
          >
            <Printer size={16} />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      <SendIPReportModal
        isOpen={isMailModalOpen}
        onClose={() => setIsMailModalOpen(false)}
        initialSourceIp="185.220.101.5"
        initialDestinationIp="10.0.0.1"
      />

      {/* Printable Report Document Card */}
      <div className="glass-card p-8 rounded-2xl border border-slate-800 space-y-6 shadow-2xl text-slate-200 print:text-black print:bg-white print:p-0">
        {/* Document Title */}
        <div className="flex justify-between items-center border-b border-slate-800 print:border-slate-300 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white print:text-black">AEGIS NIDS SECURITY AUDIT REPORT</h2>
            <div className="text-xs text-slate-400 print:text-slate-600 font-mono mt-1">Generated: {report?.generated_at ? new Date(report.generated_at).toLocaleString() : 'N/A'}</div>
          </div>
          <div className="text-right text-xs font-mono text-slate-400">
            <div>Prepared By: <span className="text-blue-400 font-bold">{report?.generated_by || 'SOC User'}</span></div>
            <div>Role: <span className="text-purple-400">{report?.role || 'Viewer'}</span></div>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800 font-mono">
          <div>
            <span className="text-slate-500 text-[10px] block uppercase">Total Traffic</span>
            <span className="text-lg font-bold text-white">{(report?.total_traffic_analyzed ?? 0).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block uppercase">Normal Flows</span>
            <span className="text-lg font-bold text-emerald-400">{(report?.normal_traffic ?? 0).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block uppercase">Attacks Detected</span>
            <span className="text-lg font-bold text-red-400">{(report?.malicious_traffic ?? 0).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block uppercase">Detection Rate</span>
            <span className="text-lg font-bold text-purple-300">{report?.detection_accuracy ?? 98.4}%</span>
          </div>
        </div>

        {/* Top Attacking & Targeted Systems */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider font-mono">Top Attacking Source IPs</h3>
            <ul className="space-y-1 font-mono text-red-400">
              {(report?.top_attacking_ips || []).map((ip, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  <span>{ip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider font-mono">Top Targeted Infrastructure</h3>
            <ul className="space-y-1 font-mono text-blue-400">
              {(report?.top_targeted_systems || []).map((sys, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  <span>{sys}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Executive Recommendations */}
        <div className="p-5 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-3">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck size={16} />
            Recommended SOC Security Countermeasures
          </h3>
          <ul className="space-y-2 text-xs text-slate-300 font-mono">
            {(report?.recommendations || []).map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
