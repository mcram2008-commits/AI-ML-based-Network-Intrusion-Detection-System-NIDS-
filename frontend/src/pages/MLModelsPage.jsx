import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Cpu, Play, CheckCircle2, Award, Activity, BarChart2 } from 'lucide-react';
import ToastNotification from '../components/ToastNotification';
import AdversarialBenchWidget from '../components/AdversarialBenchWidget';

export const MLModelsPage = () => {

  const [models, setModels] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);

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

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <ToastNotification type={toast?.type} message={toast?.message} onClose={() => setToast(null)} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Cpu className="text-purple-400" size={24} />
          Machine Learning Model Suite & Trainer
        </h1>
        <p className="text-slate-400 text-xs mt-1">Train & benchmark Random Forest, Decision Tree, Logistic Regression, SVM, Gradient Boosting, MLP Neural Network</p>
      </div>

      {/* Training Panel */}
      <div className="glass-card p-6 rounded-xl border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Play size={16} className="text-emerald-400" />
          Train New ML Classification Model
        </h2>

        <form onSubmit={handleTrain} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Select Dataset</label>
            <select
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white focus:outline-none"
            >
              <option value={0}>Synthetic CICIDS2017 Sample (Default)</option>
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>{d.original_filename} ({d.num_records} rows)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">ML Algorithm</label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white focus:outline-none"
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
            <label className="block text-xs font-semibold text-slate-400 mb-1">Test Split Ratio</label>
            <select
              value={testSize}
              onChange={(e) => setTestSize(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white focus:outline-none"
            >
              <option value={0.2}>80% Train / 20% Test</option>
              <option value={0.3}>70% Train / 30% Test</option>
              <option value={0.15}>85% Train / 15% Test</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={training}
            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-lg transition-all border border-purple-400/30 flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
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
        <h2 className="text-lg font-bold text-white">Trained Model Performance Leaderboard ({models.length})</h2>

        <div className="grid grid-cols-1 gap-6">
          {models.map((m) => (
            <div key={m.id} className={`glass-card p-6 rounded-xl border ${m.is_active ? 'border-purple-500/50 shadow-purple-500/10 shadow-xl' : 'border-slate-800'} space-y-4`}>
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-white">{m.name}</h3>
                    {m.is_active && (
                      <span className="px-2.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono font-bold">
                        ACTIVE EVALUATION MODEL
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">Algorithm: {m.algorithm} • Dataset: {m.dataset_name}</div>
                </div>

                {!m.is_active && (
                  <button
                    onClick={() => handleSelectActive(m.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold border border-blue-400/30 transition-colors"
                  >
                    Set Active Model
                  </button>
                )}
              </div>

              {/* Empirical Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-950/60 p-4 rounded-lg border border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Accuracy</span>
                  <span className="text-emerald-400 font-extrabold text-base">{m.accuracy}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Precision</span>
                  <span className="text-blue-400 font-extrabold text-base">{m.precision}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Recall</span>
                  <span className="text-purple-400 font-extrabold text-base">{m.recall}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">F1 Score</span>
                  <span className="text-amber-400 font-extrabold text-base">{m.f1_score}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ROC-AUC</span>
                  <span className="text-slate-200 font-extrabold text-base">{m.roc_auc}%</span>
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
