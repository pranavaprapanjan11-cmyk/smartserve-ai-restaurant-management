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
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center border-b border-[#E5E7EB] pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Gemini Vision Document Intelligence
          </h1>
          <p className="text-gray-500 mt-1 text-xs sm:text-sm">
            Upload menu photos, supplier invoices, or handwritten notes. Gemini Vision will analyze, classify, and extract structured items.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-xl border border-[#E5E7EB] self-start md:self-auto">
          <button
            onClick={() => setActiveTab('vision')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'vision'
                ? 'bg-[#0F6B4B] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            AI Vision Upload
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-[#0F6B4B] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
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
            <div className="p-6 rounded-xl bg-white border border-[#E5E7EB] shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Document Analyzer</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Supports JPG, PNG, WEBP, and PDF menu cards, receipts, and invoices.</p>
                </div>
                <span className="px-3 py-1 bg-[#0F6B4B]/10 border border-[#0F6B4B]/20 rounded-full text-xs font-bold text-[#0F6B4B]">
                  Gemini 2.5 Flash Vision
                </span>
              </div>

              {/* Drag and Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  file ? 'border-[#0F6B4B] bg-[#0F6B4B]/5' : 'border-gray-300 hover:border-[#0F6B4B]/60 hover:bg-gray-50'
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
                      <h4 className="font-bold text-sm text-gray-900">{file.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="text-xs text-red-600 font-semibold hover:underline"
                    >
                      Choose another file
                    </button>
                  </div>
                ) : (
                  <label htmlFor="vision-file-upload" className="cursor-pointer space-y-3 block">
                    <div className="h-12 w-12 mx-auto rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-xl text-gray-600">
                      📷
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">Drag & drop document photo or click to browse</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Automatic semantic classification (Menu vs Inventory)</p>
                    </div>
                  </label>
                )}
              </div>

              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Progress Indicator */}
              {isProcessing ? (
                <div className="p-5 bg-gray-50 rounded-xl border border-[#E5E7EB] space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-[#0F6B4B]">
                    <span>{processingStages[currentStageIndex]}</span>
                    <span>Stage {currentStageIndex + 1} of {processingStages.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
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
                      : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                  }`}
                >
                  Analyze with Gemini Vision
                </button>
              )}
            </div>
          </div>

          {/* Vision Capabilities Sidebar Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-xl bg-white border border-[#E5E7EB] shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-gray-900">Enterprise Vision Intelligence</h3>
              <ul className="space-y-3 text-xs text-gray-600">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#0F6B4B] font-bold">✓</span>
                  <span><strong>Automatic Intent Classification:</strong> Categorizes documents into Menu or Inventory automatically.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#0F6B4B] font-bold">✓</span>
                  <span><strong>Multilingual Extraction:</strong> Parses English, Tamil, and regional food item names accurately.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#0F6B4B] font-bold">✓</span>
                  <span><strong>Handwriting Support:</strong> Recognizes kitchen notes, price overrides, and handwritten specials.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#0F6B4B] font-bold">✓</span>
                  <span><strong>Structured Extraction:</strong> Formats prices, quantities, and categories into editable JSON tables.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* History & Telemetry Tab */
        <div className="p-6 rounded-xl bg-white border border-[#E5E7EB] shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs text-gray-500 font-semibold uppercase">Avg Accuracy</span>
              <p className="text-2xl font-extrabold text-[#0F6B4B] mt-1">{analytics?.avgAccuracy || 95}%</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs text-gray-500 font-semibold uppercase">Avg Response Time</span>
              <p className="text-2xl font-extrabold text-gray-900 mt-1">{analytics?.avgTimeMs || 1200} ms</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs text-gray-500 font-semibold uppercase">Total Documents Analyzed</span>
              <p className="text-2xl font-extrabold text-[#2FA36B] mt-1">{analytics?.totalImports || history.length}</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-[#E5E7EB] rounded-lg">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 uppercase text-[10px] tracking-wider text-gray-500 border-b border-[#E5E7EB]">
                <tr>
                  <th className="p-3">File ID</th>
                  <th className="p-3">Document Type</th>
                  <th className="p-3">Confidence</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-400">No import history logs available.</td>
                  </tr>
                ) : (
                  history.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono text-gray-600">{log.original_file_name}</td>
                      <td className="p-3 font-bold text-[#0F6B4B]">{log.import_type}</td>
                      <td className="p-3">{log.confidence_score}%</td>
                      <td className="p-3">{log.processing_time_ms} ms</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-[#0F6B4B] border border-emerald-200 text-[10px] font-bold">
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3 text-right text-gray-500">{new Date(log.created_at).toLocaleDateString()}</td>
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
