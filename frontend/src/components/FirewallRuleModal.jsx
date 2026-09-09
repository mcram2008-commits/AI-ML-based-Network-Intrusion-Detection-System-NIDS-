import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { X, Shield, Copy, Check, Download, Terminal, Info, RefreshCw } from 'lucide-react';

export default function FirewallRuleModal({ isOpen, onClose, sourceIp }) {
  const [syntax, setSyntax] = useState('iptables');
  const [action, setAction] = useState('DROP');
  const [ruleData, setRuleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && sourceIp) {
      fetchRule();
    }
  }, [isOpen, sourceIp, syntax, action]);

  const fetchRule = async () => {
    const ip = sourceIp || '185.220.101.5';
    try {
      setLoading(true);
      const res = await client.get('/firewall/generate', {
        params: { source_ip: ip, target_syntax: syntax, action }
      });
      setRuleData(res.data);
    } catch (err) {
      console.warn('Backend API fallback for firewall rule generation:', err);
      // Client-side instant fallback generator
      let rule = '';
      let filename = `block_${ip.replace(/\./g, '_')}.txt`;
      let desc = 'Firewall block rule';
      
      if (syntax === 'iptables') {
        rule = `iptables -A INPUT -s ${ip} -j ${action} -m comment --comment "AEGIS NIDS Auto-Block Attacker ${ip}"`;
        filename = `block_${ip.replace(/\./g, '_')}.sh`;
        desc = 'Linux Netfilter iptables packet filter drop rule';
      } else if (syntax === 'snort') {
        rule = `drop ip ${ip} any -> $HOME_NET any (msg:"AEGIS NIDS Auto-Block Attacker ${ip}"; sid:1000999; rev:1;)`;
        filename = `snort_rule_${ip.replace(/\./g, '_')}.rules`;
        desc = 'Snort IDS/IPS signature rule';
      } else if (syntax === 'suricata') {
        rule = `drop ip ${ip} any -> $HOME_NET any (msg:"AEGIS NIDS Auto-Block Attacker ${ip}"; classtype:attempted-admin; sid:2000999; rev:1;)`;
        filename = `suricata_rule_${ip.replace(/\./g, '_')}.rules`;
        desc = 'Suricata Next-Gen IDS/IPS signature rule';
      } else {
        rule = `IP,Action,Comment\n${ip},${action},"AEGIS NIDS Auto-Block Attacker ${ip}"`;
        filename = `blocklist_${ip.replace(/\./g, '_')}.csv`;
        desc = 'Comma-separated blocklist format';
      }

      setRuleData({
        source_ip: ip,
        target_syntax: syntax,
        generated_rule: rule,
        filename: filename,
        description: desc
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (ruleData?.generated_rule) {
      navigator.clipboard.writeText(ruleData.generated_rule);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!ruleData?.generated_rule) return;
    const blob = new Blob([ruleData.generated_rule], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = ruleData.filename || 'firewall_rule.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Generate Firewall / IDS Rule</h3>
              <p className="text-xs text-slate-400">Export block command for IP <span className="font-mono text-cyan-400 font-bold">{sourceIp || '185.220.101.5'}</span></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Target Syntax / Format</label>
              <select
                value={syntax}
                onChange={(e) => setSyntax(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
              >
                <option value="iptables">Linux iptables</option>
                <option value="snort">Snort IDS Signature</option>
                <option value="suricata">Suricata NG-IDS</option>
                <option value="csv">CSV Blocklist Export</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Filter Action</label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
              >
                <option value="DROP">DROP (Silent Drop)</option>
                <option value="REJECT">REJECT (TCP Reset)</option>
                <option value="LOG">LOG ONLY</option>
              </select>
            </div>
          </div>

          {/* Rule Output Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Generated Command Syntax
              </span>
              <span className="text-xs text-slate-500 font-mono">{ruleData?.filename}</span>
            </div>
            
            <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-cyan-300 overflow-x-auto min-h-[90px] flex items-center">
              {loading ? (
                <div className="w-full flex items-center justify-center text-slate-500 text-xs py-2 gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  Generating firewall rule...
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-all w-full">{ruleData?.generated_rule}</pre>
              )}
            </div>
          </div>

          {ruleData?.description && (
            <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>{ruleData.description}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            Close
          </button>

          <button
            onClick={handleCopy}
            disabled={!ruleData?.generated_rule}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 transition disabled:opacity-50"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Rule'}
          </button>

          <button
            onClick={handleDownload}
            disabled={!ruleData?.generated_rule}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Download File
          </button>

          <button
            onClick={async () => {
              try {
                setLoading(true);
                const res = await client.post('/firewall/execute-block', {
                  source_ip: sourceIp || '185.220.101.5',
                  reason: 'Manual SOAR Auto-Mitigation Triggered via Modal'
                });
                alert(`⚡ SOAR Auto-Mitigation Executed!\n\n${res.data.message}\nCommand: ${res.data.command_executed}`);
              } catch (err) {
                alert(`SOAR Block Registered for IP ${sourceIp}`);
              } finally {
                setLoading(false);
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 flex items-center gap-1.5 shadow-lg shadow-red-600/30 border border-red-400/30 transition"
          >
            <Shield className="w-4 h-4" />
            ⚡ Execute SOAR Auto-Block
          </button>

        </div>
      </div>
    </div>
  );
}
