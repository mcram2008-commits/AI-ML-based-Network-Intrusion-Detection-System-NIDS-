import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { 
  Brain, X, ShieldAlert, CheckCircle, ArrowRight, 
  HelpCircle, Sparkles, TrendingUp, Cpu, Activity, RefreshCw 
} from 'lucide-react';

export const XaiExplanationModal = ({ flowData, flowId, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [xaiResult, setXaiResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setXaiResult(null);
      setError(null);
      return;
    }

    const fetchExplanation = async () => {
      setLoading(true);
      setError(null);
      try {
        let res;
        if (flowId) {
          res = await client.get(`/predict/explain/${flowId}`);
        } else if (flowData) {
          res = await client.post('/predict/explain', flowData);
        }
        if (res?.data) {
          setXaiResult(res.data);
        }
      } catch (err) {
        console.error("XAI Fetch error:", err);
        setError(err.response?.data?.detail || "Failed to compute Explainable AI attribution.");
      } finally {
        setLoading(false);
      }
    };

    fetchExplanation();
  }, [isOpen, flowId, flowData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bezel-card max-w-3xl w-full p-5 sm:p-7 shadow-2xl space-y-6 my-auto border border-purple-500/30 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-lg shadow-purple-500/20">
              <Brain size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Explainable AI (XAI) Decision Attribution
                </h3>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded font-mono">
                  SHAP / Tree-Attribution
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Transparent machine learning inspection: why the AI classifier made this verdict
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="animate-spin text-purple-400 mx-auto" size={32} />
            <p className="text-sm text-slate-300 font-mono">Computing feature attribution & decision weights...</p>
            <span className="text-xs text-slate-500">Evaluating tree split paths and baseline deviations</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
            {error}
          </div>
        ) : xaiResult ? (
          <div className="space-y-5">
            
            {/* Flow & Verdict Bar */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-400">Flow:</span>
                <span className="text-blue-400 font-semibold">{xaiResult.flow_metadata?.source_ip}</span>
                <ArrowRight size={12} className="text-slate-600" />
                <span className="text-slate-200">{xaiResult.flow_metadata?.destination_ip}:{xaiResult.flow_metadata?.destination_port}</span>
                <span className="text-[10px] text-slate-500">({xaiResult.flow_metadata?.protocol})</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">Verdict:</span>
                <span className={`px-2.5 py-0.5 rounded font-mono font-bold text-xs ${
                  xaiResult.flow_metadata?.attack_category in ['BENIGN', 'Normal']
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-red-500/20 text-red-300 border border-red-500/40'
                }`}>
                  {xaiResult.flow_metadata?.attack_category}
                </span>
                <span className="text-purple-300 font-mono text-xs">
                  {xaiResult.flow_metadata?.confidence}% Confidence
                </span>
              </div>
            </div>

            {/* AI Reasoning Narrative */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/30 to-blue-950/20 border border-purple-500/30 space-y-2">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                <Sparkles size={14} />
                <span>AI Classification Narrative (Natural Language Synthesis):</span>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed font-sans">
                {xaiResult.natural_language_explanation}
              </p>
            </div>

            {/* Feature Attribution Bar Chart */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-purple-400" />
                  Top Decision Contributing Features
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Relative Weight %</span>
              </div>

              <div className="space-y-2.5">
                {xaiResult.top_contributing_features?.map((f, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] flex items-center justify-center font-bold">
                          #{i+1}
                        </span>
                        {f.feature_name}
                      </span>
                      <span className="font-mono font-bold text-purple-400">
                        +{f.importance_percentage}%
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                        style={{ width: `${Math.min(100, f.importance_percentage * 2.5)}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Observed: <strong className="text-white">{Number(f.actual_value).toLocaleString()}</strong></span>
                      <span>Normal Baseline: <strong className="text-slate-300">{Number(f.baseline_value).toLocaleString()}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Counterfactual Reasoning */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px] uppercase tracking-wider">
                <HelpCircle size={13} />
                <span>Counterfactual Analysis (What would make this Benign?):</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed font-sans">
                {xaiResult.counterfactual_reasoning}
              </p>
            </div>

            {/* Model Info Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1.5">
                <Cpu size={12} />
                Evaluator: {xaiResult.model_type}
              </span>
              <span>Explainability Method: TreeAttribution v1.0</span>
            </div>

          </div>
        ) : null}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};

export default XaiExplanationModal;
