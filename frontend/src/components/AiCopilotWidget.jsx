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
    window.addEventListener('toggle-aegis-ai-copilot', handleGlobalToggle);
    return () => window.removeEventListener('toggle-aegis-ai-copilot', handleGlobalToggle);
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
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full shadow-2xl shadow-blue-500/30 border border-blue-400/40 flex items-center gap-2.5 transition-all transform hover:scale-105 group"
        >
          <div className="relative">
            <Bot size={22} className="group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
          </div>
          <span className="font-bold text-xs tracking-wide hidden sm:inline pr-1">Aegis AI Copilot</span>
        </button>
      )}

      {/* Slide-Up Chat Assistant Drawer */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[420px] h-[580px] max-h-[90vh] bg-[#090D16] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 border border-blue-400/40 flex items-center justify-center text-white">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm leading-tight flex items-center gap-1.5">
                  Aegis AI Copilot <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">ONLINE</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">SOC Threat Intelligence Assistant</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-slate-950/40 text-xs">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <span>{msg.sender === 'user' ? 'You' : 'Aegis AI'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/10'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800/80 rounded-bl-none shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* CLI Command Block */}
                  {msg.cli && (
                    <div className="mt-3 p-2.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-emerald-400 flex items-center justify-between gap-2 overflow-x-auto">
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
                        className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[10px] text-blue-300 hover:text-blue-200 transition-all font-mono"
                      >
                        ⚡ {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 font-mono text-xs p-2">
                <Sparkles className="animate-spin text-blue-400" size={16} />
                <span>Aegis AI is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Bar */}
          <div className="p-3 bg-slate-900/90 border-t border-slate-800">
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
                className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-xl transition-all shadow-md shadow-blue-600/20"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AiCopilotWidget;
