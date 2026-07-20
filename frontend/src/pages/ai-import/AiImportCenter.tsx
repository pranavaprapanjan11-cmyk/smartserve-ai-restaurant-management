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
  ocr_fallback_used: boolean;
  status: string;
  created_at: string;
}

interface ImportAnalytics {
  avgAccuracy: number;
  avgTimeMs: number;
  totalImports: number;
  ocrFallbackPercent: number;
}

const AiImportCenter: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'import'>('dashboard');
  const [importType, setImportType] = useState<'MENU' | 'INVENTORY' | 'PANTRY' | 'INVOICE' | 'HANDWRITTEN'>('MENU');
  
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);

  const [history, setHistory] = useState<ImportHistoryLog[]>([]);
  const [analytics, setAnalytics] = useState<ImportAnalytics | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token && activeTab === 'dashboard') {
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
      console.error('Failed to load import telemetry data', err);
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

  const startProcessing = async () => {
    if (!file || !token) return;
    setIsProcessing(true);
    setError(null);
    setProgressMessage('Pre-flight image quality check...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('importType', importType);

      // Simulate step-by-step progress update
      setTimeout(() => setProgressMessage('Uploading document...'), 800);
      setTimeout(() => setProgressMessage('Analyzing with Gemini Vision...'), 1800);
      setTimeout(() => setProgressMessage('Normalizing fields & resolving duplicates...'), 3200);

      const res = await fetch('/api/ai-import/process', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to analyze import');
      }

      const result = await res.json();
      setPreviewData(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred during import processing');
    } finally {
      setIsProcessing(false);
      setProgressMessage('');
    }
  };

  if (previewData) {
    return (
      <ImportPreview
        previewData={previewData}
        onCancel={() => {
          setPreviewData(null);
          setFile(null);
        }}
        onSuccess={() => {
          setPreviewData(null);
          setFile(null);
          setActiveTab('dashboard');
        }}
      />
    );
  }

  return (
    <div className="space-y-8 text-white">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            AI Smart Import Center
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Onboard menus, suppliers, and inventory lists in seconds using multimodal Gemini Vision.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-400/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'import'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-400/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            New Import
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-8">
          {/* Analytics Overview Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-white/5 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-xl">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Accuracy Rating</span>
              <h3 className="text-3xl font-extrabold mt-2 text-cyan-400">
                {analytics ? `${analytics.avgAccuracy}%` : '—'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Average confidence score of AI mappings</p>
            </div>
            <div className="rounded-3xl border border-white/5 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-xl">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Processing Time</span>
              <h3 className="text-3xl font-extrabold mt-2 text-purple-400">
                {analytics ? `${(analytics.avgTimeMs / 1000).toFixed(1)}s` : '—'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Average extraction duration</p>
            </div>
            <div className="rounded-3xl border border-white/5 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-xl">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">OCR Fallback Ratio</span>
              <h3 className="text-3xl font-extrabold mt-2 text-amber-400">
                {analytics ? `${analytics.ocrFallbackPercent}%` : '—'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Files processed via fallback engine</p>
            </div>
            <div className="rounded-3xl border border-white/5 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-xl">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Total Operations</span>
              <h3 className="text-3xl font-extrabold mt-2 text-emerald-400">
                {analytics ? analytics.totalImports : '—'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Structured document logs stored</p>
            </div>
          </div>

          {/* Recent Imports Log */}
          <div className="rounded-3xl border border-white/5 bg-slate-950/60 p-8 shadow-2xl backdrop-blur-xl">
            <h2 className="text-lg font-bold mb-6">Recent Import Transactions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 text-sm">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Filename</th>
                    <th className="pb-3">Confidence</th>
                    <th className="pb-3">Processing</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length > 0 ? (
                    history.map((log) => (
                      <tr key={log.id} className="border-b border-white/5 text-sm hover:bg-white/2 transition-colors">
                        <td className="py-4 text-slate-400">{new Date(log.created_at).toLocaleDateString()}</td>
                        <td className="py-4 font-semibold text-cyan-300">{log.import_type}</td>
                        <td className="py-4 text-slate-300">{log.original_file_name}</td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-lg text-xs ${
                            log.confidence_score >= 85 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-400/20' :
                            log.confidence_score >= 60 ? 'bg-amber-500/10 text-amber-400 border border-amber-400/20' :
                            'bg-red-500/10 text-red-400 border border-red-400/20'
                          }`}>
                            {log.confidence_score}%
                          </span>
                        </td>
                        <td className="py-4 text-slate-400">{(log.processing_time_ms / 1000).toFixed(1)}s</td>
                        <td className="py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400">
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No recent import logs found. Select 'New Import' to begin onboarding restaurant details.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Settings & Config Column */}
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-3xl border border-white/5 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-xl">
              <h3 className="text-md font-bold mb-4">Select Import Mode</h3>
              <div className="grid gap-2">
                {[
                  { id: 'MENU', label: 'Restaurant Menu', desc: 'Photos, PDFs, handwritten menu prints' },
                  { id: 'INVENTORY', label: 'Inventory Stock Sheet', desc: 'Inventory layout documents, excel tables' },
                  { id: 'INVOICE', label: 'Supplier Invoice', desc: 'Receipt sheets, bill printouts, invoice copies' },
                  { id: 'PANTRY', label: 'Pantry Shelf Scan', desc: 'Scan shelf inventory from kitchen camera' },
                  { id: 'HANDWRITTEN', label: 'Handwritten Stock Note', desc: 'Scanned notepad logs of daily updates' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setImportType(item.id as any);
                      setFile(null);
                    }}
                    className={`flex flex-col text-left p-4 rounded-2xl border transition-all ${
                      importType === item.id
                        ? 'bg-cyan-500/10 border-cyan-400/35 text-white'
                        : 'bg-slate-900/40 border-white/5 text-slate-400 hover:bg-slate-900/60 hover:text-white'
                    }`}
                  >
                    <span className="font-bold text-sm">{item.label}</span>
                    <span className="text-xs opacity-75 mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Upload Dropzone Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-white/5 bg-slate-950/60 p-8 shadow-2xl backdrop-blur-xl">
              <h3 className="text-md font-bold mb-6">Upload Document</h3>
              
              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl p-12 hover:border-cyan-500/50 transition-colors bg-slate-900/20 cursor-pointer relative"
              >
                <input
                  type="file"
                  id="import-file-upload"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isProcessing}
                />
                
                <svg className="h-12 w-12 text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>

                {file ? (
                  <div className="text-center">
                    <p className="font-bold text-sm text-cyan-400">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-bold text-sm">Drag and drop file here, or click to browse</p>
                    <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, WEBP, and PDF files up to 10MB</p>
                  </div>
                )}
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center gap-3">
                  <svg className="h-5 w-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-red-400 font-semibold">{error}</p>
                </div>
              )}

              {/* Progress status indicators */}
              {isProcessing && (
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{progressMessage}</span>
                    <span className="animate-pulse">Processing...</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-[pulse_1.5s_infinite] w-full rounded-full" />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 justify-end mt-8">
                <button
                  onClick={() => setFile(null)}
                  disabled={!file || isProcessing}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold transition border border-white/5 hover:bg-white/5 disabled:opacity-50"
                >
                  Clear
                </button>
                <button
                  onClick={startProcessing}
                  disabled={!file || isProcessing}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold transition bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 disabled:opacity-50"
                >
                  Begin AI Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiImportCenter;
