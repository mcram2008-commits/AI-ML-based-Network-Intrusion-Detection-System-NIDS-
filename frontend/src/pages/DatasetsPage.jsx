import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Database, Upload, CheckCircle2, AlertTriangle, Layers, Cpu } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ToastNotification from '../components/ToastNotification';

export const DatasetsPage = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchDatasets = async () => {
    try {
      const res = await client.get('/datasets');
      setDatasets(res.data);
    } catch (err) {
      console.error("Fetch datasets error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await client.post('/datasets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setToast({ type: 'success', message: `Dataset '${res.data.original_filename}' uploaded successfully!` });
      setFile(null);
      fetchDatasets();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Dataset upload failed';
      setToast({ type: 'error', message: msg });
    } finally {
      setUploading(false);
    }
  };

  const handlePreprocess = async (datasetId) => {
    try {
      const res = await client.post(`/datasets/${datasetId}/preprocess`);
      setToast({ type: 'success', message: res.data.message });
      fetchDatasets();
    } catch (err) {
      setToast({ type: 'error', message: 'Preprocessing failed' });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <ToastNotification type={toast?.type} message={toast?.message} onClose={() => setToast(null)} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Database className="text-blue-400" size={24} />
          NIDS Benchmark Datasets Manager
        </h1>
        <p className="text-slate-400 text-xs mt-1">Upload & preprocess CICIDS2017, CSE-CIC-IDS2018, UNSW-NB15 flow datasets for ML training</p>
      </div>

      {/* Upload Box */}
      <div className="glass-card p-6 rounded-xl border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Upload size={16} className="text-blue-400" />
          Upload Network Traffic Flow Dataset (CSV)
        </h2>

        <form onSubmit={handleUpload} className="flex flex-wrap items-center gap-4">
          <input
            type="file"
            accept=".csv,.txt"
            onChange={(e) => setFile(e.target.files[0])}
            className="text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
          />
          <button
            type="submit"
            disabled={!file || uploading}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors border border-blue-400/30 disabled:opacity-50 flex items-center gap-2"
          >
            {uploading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Upload & Parse Dataset'
            )}
          </button>
        </form>
      </div>

      {/* Uploaded Datasets Cards */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-white">Registered Datasets ({datasets.length})</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {datasets.map((ds) => {
            const pieData = [
              { name: 'Normal Traffic', value: ds.normal_count, color: '#10B981' },
              { name: 'Attack Traffic', value: ds.attack_count, color: '#EF4444' }
            ];

            return (
              <div key={ds.id} className="glass-card p-6 rounded-xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-white">{ds.original_filename}</h3>
                    <span className="text-[11px] text-slate-400 font-mono">Uploaded: {new Date(ds.uploaded_at).toLocaleString()}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${ds.is_preprocessed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'}`}>
                    {ds.is_preprocessed ? 'PREPROCESSED' : 'RAW UNCLEANED'}
                  </span>
                </div>

                {/* Stats Table */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Records</span>
                    <span className="text-white font-bold">{(ds.num_records ?? 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Features</span>
                    <span className="text-purple-400 font-bold">{ds.num_features}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Missing Values</span>
                    <span className={ds.missing_values > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{ds.missing_values}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Attack Ratio</span>
                    <span className="text-red-400 font-bold">{ds.attack_percentage}%</span>
                  </div>
                </div>

                {/* Pie Chart Distribution */}
                <div className="h-44 flex items-center justify-between">
                  <div className="w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4}>
                          {pieData.map((e, idx) => (
                            <Cell key={idx} fill={e.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#fff', fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/2 text-xs font-mono space-y-2">
                    <div>
                      <span className="text-emerald-400 font-semibold block">Normal Traffic:</span>
                      <span className="text-slate-300">{(ds.normal_count ?? 0).toLocaleString()} ({ds.normal_percentage}%)</span>
                    </div>
                    <div>
                      <span className="text-red-400 font-semibold block">Attack Traffic:</span>
                      <span className="text-slate-300">{(ds.attack_count ?? 0).toLocaleString()} ({ds.attack_percentage}%)</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handlePreprocess(ds.id)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Cpu size={14} />
                    <span>Run Data Preprocessing</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DatasetsPage;
