import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, Filter, CheckCircle2, ShieldAlert, Download, Edit3 } from 'lucide-react';
import ToastNotification from '../components/ToastNotification';

export const AlertsPage = () => {
  const { user, hasRole } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [toast, setToast] = useState(null);

  const fetchAlerts = async () => {
    try {
      let url = '/alerts?limit=100';
      if (severityFilter) url += `&severity=${severityFilter}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const res = await client.get(url);
      setAlerts(res.data);
    } catch (err) {
      console.error("Alerts fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, statusFilter, search]);

  const handleUpdateStatus = async () => {
    if (!selectedAlert || !newStatus) return;
    try {
      await client.put(`/alerts/${selectedAlert.id}`, { status: newStatus });
      setToast({ type: 'success', message: `Alert ${selectedAlert.alert_code} status updated to ${newStatus}` });
      setSelectedAlert(null);
      fetchAlerts();
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to update alert status' });
    }
  };

  const handleExportCSV = () => {
    window.open('http://localhost:8000/api/reports/export/csv', '_blank');
  };

  const canEdit = hasRole(['Admin', 'Security Analyst']);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <ToastNotification type={toast?.type} message={toast?.message} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Bell className="text-amber-400" size={24} />
            Alert Management Console
          </h1>
          <p className="text-slate-400 text-xs mt-1">Automated threat detections, security alert triaging, and incident mitigation</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 border border-blue-400/30"
        >
          <Download size={16} />
          <span>Export Alerts CSV</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="glass-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Search size={16} /></span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Alert Code, IP, Attack..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Severities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
            <option value="False Positive">False Positive</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Total Alerts: <span className="text-amber-400 font-bold">{alerts.length}</span>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="glass-card rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Alert ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Source IP : Port</th>
                <th className="px-4 py-3">Dest IP : Port</th>
                <th className="px-4 py-3">Attack Type</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                    No security alerts found matching filter criteria.
                  </td>
                </tr>
              ) : (
                alerts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-blue-400">{a.alert_code}</td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {new Date(a.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">{a.source_ip}:{a.source_port}</td>
                    <td className="px-4 py-3 font-semibold text-slate-200">{a.destination_ip}:{a.destination_port}</td>
                    <td className="px-4 py-3 font-bold text-red-400">{a.attack_type}</td>
                    <td className="px-4 py-3 text-slate-300">{a.confidence}%</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                        a.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                        a.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}>
                        {a.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        a.status === 'New' ? 'bg-blue-500/20 text-blue-300' :
                        a.status === 'Investigating' ? 'bg-purple-500/20 text-purple-300' :
                        a.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-300' :
                        'bg-slate-700 text-slate-400'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px] truncate max-w-[220px]" title={a.description}>
                      {a.description}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canEdit ? (
                        <button
                          onClick={() => { setSelectedAlert(a); setNewStatus(a.status); }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 text-[11px] font-sans border border-slate-700 transition-colors inline-flex items-center gap-1"
                        >
                          <Edit3 size={12} />
                          <span>Triage</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-600">Read-Only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Triage Status Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-xl border border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="text-amber-400" size={18} />
              Triage Incident: {selectedAlert.alert_code}
            </h3>

            <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              <div><span className="text-slate-500">Attack Type:</span> <strong className="text-red-400">{selectedAlert.attack_type}</strong></div>
              <div><span className="text-slate-500">Source Host:</span> {selectedAlert.source_ip}</div>
              <div><span className="text-slate-500">Target Host:</span> {selectedAlert.destination_ip}:{selectedAlert.destination_port}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Update Incident Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="New">New (Unassigned)</option>
                <option value="Investigating">Investigating (Analyst Triage)</option>
                <option value="Resolved">Resolved (Mitigated / Blocked)</option>
                <option value="False Positive">False Positive (Whitelisted)</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
