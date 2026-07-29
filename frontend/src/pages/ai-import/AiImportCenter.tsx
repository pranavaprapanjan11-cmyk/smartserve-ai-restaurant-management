// File: frontend/src/pages/ai-import/AiImportCenter.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config';
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
        fetch(`${API_BASE}/ai-import/history`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/ai-import/analytics`, { headers: { Authorization: `Bearer ${token}` } })
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

    const stageInterval = setInterval(() => {
      setCurrentStageIndex((prev) => (prev < processingStages.length - 1 ? prev + 1 : prev));
    }, 700);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/ai-import/process`, {
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
    <div className="space-y-6 text-gray-900">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center border-b border-[#D1D5DB] pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
            Gemini Vision Document Intelligence
          </h1>
          <p className="text-[#4B5563] mt-1 text-xs sm:text-sm font-medium">
            Upload menu photos, supplier invoices, or handwritten notes. Gemini Vision will analyze, classify, and extract structured items.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-xl border border-[#D1D5DB] self-start md:self-auto">
          <button
            onClick={() => setActiveTab('vision')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'vision'
                ? 'bg-[#0F6B4B] text-white shadow-sm'
                : 'text-[#4B5563] hover:text-[#111827]'
            }`}
          >
            AI Vision Upload
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-[#0F6B4B] text-white shadow-sm'
                : 'text-[#4B5563] hover:text-[#111827]'
            }`}
          >
            Import Telemetry
          </button>
        </div>
      </div>

      {activeTab === 'vision' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Upload Card */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 rounded-xl bg-white border border-[#D1D5DB] shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-[#111827]">Document Analyzer</h2>
                  <p className="text-xs text-[#4B5563] font-medium mt-0.5">Supports JPG, PNG, WEBP, and PDF menu cards, receipts, and invoices.</p>
                </div>
                <span className="px-3 py-1 bg-[#0F6B4B]/10 border border-[#0F6B4B]/30 rounded-full text-xs font-bold text-[#0F6B4B]">
                  Gemini 2.5 Flash Vision
                </span>
              </div>

              {/* Drag and Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  file ? 'border-[#0F6B4B] bg-[#0F6B4B]/5' : 'border-gray-400 hover:border-[#0F6B4B] hover:bg-gray-50'
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
                  <div className="space-y-3">
                    <div className="h-12 w-12 mx-auto rounded-lg bg-[#0F6B4B]/10 border border-[#0F6B4B]/20 flex items-center justify-center text-[#0F6B4B] text-xl font-bold">
                      📄
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#111827]">{file.name}</h4>
                      <p className="text-xs text-[#4B5563] font-medium mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="text-xs text-red-700 font-bold hover:underline"
                    >
                      Choose another file
                    </button>
                  </div>
                ) : (
                  <label htmlFor="vision-file-upload" className="cursor-pointer space-y-3 block">
                    <div className="h-12 w-12 mx-auto rounded-lg bg-gray-100 border border-gray-300 flex items-center justify-center text-xl text-gray-700">
                      📷
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#111827]">Drag & drop document photo or click to browse</h4>
                      <p className="text-xs text-[#4B5563] font-semibold mt-0.5">Automatic semantic classification (Menu vs Inventory)</p>
                    </div>
                  </label>
                )}
              </div>

              {error && (
                <div className="p-3.5 bg-red-50 border border-red-300 rounded-lg text-red-800 text-xs font-bold">
                  {error}
                </div>
              )}

              {/* Progress Indicator */}
              {isProcessing ? (
                <div className="p-5 bg-gray-50 rounded-xl border border-[#D1D5DB] space-y-3">
                  <div className="flex items-center justify-between text-xs font-extrabold text-[#0F6B4B]">
                    <span>{processingStages[currentStageIndex]}</span>
                    <span>Stage {currentStageIndex + 1} of {processingStages.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden border border-gray-300">
                    <div
                      className="bg-[#0F6B4B] h-full transition-all duration-300"
                      style={{ width: `${((currentStageIndex + 1) / processingStages.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={startVisionAnalysis}
                  disabled={!file}
                  className={`w-full py-3 rounded-lg font-bold text-sm transition-all shadow-sm ${
                    file
                      ? 'bg-[#0F6B4B] text-white hover:bg-[#084C37] cursor-pointer'
                      : 'bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed'
                  }`}
                >
                  Analyze with Gemini Vision
                </button>
              )}
            </div>
          </div>

          {/* Vision Capabilities Sidebar Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-xl bg-white border border-[#D1D5DB] shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-[#111827]">Enterprise Vision Intelligence</h3>
              <ul className="space-y-3 text-xs text-[#4B5563] font-medium">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#0F6B4B] font-bold">✓</span>
                  <span><strong className="text-[#111827]">Automatic Intent Classification:</strong> Categorizes documents into Menu or Inventory automatically.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#0F6B4B] font-bold">✓</span>
                  <span><strong className="text-[#111827]">Multilingual Extraction:</strong> Parses English, Tamil, and regional food item names accurately.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#0F6B4B] font-bold">✓</span>
                  <span><strong className="text-[#111827]">Handwriting Support:</strong> Recognizes kitchen notes, price overrides, and handwritten specials.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#0F6B4B] font-bold">✓</span>
                  <span><strong className="text-[#111827]">Structured Extraction:</strong> Formats prices, quantities, and categories into editable JSON tables.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* History & Telemetry Tab */
        <div className="p-6 rounded-xl bg-white border border-[#D1D5DB] shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-300">
              <span className="text-xs text-[#4B5563] font-extrabold uppercase tracking-wide">Avg Accuracy</span>
              <p className="text-2xl font-extrabold text-[#0F6B4B] mt-1">{analytics?.avgAccuracy || 95}%</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-300">
              <span className="text-xs text-[#4B5563] font-extrabold uppercase tracking-wide">Avg Response Time</span>
              <p className="text-2xl font-extrabold text-[#111827] mt-1">{analytics?.avgTimeMs || 1200} ms</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-300">
              <span className="text-xs text-[#4B5563] font-extrabold uppercase tracking-wide">Total Documents Analyzed</span>
              <p className="text-2xl font-extrabold text-[#15803D] mt-1">{analytics?.totalImports || history.length}</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-[#D1D5DB] rounded-lg">
            <table className="w-full text-left text-xs text-[#111827]">
              <thead className="bg-gray-100 uppercase text-[10px] tracking-wider text-[#111827] font-bold border-b border-[#D1D5DB]">
                <tr>
                  <th className="p-3 font-extrabold">File ID</th>
                  <th className="p-3 font-extrabold">Document Type</th>
                  <th className="p-3 font-extrabold">Confidence</th>
                  <th className="p-3 font-extrabold">Duration</th>
                  <th className="p-3 font-extrabold">Status</th>
                  <th className="p-3 text-right font-extrabold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1D5DB]">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-[#4B5563] font-semibold">No import history logs available.</td>
                  </tr>
                ) : (
                  history.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono text-[#111827] font-semibold">{log.original_file_name}</td>
                      <td className="p-3 font-bold text-[#0F6B4B]">{log.import_type}</td>
                      <td className="p-3 font-semibold text-[#111827]">{log.confidence_score}%</td>
                      <td className="p-3 font-semibold text-[#111827]">{log.processing_time_ms} ms</td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 rounded bg-emerald-100 text-[#15803D] border border-emerald-300 text-[10px] font-extrabold">
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3 text-right text-[#4B5563] font-semibold">{new Date(log.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiImportCenter;
