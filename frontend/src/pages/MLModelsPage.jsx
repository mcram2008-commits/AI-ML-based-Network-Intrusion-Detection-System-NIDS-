import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Cpu, Play, CheckCircle2, Award, Activity, BarChart2, Trash2, RotateCcw } from 'lucide-react';
import ToastNotification from '../components/ToastNotification';
import AdversarialBenchWidget from '../components/AdversarialBenchWidget';

export const MLModelsPage = () => {

  const [models, setModels] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [selectedDatasetId, setSelectedDatasetId] = useState(0);
  const [algorithm, setAlgorithm] = useState('Random Forest');
  const [testSize, setTestSize] = useState(0.2);
  const [toast, setToast] = useState(null);

  const fetchData = async () => {
    try {
      const [resModels, resDatasets] = await Promise.all([
        client.get('/models'),
        client.get('/datasets')
      ]);
      setModels(resModels.data);
      setDatasets(resDatasets.data);
    } catch (err) {
      console.error("Fetch models error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTrain = async (e) => {
    e.preventDefault();
    setTraining(true);
    try {
      const res = await client.post('/models/train', {
        dataset_id: parseInt(selectedDatasetId),
        algorithm,
        test_size: parseFloat(testSize)
      });
      setToast({ type: 'success', message: `Model '${res.data.name}' trained with ${res.data.accuracy}% accuracy!` });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Model training failed';
      setToast({ type: 'error', message: msg });
    } finally {
      setTraining(false);
    }
  };

  const handleSelectActive = async (modelId) => {
    try {
      const res = await client.post(`/models/${modelId}/select-active`);
      setToast({ type: 'success', message: res.data.message });
      fetchData();
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to set active model' });
    }
  };

  const handleDeleteModel = async (modelId, modelName) => {
    if (!window.confirm(`Are you sure you want to remove model '${modelName}'?`)) {
      return;
    }
    setDeletingId(modelId);
    try {
      const res = await client.delete(`/models/${modelId}`);
      setToast({ type: 'success', message: res.data.message || 'Model deleted successfully' });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to delete model';
      setToast({ type: 'error', message: msg });
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetBaseModels = async () => {
    if (!window.confirm("This will clean up duplicate test models and re-seed 4 clean Base Benchmark Models (Random Forest, Gradient Boosting, MLP Neural Network, Hardened RF). Proceed?")) {
      return;
    }
    setResetting(true);
    try {
      const res = await client.post('/models/reset-clean-base-models');
      setToast({ type: 'success', message: res.data.message || 'Base models suite initialized!' });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to reset base models';
      setToast({ type: 'error', message: msg });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto w-full pb-10">
      <ToastNotification type={toast?.type} message={toast?.message} onClose={() => setToast(null)} />

      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Cpu size={18} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Machine Learning Model Suite & Trainer
          </h1>
        </div>
        <p className="text-slate-400 text-xs mt-1">Train & benchmark Random Forest, Decision Tree, Logistic Regression, SVM, Gradient Boosting, MLP Neural Network</p>
      </div>

      {/* Training Panel */}
      <div className="bezel-card p-6 space-y-4">
        <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Play size={15} className="text-emerald-400" />
          Train New ML Classification Model
        </h2>

        <form onSubmit={handleTrain} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Select Dataset</label>
            <select
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="w-full px-3 py-2 bg-[#06090F] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value={0}>Synthetic CICIDS2017 Sample (Default)</option>
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>{d.original_filename} ({d.num_records} rows)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">ML Algorithm</label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="w-full px-3 py-2 bg-[#06090F] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Random Forest">Random Forest Classifier</option>
              <option value="Decision Tree">Decision Tree Classifier</option>
              <option value="Logistic Regression">Logistic Regression</option>
              <option value="Support Vector Machine">Support Vector Machine (SVM)</option>
              <option value="Gradient Boosting">Gradient Boosting</option>
              <option value="MLP Neural Network">MLP Neural Network</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Test Split Ratio</label>
            <select
              value={testSize}
              onChange={(e) => setTestSize(e.target.value)}
              className="w-full px-3 py-2 bg-[#06090F] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value={0.2}>80% Train / 20% Test</option>
              <option value={0.3}>70% Train / 30% Test</option>
              <option value={0.15}>85% Train / 15% Test</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={training}
            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-lg transition-all border border-purple-400/30 flex items-center justify-center gap-2 shadow-sm"
          >
            {training ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Start Model Training'
            )}
          </button>
        </form>
      </div>

      {/* Adversarial ML & Model Hardening Suite */}
      <AdversarialBenchWidget onModelHardened={fetchData} />

      {/* Leaderboard Table */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Trained Model Performance Leaderboard ({models.length})</h2>
            <p className="text-xs text-slate-400">Production baseline models and custom-trained classifiers</p>
          </div>
          <button
            onClick={handleResetBaseModels}
            disabled={resetting}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors flex items-center gap-2"
            title="Clean duplicate models and re-seed 4 clean benchmark models"
          >
            <RotateCcw size={13} className={resetting ? 'animate-spin text-purple-400' : 'text-slate-400'} />
            {resetting ? 'Resetting Base Suite...' : 'Re-seed Base Benchmark Models'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {models.map((m) => (
            <div key={m.id} className={`bezel-card p-5 space-y-4 ${m.is_active ? 'border-purple-500/40 shadow-sm' : ''}`}>
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-white">{m.name}</h3>
                    {m.is_active && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono font-medium">
                        ACTIVE EVALUATION MODEL
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">Algorithm: {m.algorithm} • Dataset: {m.dataset_name}</div>
                </div>

                <div className="flex items-center gap-2">
                  {!m.is_active && (
                    <>
                      <button
                        onClick={() => handleSelectActive(m.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium border border-blue-400/30 transition-colors shadow-sm"
                      >
                        Set Active Model
                      </button>
                      {models.length > 1 && (
                        <button
                          onClick={() => handleDeleteModel(m.id, m.name)}
                          disabled={deletingId === m.id}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                          title="Delete this model"
                        >
                          <Trash2 size={14} className={deletingId === m.id ? 'animate-pulse' : ''} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Empirical Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-[#06090F] p-3.5 rounded-lg border border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Accuracy</span>
                  <span className="text-emerald-400 font-bold text-sm tabular-nums">{m.accuracy}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Precision</span>
                  <span className="text-blue-400 font-bold text-sm tabular-nums">{m.precision}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Recall</span>
                  <span className="text-purple-400 font-bold text-sm tabular-nums">{m.recall}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">F1 Score</span>
                  <span className="text-amber-400 font-bold text-sm tabular-nums">{m.f1_score}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ROC-AUC</span>
                  <span className="text-slate-200 font-bold text-sm tabular-nums">{m.roc_auc}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MLModelsPage;
