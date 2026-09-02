import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { X, Bot, ShieldAlert, CheckCircle2, ShieldCheck, Terminal, Sparkles, RefreshCw } from 'lucide-react';

export default function AiRemediationDrawer({ isOpen, onClose, alertData }) {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && alertData) {
      fetchAdvice();
    }
  }, [isOpen, alertData]);

  const fetchAdvice = async () => {
    try {
      setLoading(true);
      const res = await client.post('/advisor/remediation', {
        attack_type: alertData.attack_type || alertData.attack_category || 'DoS/DDoS',
        severity: alertData.severity || 'HIGH',
        source_ip: alertData.source_ip || '185.220.101.5',
        destination_ip: alertData.destination_ip || '10.0.0.1',
        confidence: alertData.confidence || 95.0
      });
      setAdvice(res.data);
    } catch (err) {
      console.warn('Backend API fallback for AI remediation advice:', err);
      const atk = (alertData.attack_type || 'DoS/DDoS').toUpperCase();
      const src = alertData.source_ip || '185.220.101.5';
      const dst = alertData.destination_ip || '10.0.0.1';

      setAdvice({
        attack_type: alertData.attack_type || 'DoS/DDoS',
        severity: alertData.severity || 'HIGH',
        threat_overview: `A high-volume Denial of Service attack stream originating from ${src} targeting ${dst}. Designed to exhaust web service bandwidth or server connection pools.`,
        risk_impact: 'Potential service interruption, web application slowdown, or server unresponsiveness for legitimate network users.',
        immediate_actions: [
          `Apply immediate rate-limiting or drop rules for ${src} at perimeter firewall.`,
          'Verify server CPU/Memory metrics and connection state tables.',
          'Activate Cloud DDoS protection or SYN flood protection cookies.'
        ],
        long_term_mitigation: [
          'Implement automated rate-limiting per source IP block.',
          'Deploy Web Application Firewall (WAF) with layer 7 flood filtering.',
          'Configure BGP Blackholing or Anycast scrubbing center routing.'
        ],
        recommended_firewall_command: `iptables -A INPUT -s ${src} -p tcp --dport 80 -m limit --limit 25/minute -j ACCEPT`
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  AI Threat Advisor <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                </h3>
                <p className="text-xs text-slate-400">Remediation playbook for <span className="text-purple-300 font-semibold">{alertData?.attack_type || 'Threat'}</span></p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
                <p className="text-sm">Synthesizing threat intelligence playbook...</p>
              </div>
            ) : advice ? (
              <>
                {/* Attack Overview Card */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Threat Overview</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      advice.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      advice.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {advice.severity} SEVERITY
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{advice.threat_overview}</p>
                </div>

                {/* Risk Impact */}
                <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-400">
                    <ShieldAlert className="w-4 h-4" /> Potential Impact
                  </div>
                  <p className="text-xs text-red-200/90 leading-relaxed">{advice.risk_impact}</p>
                </div>

                {/* Immediate Remediation Actions */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Immediate Response Playbook
                  </h4>
                  <div className="space-y-2">
                    {advice.immediate_actions.map((act, idx) => (
                      <div key={idx} className="flex items-start gap-3 bg-slate-950 border border-slate-800/80 p-3 rounded-xl">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-slate-200 leading-snug">{act}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Firewall Rule */}
                {advice.recommended_firewall_command && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-cyan-400" /> Recommended CLI Defense
                    </h4>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-cyan-300 break-all">
                      {advice.recommended_firewall_command}
                    </div>
                  </div>
                )}

                {/* Long term mitigation */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-400" /> Long-Term Hardening
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-xs text-slate-300">
                    {advice.long_term_mitigation.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400">No advice available for this alert.</p>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80">
            <button
              onClick={onClose}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
            >
              Done / Close Drawer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
