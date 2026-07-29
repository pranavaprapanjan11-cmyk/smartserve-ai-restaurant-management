// File: frontend/src/pages/ai-import/AiImportCenter.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ImportPreview from './ImportPreview';

interface ImportHistoryLog {
  id: string;
  import_type: string;
  original_file_name: string;
  confidence_score: number;
  processing_time_ms: number;
  status: string;
  created_at: string;
}

interface ImportAnalytics {
  avgAccuracy: number;
  avgTimeMs: number;
  totalImports: number;
}

const AiImportCenter: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'vision' | 'history'>('vision');
  
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [previewData, setPreviewData] = useState<any>(null);

  const [history, setHistory] = useState<ImportHistoryLog[]>([]);
  const [analytics, setAnalytics] = useState<ImportAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processingStages = [
    'Uploading Document',
    'Understanding Document',
    'Analyzing Context',
    'Classifying Document',
    'Extracting Structured Data',
    'Preparing Import'
  ];

  useEffect(() => {
    if (token && activeTab === 'history') {
      fetchHistoryAndAnalytics();
    }
  }, [token, activeTab]);

  const fetchHistoryAndAnalytics = async () => {
    try {
      const [histRes, analRes] = await Promise.all([
        fetch('/api/ai-import/history', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/ai-import/analytics', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (histRes.ok) setHistory(await histRes.json());
      if (analRes.ok) setAnalytics(await analRes.json());
    } catch (err) {
      console.error('Failed to load import history', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const startVisionAnalysis = async () => {
    if (!file || !token) return;
    setIsProcessing(true);
    setError(null);
    setCurrentStageIndex(0);

    // Simulate progressive processing stages
    const stageInterval = setInterval(() => {
      setCurrentStageIndex((prev) => (prev < processingStages.length - 1 ? prev + 1 : prev));
    }, 700);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/ai-import/process', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const responseText = await res.text();
      let result: any = null;
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (parseErr) {
        console.error('[Vision API] Non-JSON server response:', responseText);
        throw new Error(`Server returned unexpected response (${res.status}): ${responseText.substring(0, 120) || 'Empty response'}`);
      }

      if (!res.ok) {
        throw new Error(result.error || result.message || `Vision API error (${res.status})`);
      }

      setPreviewData(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred during Gemini Vision analysis.');
    } finally {
      clearInterval(stageInterval);
      setIsProcessing(false);
    }
  };

  if (previewData) {
    return (
      <ImportPreview
        previewData={previewData}
        file={file}
        onCancel={() => {
          setPreviewData(null);
          setFile(null);
        }}
        onSuccess={() => {
          setPreviewData(null);
          setFile(null);
          setActiveTab('history');
        }}
      />
    );
  }

  return (
    <div className="space-y-8 text-white">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Gemini Vision Understanding
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            AI-first document intelligence. Upload any menu or supplier invoice and Gemini 2.5 Flash will automatically understand, classify, and extract it.
          </p>
        </div>

        <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl">
          <button
            onClick={() => setActiveTab('vision')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'vision'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-400/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AI Vision Upload
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-400/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Import Telemetry
          </button>
        </div>
      </div>

      {activeTab === 'vision' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Upload Card */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Document Analyzer</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Supports JPG, PNG, WEBP, and PDF menu cards, receipts, and invoices.</p>
                </div>
                <span className="px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 rounded-full text-xs font-bold text-cyan-300">
                  Gemini 2.5 Flash Vision
                </span>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
                  file ? 'border-cyan-400 bg-cyan-500/5' : 'border-white/10 hover:border-cyan-500/40 hover:bg-slate-950/50'
                }`}
              >
                <input
                  type="file"
                  id="vision-file-upload"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                />

                {file ? (
                  <div className="space-y-4">
                    <div className="h-16 w-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 text-2xl font-bold">
                      📄
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-white">{file.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Choose another file
                    </button>
                  </div>
                ) : (
                  <label htmlFor="vision-file-upload" className="cursor-pointer space-y-4 block">
                    <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-3xl">
                      📷
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-white">Drag & drop document photo or click to browse</h4>
                      <p className="text-xs text-slate-400 mt-1">Automatic semantic classification (Menu vs Inventory)</p>
                    </div>
                  </label>
                )}
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Action Button & Processing Stages */}
              {isProcessing ? (
                <div className="p-6 bg-slate-950/80 rounded-2xl border border-cyan-500/30 space-y-4">
                  <div className="flex items-center justify-between text-sm font-bold text-cyan-400">
                    <span>{processingStages[currentStageIndex]}</span>
                    <span>Stage {currentStageIndex + 1} of {processingStages.length}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full transition-all duration-500"
                      style={{ width: `${((currentStageIndex + 1) / processingStages.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={startVisionAnalysis}
                  disabled={!file}
                  className={`w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-lg ${
                    file
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:opacity-90 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Analyze with Gemini Vision
                </button>
              )}
            </div>
          </div>

          {/* Capabilities Info Side Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-4">
              <h3 className="font-bold text-base text-white">Multimodal Vision Intelligence</h3>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>Automatic Classification:</strong> Decides whether document is Menu or Inventory without manual tagging.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>Multilingual OCR:</strong> Parses Tamil, English, and transliterated food names cleanly.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>Handwriting Recognition:</strong> Reads kitchen scribbles, price revisions, and handwritten notes.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>Table & Price Understanding:</strong> Extracts prices, quantities, and units into structured JSON.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* History & Telemetry Tab */
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5">
              <span className="text-xs text-slate-400 font-bold">Avg Accuracy</span>
              <p className="text-2xl font-extrabold text-cyan-400 mt-1">{analytics?.avgAccuracy || 95}%</p>
            </div>
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5">
              <span className="text-xs text-slate-400 font-bold">Avg Response Time</span>
              <p className="text-2xl font-extrabold text-purple-400 mt-1">{analytics?.avgTimeMs || 1200} ms</p>
            </div>
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5">
              <span className="text-xs text-slate-400 font-bold">Total Documents Analyzed</span>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">{analytics?.totalImports || history.length}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/50 uppercase text-[10px] tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="p-3">File ID</th>
                  <th className="p-3">Document Type</th>
                  <th className="p-3">Confidence</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-mono text-slate-400">{log.original_file_name}</td>
                    <td className="p-3 font-bold text-cyan-300">{log.import_type}</td>
                    <td className="p-3">{log.confidence_score}%</td>
                    <td className="p-3">{log.processing_time_ms} ms</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-400">{new Date(log.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiImportCenter;
