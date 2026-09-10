import React, { useState, useEffect } from 'react';
import client from '../api/client';
import {
  Zap, ShieldAlert, Play, CheckCircle2, AlertTriangle, Plus, Trash2,
  RefreshCw, Power, Terminal, Layers, FileCode, Sliders, Activity
} from 'lucide-react';

export const PlaybooksPage = () => {
  const [playbooks, setPlaybooks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('playbooks'); // 'playbooks' | 'logs'
  const [showAddModal, setShowAddModal] = useState(false);
  const [testingIp, setTestingIp] = useState('185.220.101.55');
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_severity: 'CRITICAL',
    min_threat_score: 75,
    attack_type: 'ANY',
    action: 'BLOCK_IP'
  });

  const fetchPlaybooksAndLogs = async () => {
    try {
      setLoading(true);
      const [pbRes, logsRes] = await Promise.all([
        client.get('/playbooks'),
        client.get('/playbooks/logs')
      ]);

      setPlaybooks(pbRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error('Failed to load playbooks data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaybooksAndLogs();
  }, []);

  const handleToggle = async (id) => {
    try {
      await client.put(`/playbooks/${id}/toggle`);
      fetchPlaybooksAndLogs();
    } catch (err) {
      alert('Failed to toggle playbook status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this SOAR playbook rule?')) return;
    try {
      await client.delete(`/playbooks/${id}`);
      fetchPlaybooksAndLogs();
    } catch (err) {
      alert('Failed to delete playbook rule');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await client.post('/playbooks', formData);
      setShowAddModal(false);
      setFormData({
        name: '',
        description: '',
        trigger_severity: 'CRITICAL',
        min_threat_score: 75,
        attack_type: 'ANY',
        action: 'BLOCK_IP'
      });
      fetchPlaybooksAndLogs();
    } catch (err) {
      alert('Failed to create playbook rule');
    }
  };

  const handleRunTest = async () => {
    try {
      setTestLoading(true);
      const res = await client.post(`/playbooks/test-run?source_ip=${testingIp}`);
      setTestResult(res.data);
      fetchPlaybooksAndLogs();
    } catch (err) {
      alert('Failed to run test trigger');
    } finally {
      setTestLoading(false);
    }
  };


  const activeCount = playbooks.filter(p => p.is_active).length;
  const totalExecutions = playbooks.reduce((acc, p) => acc + (p.execution_count || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap size={22} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">SOAR Automated Incident Playbooks</h1>
              <p className="text-xs text-slate-400">Security Orchestration, Automation & Autonomous Threat Mitigation</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPlaybooksAndLogs}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition"
          >
            <Plus size={16} />
            New Playbook Rule
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0D121F] border border-slate-800/90 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Active Playbooks</p>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{activeCount} / {playbooks.length}</h3>
          </div>
        </div>

        <div className="bg-[#0D121F] border border-slate-800/90 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Mitigations Executed</p>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{totalExecutions}</h3>
          </div>
        </div>

        <div className="bg-[#0D121F] border border-slate-800/90 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Response Latency</p>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">&lt; 15 ms</h3>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Interactive Test Console */}
      <div className="bg-[#0D121F] border border-slate-800/90 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('playbooks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'playbooks'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers size={14} />
              Configured Rules ({playbooks.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'logs'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal size={14} />
              Execution Logs ({logs.length})
            </button>
          </div>

          {/* Quick Simulation Trigger */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={testingIp}
              onChange={(e) => setTestingIp(e.target.value)}
              placeholder="Test Attacker IP..."
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44"
            />
            <button
              onClick={handleRunTest}
              disabled={testLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-medium transition"
            >
              <Play size={12} className={testLoading ? 'animate-spin' : ''} />
              {testLoading ? 'Testing...' : 'Simulate Trigger'}
            </button>
          </div>
        </div>

        {/* Test Result Banner */}
        {testResult && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-3 text-xs text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Simulated trigger on IP <b>{testResult.source_ip}</b> successfully activated <b>{testResult.triggered_count}</b> playbook rule(s).</span>
            </div>
            <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* TAB 1: PLAYBOOKS LIST */}
        {activeTab === 'playbooks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {playbooks.map((pb) => (
              <div
                key={pb.id}
                className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                  pb.is_active
                    ? 'bg-slate-900/60 border-slate-700/80 shadow-md hover:border-blue-500/50'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-white text-sm leading-snug">{pb.name}</h3>
                    <button
                      onClick={() => handleToggle(pb.id)}
                      className={`p-1.5 rounded-lg transition ${
                        pb.is_active
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                      }`}
                      title={pb.is_active ? 'Disable Playbook' : 'Enable Playbook'}
                    >
                      <Power size={16} />
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {pb.description || 'Automated response rule triggered on threat threshold.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className={`px-2 py-0.5 rounded font-mono font-medium ${
                      pb.trigger_severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      pb.trigger_severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {pb.trigger_severity} Severity
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      Target: {pb.attack_type}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono border border-amber-500/20">
                      Score &ge; {pb.min_threat_score}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-blue-400 font-medium">
                    <Zap size={13} />
                    <span>Action: <b>{pb.action}</b></span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500 font-mono">{pb.execution_count || 0} runs</span>
                    <button
                      onClick={() => handleDelete(pb.id)}
                      className="text-slate-500 hover:text-red-400 transition"
                      title="Delete Playbook"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: EXECUTION LOGS */}
        {activeTab === 'logs' && (
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Source IP</th>
                  <th className="p-3">Action Executed</th>
                  <th className="p-3">Details / Response Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-semibold text-blue-400 whitespace-nowrap">
                      {log.source_ip}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {log.action_taken}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 max-w-md truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE PLAYBOOK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D121F] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus size={18} className="text-blue-400" />
                Create SOAR Playbook Rule
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Playbook Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Auto-Block Critical DDoS IPs"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Explain when and why this playbook executes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Trigger Severity</label>
                  <select
                    value={formData.trigger_severity}
                    onChange={(e) => setFormData({ ...formData, trigger_severity: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="CRITICAL">CRITICAL Only</option>
                    <option value="HIGH">HIGH & CRITICAL</option>
                    <option value="ALL">ALL Severities</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Attack Preset</label>
                  <select
                    value={formData.attack_type}
                    onChange={(e) => setFormData({ ...formData, attack_type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ANY">Any Attack Type</option>
                    <option value="DoS/DDoS">DoS / DDoS</option>
                    <option value="Brute Force">Brute Force</option>
                    <option value="Port Scan">Port Scan</option>
                    <option value="Botnet">Botnet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Min Threat Score Threshold: <b>{formData.min_threat_score}</b>
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={formData.min_threat_score}
                  onChange={(e) => setFormData({ ...formData, min_threat_score: parseFloat(e.target.value) })}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Automated Response Action</label>
                <select
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 font-semibold text-blue-400"
                >
                  <option value="BLOCK_IP">BLOCK_IP (Add Windows/iptables Firewall Rule)</option>
                  <option value="CREATE_ALERT">CREATE_ALERT (Generate High Severity Alert)</option>
                  <option value="NOTIFY_TEAM">NOTIFY_TEAM (Dispatch Slack/Discord Webhook)</option>
                  <option value="ISOLATE_SUBNET">ISOLATE_SUBNET (Rate limit subnet traffic)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30"
                >
                  Save Playbook Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaybooksPage;
