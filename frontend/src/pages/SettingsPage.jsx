import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Settings, Save, Shield, Cpu, RefreshCw, Bell } from 'lucide-react';
import ToastNotification from '../components/ToastNotification';

export const SettingsPage = () => {
  const [settings, setSettings] = useState({
    detection_threshold: 0.5,
    alert_threshold: 'MEDIUM',
    refresh_interval_sec: 3,
    demo_mode: true
  });
  const [models, setModels] = useState([]);
  const [activeModelId, setActiveModelId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchData = async () => {
    try {
      const [resSettings, resModels] = await Promise.all([
        client.get('/settings'),
        client.get('/models')
      ]);
      setSettings({
        detection_threshold: parseFloat(resSettings.data.detection_threshold || 0.5),
        alert_threshold: resSettings.data.alert_threshold || 'MEDIUM',
        refresh_interval_sec: parseInt(resSettings.data.refresh_interval_sec || 3),
        demo_mode: resSettings.data.demo_mode === 'true'
      });
      setActiveModelId(resSettings.data.active_model_id || '1');
      setModels(resModels.data);
    } catch (err) {
      console.error("Fetch settings error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.put('/settings', {
        ...settings,
        active_model_id: parseInt(activeModelId)
      });
      setToast({ type: 'success', message: 'System settings updated successfully!' });
      fetchData();
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <ToastNotification type={toast?.type} message={toast?.message} onClose={() => setToast(null)} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="text-slate-400" size={24} />
          System Settings & Threshold Controls
        </h1>
        <p className="text-slate-400 text-xs mt-1">Configure global detection sensitivity, active ML engine, alert trigger threshold, and live stream rate</p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="glass-card p-8 rounded-2xl border border-slate-800 space-y-6 shadow-2xl">
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Cpu size={16} className="text-purple-400" />
            Active Machine Learning Engine
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Primary Detection Model</label>
            <select
              value={activeModelId}
              onChange={(e) => setActiveModelId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — Accuracy: {m.accuracy}% ({m.algorithm})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Bell size={16} className="text-amber-400" />
            Threat Threshold & Sensitivity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Detection Sensitivity Threshold: <span className="text-blue-400 font-mono font-bold">{settings.detection_threshold}</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={settings.detection_threshold}
                onChange={(e) => setSettings({ ...settings, detection_threshold: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-[10px] text-slate-500 block mt-1">Higher values require greater classification confidence to flag as attack.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Alert Trigger Minimum Severity</label>
              <select
                value={settings.alert_threshold}
                onChange={(e) => setSettings({ ...settings, alert_threshold: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="LOW">LOW (Trigger all suspicious flows)</option>
                <option value="MEDIUM">MEDIUM (Trigger Medium, High & Critical)</option>
                <option value="HIGH">HIGH (Trigger High & Critical only)</option>
                <option value="CRITICAL">CRITICAL (Trigger Critical emergency flows only)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <RefreshCw size={16} className="text-emerald-400" />
            Telemetry Stream Settings
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Data Refresh Interval (Seconds)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={settings.refresh_interval_sec}
                onChange={(e) => setSettings({ ...settings, refresh_interval_sec: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-white font-mono"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.demo_mode}
                  onChange={(e) => setSettings({ ...settings, demo_mode: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-white block">Enable Demo / Simulated Traffic Mode</span>
                  <span className="text-[10px] text-slate-500">Simulates real-time network flow packets automatically.</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Webhook & Telegram Notification Integration Section */}
        <div className="space-y-4 pt-2 border-t border-slate-800/80">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Bell size={16} className="text-cyan-400" />
            Real-Time SOAR Webhook & Telegram Bot Alert Dispatcher
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Slack / Teams Webhook URL</label>
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={settings.slack_webhook_url || ''}
                  onChange={(e) => setSettings({ ...settings, slack_webhook_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Discord Webhook URL</label>
                <input
                  type="url"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={settings.discord_webhook_url || ''}
                  onChange={(e) => setSettings({ ...settings, discord_webhook_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-purple-300 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Telegram Bot Token</label>
                <input
                  type="text"
                  placeholder="123456789:ABCdefGHIjklMNO..."
                  value={settings.telegram_bot_token || ''}
                  onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Telegram Target Chat ID</label>
                <input
                  type="text"
                  placeholder="-1001234567890 or @channel"
                  value={settings.telegram_chat_id || ''}
                  onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.webhook_enabled || false}
                  onChange={(e) => setSettings({ ...settings, webhook_enabled: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span className="font-semibold text-white">Enable Instant Dispatch for High/Critical Severity Alerts</span>
              </label>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await client.post('/notifications/test', {
                      telegram_bot_token: settings.telegram_bot_token,
                      telegram_chat_id: settings.telegram_chat_id,
                      provider: 'telegram'
                    });
                    setToast({ type: 'success', message: res.data.message });
                  } catch (err) {
                    setToast({ type: 'error', message: err.response?.data?.detail || 'Telegram test failed' });
                  }
                }}
                className="px-3.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-800/80 transition-colors"
              >
                Test Telegram Bot
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all border border-blue-400/30 flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Save size={16} />
                <span>Save System Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};



export default SettingsPage;
