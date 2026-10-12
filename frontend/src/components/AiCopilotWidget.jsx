import React, { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import {
  Bot, Send, X, Sparkles, Terminal, Copy, Check, MessageSquare, ChevronDown, RefreshCw
} from 'lucide-react';

export const AiCopilotWidget = ({ isOpenExternal, onCloseExternal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      text: "Hello Analyst! I am **Aegis AI Copilot**, your 24/7 SOC Security Assistant. Ask me anything about network threats, ML models, IP investigations, or firewall mitigation rules.",
      prompts: [
        "Investigate IP 185.220.101.5",
        "Explain DoS attack mitigation",
        "View ML model accuracy",
        "How does Smart Route Finder work?"
      ],
      cli: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpenExternal !== undefined) {
      setIsOpen(isOpenExternal);
    }
  }, [isOpenExternal]);

  useEffect(() => {
    const handleGlobalToggle = () => setIsOpen((prev) => !prev);
    const handleOpenWithQuery = (e) => {
      setIsOpen(true);
      if (e.detail && e.detail.query) {
        handleSend(e.detail.query);
      }
    };
    window.addEventListener('toggle-aegis-ai-copilot', handleGlobalToggle);
    window.addEventListener('open-aegis-ai-copilot', handleOpenWithQuery);
    return () => {
      window.removeEventListener('toggle-aegis-ai-copilot', handleGlobalToggle);
      window.removeEventListener('open-aegis-ai-copilot', handleOpenWithQuery);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isOpen]);

  const handleSend = async (messageText) => {
    const query = messageText || inputMessage;
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
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        sender: 'ai',
        text: "I experienced a temporary connection issue. Please make sure the backend server is online.",
        prompts: ["Try again", "Explain DoS attack mitigation"],
        cli: null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCli = (cliText, index) => {
    navigator.clipboard.writeText(cliText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onCloseExternal) onCloseExternal();
  };

  return (
    <>
      {/* Floating Launcher Button - Precision Obsidian Style */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-2.5 bg-[#0B0F19] hover:bg-slate-900 text-slate-100 rounded-full shadow-2xl border border-slate-700/80 hover:border-blue-500/50 flex items-center gap-2.5 transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
            <Bot size={17} />
          </div>
          <span className="font-semibold text-xs tracking-wide hidden sm:inline pr-2 text-slate-200">Aegis AI Copilot</span>
        </button>
      )}

      {/* Slide-Up Chat Assistant Drawer */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[420px] h-[580px] max-h-[90vh] bg-[#0B0F19] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="px-4 py-3 bg-[#06090F] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-semibold text-white text-xs leading-tight flex items-center gap-1.5">
                  Aegis AI Copilot <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">ONLINE</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">SOC Threat Intelligence Assistant</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[#070A12] text-xs">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <span>{msg.sender === 'user' ? 'You' : 'Aegis AI'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`p-3.5 rounded-xl max-w-[88%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                      : 'bg-[#101626] text-slate-200 border border-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-line text-xs">{msg.text}</p>

                  {/* CLI Command Block */}
                  {msg.cli && (
                    <div className="mt-3 p-2.5 bg-[#06090F] border border-slate-800 rounded-lg font-mono text-[11px] text-emerald-400 flex items-center justify-between gap-2 overflow-x-auto">
                      <div className="flex items-center gap-2 truncate">
                        <Terminal size={14} className="text-slate-500 flex-shrink-0" />
                        <span className="truncate">{msg.cli}</span>
                      </div>
                      <button
                        onClick={() => handleCopyCli(msg.cli, idx)}
                        className="text-slate-400 hover:text-white flex-shrink-0 p-1 hover:bg-slate-800 rounded"
                        title="Copy Command"
                      >
                        {copiedIndex === idx ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Suggested Prompts */}
                {msg.prompts && msg.prompts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 max-w-[88%]">
                    {msg.prompts.map((p, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handleSend(p)}
                        className="px-2.5 py-1 rounded-md bg-[#101626] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[10px] text-blue-300 hover:text-blue-200 transition-all font-mono"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 font-mono text-xs p-2">
                <Sparkles className="animate-spin text-blue-400" size={14} />
                <span>Aegis AI is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Bar */}
          <div className="p-3 bg-[#0B0F19] border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask Aegis AI about threats, IPs, ML models..."
                className="flex-1 px-3.5 py-2 bg-[#06090F] border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-lg transition-all shadow-md shadow-blue-600/20"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AiCopilotWidget;
