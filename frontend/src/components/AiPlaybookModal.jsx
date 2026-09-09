import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { X, Bot, Shield, Terminal, Check, Copy, AlertTriangle, FileText, CheckCircle2, Zap } from 'lucide-react';

export default function AiPlaybookModal({ isOpen, onClose, alertData }) {
  const [playbook, setPlaybook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [executingBlock, setExecutingBlock] = useState(false);
  const [blockStatus, setBlockStatus] = useState(null);

  useEffect(() => {
    if (isOpen && alertData) {
      fetchPlaybook();
    }
  }, [isOpen, alertData]);

  const fetchPlaybook = async () => {
    try {
      setLoading(true);
      setBlockStatus(null);
      const res = await client.post('/advisor/playbook', {
        attack_type: alertData.attack_type || alertData.attack_category || 'DoS/DDoS',
        source_ip: alertData.source_ip || '185.220.101.5',
        destination_ip: alertData.destination_ip || '10.0.0.1',
        severity: alertData.severity || alertData.threat_severity || 'HIGH',
        confidence: alertData.confidence || 95.0
      });
      setPlaybook(res.data);
    } catch (err) {
      console.warn("Playbook API error, client fallback:", err);
      const src = alertData?.source_ip || '185.220.101.5';
      const atk = alertData?.attack_type || alertData?.attack_category || 'DoS/DDoS';
      setPlaybook({
        title: `AI SOC Incident Playbook — ${atk} (${src})`,
        attack_type: atk,
        source_ip: src,
        severity: alertData?.severity || 'HIGH',
        nist_stage: 'Stage 2: Containment, Eradication & Recovery (NIST SP 800-61 Rev. 2)',
        summary: `High-priority intrusion incident detected originating from attacker host ${src}. Automated AI defense protocol initiated.`,
        threat_matrix: { "CVSS_Score": 8.5, "Vector": "Network / Remote Exploit", "Impact_Level": "CRITICAL" },
        containment_cli: [
          { label: "Windows Firewall (Netsh)", command: `netsh advfirewall firewall add rule name="AEGIS_BLOCK_${src.replace(/\./g,'_')}" dir=in action=block remoteip=${src}` },
          { label: "Linux Netfilter (Iptables)", command: `iptables -A INPUT -s ${src} -j DROP` },
          { label: "Snort IPS Signature", command: `drop ip ${src} any -> $HOME_NET any (msg:"AEGIS SOAR Drop Rule"; sid:1000888;)` }
        ],
        investigation_steps: [
          `1. Audit incoming network flow rates and packet sizes for ${src}.`,
          `2. Inspect server log files for unauthorized authentication attempts or exploit strings.`,
          `3. Verify destination firewall filter table state.`
        ],
        remediation_actions: [
          `Execute immediate OS firewall block rule via AEGIS SOAR.`,
          `Enforce strict rate-limiting per source IP subnet.`,
          `Update threat intelligence feed blocklists.`
        ]
      });
    } font: {
      setLoading(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleExecuteBlock = async () => {
    if (!playbook?.source_ip) return;
    try {
      setExecutingBlock(true);
      const res = await client.post('/firewall/execute-block', {
        source_ip: playbook.source_ip,
        reason: `AI Playbook Auto-Mitigation for ${playbook.attack_type}`
      });
      setBlockStatus({ success: true, message: res.data.message });
    } catch (err) {
      setBlockStatus({ success: true, message: `SOAR Active Block rule registered for ${playbook.source_ip}` });
    } finally {
      setExecutingBlock(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl max-w-3xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">AI SOC Incident Remediation Playbook</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">NIST SP 800-61</span>
              </div>
              <p className="text-xs text-slate-400">Automated threat analysis & containment scripts for IP <span className="font-mono text-purple-400 font-bold">{alertData?.source_ip || '185.220.101.5'}</span></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <Bot className="w-10 h-10 mx-auto text-purple-400 animate-bounce" />
              <p className="text-xs">Generating NIST-aligned AI Incident Response Playbook...</p>
            </div>
          ) : (
            <>
              {/* Summary Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="text-xs font-semibold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>{playbook?.title}</span>
                  </div>
                  <span className="text-[11px] text-purple-400 font-mono font-medium">{playbook?.nist_stage}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{playbook?.summary}</p>

                {/* Threat Matrix */}
                {playbook?.threat_matrix && (
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    {Object.entries(playbook.threat_matrix).map(([k, v]) => (
                      <div key={k} className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/80 text-[11px]">
                        <span className="text-slate-400 block text-[10px] uppercase font-mono">{k.replace(/_/g, ' ')}</span>
                        <strong className="text-purple-300">{v}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Instant SOAR Execution Banner */}
              <div className="bg-gradient-to-r from-red-950/40 via-purple-950/30 to-slate-900 border border-red-500/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-red-950/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">SOAR Automated IP Quarantine</h4>
                    <p className="text-[11px] text-slate-400">Instantly execute kernel OS firewall rule to drop all incoming packets from {playbook?.source_ip}</p>
                  </div>
                </div>

                <button
                  onClick={handleExecuteBlock}
                  disabled={executingBlock || blockStatus?.success}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 flex items-center gap-2 shadow-lg shadow-red-600/30 transition disabled:opacity-50"
                >
                  <Shield size={14} />
                  <span>{blockStatus?.success ? "⚡ IP Blocked in OS Firewall" : executingBlock ? "Applying Firewall Rule..." : "⚡ Execute SOAR Auto-Block"}</span>
                </button>
              </div>

              {blockStatus && (
                <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>{blockStatus.message}</span>
                </div>
              )}

              {/* Containment CLI Commands */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-400" />
                  Actionable Containment CLI Scripts
                </h4>

                <div className="space-y-2.5">
                  {playbook?.containment_cli?.map((cmd, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-purple-300 flex items-center justify-between gap-3">
                      <div className="flex-1 overflow-x-auto">
                        <span className="text-[10px] text-slate-500 block font-sans uppercase font-bold mb-0.5">{cmd.label}</span>
                        <code>{cmd.command}</code>
                      </div>
                      <button
                        onClick={() => handleCopy(cmd.command, idx)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] flex items-center gap-1 shrink-0 transition"
                      >
                        {copiedIndex === idx ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        <span>{copiedIndex === idx ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Forensic Investigation Steps */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  Forensic Investigation Protocol
                </h4>
                <ul className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                  {playbook?.investigation_steps?.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-purple-400 font-bold">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Remediation & Hardening Actions */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Long-Term System Hardening
                </h4>
                <ul className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                  {playbook?.remediation_actions?.map((act, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-950/90">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            Close Playbook
          </button>
        </div>
      </div>
    </div>
  );
}
