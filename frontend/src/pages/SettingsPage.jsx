import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { 
  Settings, Save, Shield, Cpu, RefreshCw, Bell, Send
} from 'lucide-react';
import ToastNotification from '../components/ToastNotification';

export const SettingsPage = () => {
  const [settings, setSettings] = useState({
    detection_threshold: 0.5,
    alert_threshold: 'MEDIUM',
    refresh_interval_sec: 3,
    demo_mode: true,
    slack_webhook_url: '',
    discord_webhook_url: '',
    telegram_bot_token: '',
    telegram_chat_id: '',
    webhook_enabled: false,
    min_severity_trigger: 'HIGH'
  });
  const [models, setModels] = useState([]);
  const [activeModelId, setActiveModelId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingProvider, setTestingProvider] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSettings, resModels, resNotifs] = await Promise.all([
        client.get('/settings'),
        client.get('/models'),
        client.get('/notifications/settings')
      ]);

      setSettings({
        detection_threshold: parseFloat(resSettings.data.detection_threshold || 0.5),
        alert_threshold: resSettings.data.alert_threshold || 'MEDIUM',
        refresh_interval_sec: parseInt(resSettings.data.refresh_interval_sec || 3),
        demo_mode: resSettings.data.demo_mode === 'true',
        slack_webhook_url: resNotifs.data.slack_webhook_url || '',
        discord_webhook_url: resNotifs.data.discord_webhook_url || '',
        telegram_bot_token: resNotifs.data.telegram_bot_token || '',
        telegram_chat_id: resNotifs.data.telegram_chat_id || '',
        webhook_enabled: !!resNotifs.data.webhook_enabled,
        min_severity_trigger: resNotifs.data.min_severity_trigger || 'HIGH'
      });

      setActiveModelId(resSettings.data.active_model_id || '1');
      setModels(resModels.data || []);
    } catch (err) {
      console.error("Fetch settings error:", err);
      setToast({ type: 'error', message: 'Failed to load system settings' });
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
      // 1. Update Core ML & Stream settings
      await client.put('/settings', {
        detection_threshold: settings.detection_threshold,
        alert_threshold: settings.alert_threshold,
        refresh_interval_sec: settings.refresh_interval_sec,
        demo_mode: settings.demo_mode,
        active_model_id: parseInt(activeModelId)
      });

      // 2. Update Notification Webhook & Telegram settings
      await client.post('/notifications/settings', {
        slack_webhook_url: settings.slack_webhook_url,
        discord_webhook_url: settings.discord_webhook_url,
        telegram_bot_token: settings.telegram_bot_token,
        telegram_chat_id: settings.telegram_chat_id,
        webhook_enabled: settings.webhook_enabled,
        min_severity_trigger: settings.min_severity_trigger
      });

      setToast({ type: 'success', message: 'System & Webhook settings updated and saved successfully!' });
      fetchData();
    } catch (err) {
      console.error("Save settings error:", err);
      setToast({ type: 'error', message: err.response?.data?.detail || 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async (provider) => {
    try {
      setTestingProvider(provider);
      let payload = { provider };

      if (provider === 'slack') {
        if (!settings.slack_webhook_url) {
          setToast({ type: 'error', message: 'Please enter a Slack / Webhook URL first' });
          return;
        }
        payload.webhook_url = settings.slack_webhook_url;
      } else if (provider === 'discord') {
        if (!settings.discord_webhook_url) {
          setToast({ type: 'error', message: 'Please enter a Discord Webhook URL first' });
          return;
        }
        payload.webhook_url = settings.discord_webhook_url;
      } else if (provider === 'telegram') {
        if (!settings.telegram_bot_token || !settings.telegram_chat_id) {
          setToast({ type: 'error', message: 'Please provide both Telegram Bot Token and Chat ID' });
          return;
        }
        payload.telegram_bot_token = settings.telegram_bot_token;
        payload.telegram_chat_id = settings.telegram_chat_id;
      }

      const res = await client.post('/notifications/test', payload);
      setToast({ type: 'success', message: res.data.message || `Test ${provider} notification dispatched!` });
    } catch (err) {
      console.error(`Test ${provider} error:`, err);
      setToast({ type: 'error', message: err.response?.data?.detail || `Failed to test ${provider} webhook` });
    } finally {
      setTestingProvider(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto w-full pb-10">
      <ToastNotification type={toast?.type} message={toast?.message} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Settings className="text-blue-400" size={24} />
            System Settings & SOAR Webhook Controls
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Global ML classification sensitivity, telemetry stream rate, and real-time SIEM/SOAR alert dispatchers
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
          title="Reload Settings"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bezel-card max-w-5xl p-6 sm:p-8 space-y-8 shadow-2xl">
        
        {/* Section 1: Active ML Model */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <Cpu size={16} className="text-purple-400" />
              1. Active Machine Learning Engine
            </h2>
            <span className="text-[11px] text-purple-300 font-mono bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">
              Inference Model
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary Detection Classifier</label>
            <select
              value={activeModelId}
              onChange={(e) => setActiveModelId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — Accuracy: {m.accuracy}% ({m.algorithm}) {m.is_active ? '★ Currently Active' : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1.5">
              The selected model will be evaluated against all incoming real-time network flow packets to predict normal vs malicious traffic.
            </p>
          </div>
        </div>

        {/* Section 2: Threat Threshold & Sensitivity */}
        <div className="space-y-4 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <Shield size={16} className="text-amber-400" />
              2. Threat Threshold & Sensitivity
            </h2>
            <span className="text-[11px] text-amber-300 font-mono bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
              Sensitivity & Severity
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Detection Confidence Sensitivity</label>
                <span className="text-blue-400 font-mono font-bold text-xs bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                  {settings.detection_threshold} ({Math.round(settings.detection_threshold * 100)}%)
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={settings.detection_threshold}
                onChange={(e) => setSettings({ ...settings, detection_threshold: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-[10px] text-slate-500 block leading-relaxed">
                • <strong>Lower (0.1 - 0.4)</strong>: High sensitivity (detects zero-days but more false positives).<br/>
                • <strong>Higher (0.6 - 0.9)</strong>: Strict mode (only alerts on high confidence attacks).
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Alert Trigger Minimum Severity</label>
              <select
                value={settings.alert_threshold}
                onChange={(e) => setSettings({ ...settings, alert_threshold: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="LOW">LOW (Trigger all suspicious flows)</option>
                <option value="MEDIUM">MEDIUM (Trigger Medium, High & Critical alerts)</option>
                <option value="HIGH">HIGH (Trigger High & Critical attacks only)</option>
                <option value="CRITICAL">CRITICAL (Trigger Emergency critical flows only)</option>
              </select>
              <span className="text-[10px] text-slate-500 block mt-1.5">
                Controls the minimum threat score required to generate an alert record in the Alerts table.
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Telemetry Stream Settings */}
        <div className="space-y-4 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <RefreshCw size={16} className="text-emerald-400" />
              3. Telemetry Stream & Simulation
            </h2>
            <span className="text-[11px] text-emerald-300 font-mono bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
              Polling & Sim
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Dashboard Polling Interval (Seconds)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={settings.refresh_interval_sec}
                onChange={(e) => setSettings({ ...settings, refresh_interval_sec: parseInt(e.target.value) || 3 })}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Rate at which charts and live flows poll the backend API for new updates.
              </span>
            </div>

            <div className="flex items-center pt-3">
              <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 w-full">
                <input
                  type="checkbox"
                  checked={settings.demo_mode}
                  onChange={(e) => setSettings({ ...settings, demo_mode: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-white block">Enable Demo / Simulated Traffic Mode</span>
                  <span className="text-[11px] text-slate-500">
                    Automatically generates synthetic network flow traffic when physical adapter sniffer is idle.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Section 4: Real-Time Webhook & Telegram Notification Dispatcher */}
        <div className="space-y-5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <Bell size={16} className="text-cyan-400" />
              4. Real-Time SOAR Webhook & Telegram Bot Alert Dispatcher
            </h2>
            <span className="text-[11px] text-cyan-300 font-mono bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded">
              SIEM / SOAR Push
            </span>
          </div>

          {/* Webhook Inputs */}
          <div className="space-y-4">
            {/* Slack / Teams / Generic Webhook */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Slack / Teams / Generic Webhook URL
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Format: https://hooks.slack.com/... or https://webhook.site/...</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/services/... or https://webhook.site/your-id"
                  value={settings.slack_webhook_url || ''}
                  onChange={(e) => setSettings({ ...settings, slack_webhook_url: e.target.value })}
                  className="flex-1 px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => handleTestNotification('slack')}
                  disabled={testingProvider === 'slack'}
                  className="px-3 py-2 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 text-xs font-semibold rounded-lg border border-cyan-800/80 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Send size={12} className={testingProvider === 'slack' ? 'animate-bounce' : ''} />
                  <span>{testingProvider === 'slack' ? 'Testing...' : 'Test Slack / URL'}</span>
                </button>
              </div>
            </div>

            {/* Discord Webhook */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Discord Channel Webhook URL
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Format: https://discord.com/api/webhooks/&lt;id&gt;/&lt;token&gt;</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://discord.com/api/webhooks/1234567890/abcdefghijk..."
                  value={settings.discord_webhook_url || ''}
                  onChange={(e) => setSettings({ ...settings, discord_webhook_url: e.target.value })}
                  className="flex-1 px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-purple-300 font-mono focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => handleTestNotification('discord')}
                  disabled={testingProvider === 'discord'}
                  className="px-3 py-2 bg-purple-950/80 hover:bg-purple-900 text-purple-300 text-xs font-semibold rounded-lg border border-purple-800/80 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Send size={12} className={testingProvider === 'discord' ? 'animate-bounce' : ''} />
                  <span>{testingProvider === 'discord' ? 'Testing...' : 'Test Discord'}</span>
                </button>
              </div>
            </div>

            {/* Telegram Bot Token & Chat ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Telegram Bot API Token
                </label>
                <input
                  type="text"
                  placeholder="123456789:ABCdefGHIjklMNOpqrs..."
                  value={settings.telegram_bot_token || ''}
                  onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Telegram Target Chat ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 987654321 or -1001234567890"
                    value={settings.telegram_chat_id || ''}
                    onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
                    className="flex-1 px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleTestNotification('telegram')}
                    disabled={testingProvider === 'telegram'}
                    className="px-3 py-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-800/80 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Send size={12} className={testingProvider === 'telegram' ? 'animate-bounce' : ''} />
                    <span>{testingProvider === 'telegram' ? 'Testing...' : 'Test Telegram'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Auto Dispatch Toggle & Severity */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800/90 rounded-xl flex flex-wrap items-center justify-between gap-4 mt-2">
              <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.webhook_enabled || false}
                  onChange={(e) => setSettings({ ...settings, webhook_enabled: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-white block">Enable Automatic Real-Time SOAR Webhook Dispatch</span>
                  <span className="text-[10px] text-slate-500">
                    Automatically push alerts to configured Slack, Discord, and Telegram whenever critical attacks occur.
                  </span>
                </div>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Trigger On:</span>
                <select
                  value={settings.min_severity_trigger || 'HIGH'}
                  onChange={(e) => setSettings({ ...settings, min_severity_trigger: e.target.value })}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                >
                  <option value="LOW">LOW, MEDIUM, HIGH, CRITICAL</option>
                  <option value="MEDIUM">MEDIUM, HIGH, CRITICAL</option>
                  <option value="HIGH">HIGH & CRITICAL Only</option>
                  <option value="CRITICAL">CRITICAL Emergency Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Save Button */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
          <span className="text-xs text-slate-500">
            Changes will take effect immediately across all background prediction engines.
          </span>

          <button
            type="submit"
            disabled={saving}
            className="group relative inline-flex items-center gap-2.5 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all border border-blue-400/30 shadow-lg shadow-blue-600/20 active:translate-y-px disabled:opacity-50"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center transition-colors group-hover:bg-white/20">
                  <Save size={13} />
                </span>
                <span>Save All System & Webhook Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
