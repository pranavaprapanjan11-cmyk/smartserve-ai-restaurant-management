// File: frontend/src/pages/ai-import/ImportPreview.tsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface ImportPreviewProps {
  previewData: {
    fileId: string;
    importType: 'MENU' | 'INVENTORY' | 'PANTRY' | 'INVOICE' | 'HANDWRITTEN';
    extractedData: any;
    confidence: number;
    ocrFallback: boolean;
    durationMs: number;
    imageQuality: {
      blur: 'POOR' | 'OK' | 'GOOD';
      brightness: 'DARK' | 'OK' | 'BRIGHT';
      cropped: boolean;
      resolution: 'LOW' | 'OK' | 'HIGH';
      isAcceptable: boolean;
    };
    duplicates: {
      name: string;
      existingName: string;
      similarity: number;
      matchType: 'EXACT' | 'FUZZY' | 'NONE';
      actionSuggested: 'MERGE' | 'REPLACE' | 'NEW' | 'IGNORE';
    }[];
    validations: {
      field: string;
      message: string;
      severity: 'WARNING' | 'ERROR';
    }[];
  };
  file: File | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const ImportPreview: React.FC<ImportPreviewProps> = ({ previewData, file, onCancel, onSuccess }) => {
  const { token } = useAuth();
  const [data, setData] = useState(previewData.extractedData);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Local Object URL for original document preview
  const [imageUrl] = useState(() => file ? URL.createObjectURL(file) : null);

  // Helper for inline item editing
  const handleItemFieldChange = (index: number, field: string, value: any) => {
    const updated = { ...data };
    if (previewData.importType === 'INVOICE') {
      updated.products[index][field] = value;
      // recalculate total amount
      if (field === 'price' || field === 'quantity') {
        const p = updated.products[index];
        p.total = Number((p.price * p.quantity).toFixed(2));
        updated.total_amount = updated.products.reduce((acc: number, item: any) => acc + (item.total || 0), 0);
      }
    } else {
      updated.items[index][field] = value;
    }
    setData(updated);
  };

  const handleInvoiceFieldChange = (field: string, value: any) => {
    setData({
      ...data,
      [field]: value
    });
  };

  const confirmImport = async () => {
    if (!token) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const res = await fetch('/api/ai-import/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          importType: previewData.importType,
          data,
          fileId: previewData.fileId,
          durationMs: previewData.durationMs,
          ocrFallback: previewData.ocrFallback
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save imported details.');
      }

      onSuccess();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save import.');
    } finally {
      setIsSaving(false);
    }
  };

  const getConfidenceBadgeColor = (conf: number) => {
    if (conf >= 85) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-400/20';
    if (conf >= 60) return 'bg-amber-500/10 text-amber-400 border border-amber-400/20';
    return 'bg-red-500/10 text-red-400 border border-red-400/20';
  };

  const itemsList = previewData.importType === 'INVOICE' ? data.products || [] : data.items || [];

  return (
    <div className="space-y-8 text-white">
      {/* Header Actions */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Review & Confirm Import</h1>
          <p className="text-slate-400 text-sm mt-1">
            Review Gemini classifications, duplicate detection warnings, and confidence analytics.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold transition border border-white/5 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={confirmImport}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold transition bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 flex items-center gap-2"
          >
            {isSaving ? 'Saving...' : 'Confirm & Save'}
          </button>
        </div>
      </div>

      {/* Pre-flight image quality warning */}
      {!previewData.imageQuality.isAcceptable && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-start gap-3">
          <svg className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h4 className="font-bold text-red-400 text-sm">Poor Image Quality Detected</h4>
            <p className="text-xs text-red-400/80 mt-1">
              The uploaded file size or resolution is extremely low. If the extraction results are incorrect or missing fields, consider retaking the photo with better lighting or crop.
            </p>
          </div>
        </div>
      )}

      {/* Warning/Error messages */}
      {saveError && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-400 text-sm font-semibold">
          {saveError}
        </div>
      )}

      {/* OCR Fallback Warning */}
      {previewData.ocrFallback && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-start gap-3">
          <svg className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-amber-400/85">
            Gemini Vision processing hit a low confidence threshold. Running OCR-first extraction fallback and merging outputs.
          </p>
        </div>
      )}

      {/* Side-by-side layout: Left: Original document, Right: Data fields and warnings */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Column: Original Image Preview (Sticky layout) */}
        <div className="lg:col-span-4 sticky top-24 rounded-3xl border border-white/5 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-300">Original Document Preview</h3>
          <div className="w-full aspect-[3/4] bg-slate-900/50 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              file?.type === 'application/pdf' ? (
                <div className="text-center p-6 space-y-3">
                  <svg className="h-12 w-12 text-cyan-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs text-slate-300 font-semibold">{file.name}</p>
                  <p className="text-3xs text-slate-500 font-medium">PDF Documents are parsed directly by text extraction streams.</p>
                </div>
              ) : (
                <img
                  src={imageUrl}
                  alt="Original Import Document"
                  className="w-full h-full object-contain"
                />
              )
            ) : (
              <span className="text-slate-500 text-xs">No preview image available</span>
            )}
          </div>
        </div>

        {/* Right Columns: Forms & Alerts */}
        <div className="lg:col-span-8 grid gap-8 md:grid-cols-3">
          {/* Data Grid Form */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-3xl border border-white/5 bg-slate-950/60 p-8 shadow-2xl backdrop-blur-xl space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Detected Objects ({itemsList.length})</h2>
                <span className={`px-3 py-1 rounded-xl text-xs font-semibold ${getConfidenceBadgeColor(previewData.confidence)}`}>
                  Avg Confidence: {previewData.confidence}%
                </span>
              </div>

              {/* If import is Supplier Invoice, show invoice headers */}
              {previewData.importType === 'INVOICE' && (
                <div className="grid gap-4 sm:grid-cols-3 p-4 bg-white/2 rounded-2xl border border-white/5">
                  <div>
                    <label className="text-2xs text-slate-500 font-bold uppercase">Supplier</label>
                    <input
                      type="text"
                      value={data.supplier || ''}
                      onChange={(e) => handleInvoiceFieldChange('supplier', e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm mt-1 focus:border-cyan-500/50 outline-none"
                  />
                  </div>
                  <div>
                    <label className="text-2xs text-slate-500 font-bold uppercase">Invoice Number</label>
                    <input
                      type="text"
                      value={data.invoice_number || ''}
                      onChange={(e) => handleInvoiceFieldChange('invoice_number', e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm mt-1 focus:border-cyan-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-2xs text-slate-500 font-bold uppercase">Total Amount</label>
                    <input
                      type="number"
                      value={data.total_amount || 0}
                      onChange={(e) => handleInvoiceFieldChange('total_amount', parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm mt-1 focus:border-cyan-500/50 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Items Grid Form */}
              <div className="space-y-4">
                {itemsList.map((item: any, index: number) => (
                  <div key={index} className="p-4 bg-slate-900/30 rounded-2xl border border-white/5 space-y-4">
                    {/* Row header containing Name and Confidence rating */}
                    <div className="flex justify-between items-center gap-4">
                      <input
                        type="text"
                        value={item.name || ''}
                        onChange={(e) => handleItemFieldChange(index, 'name', e.target.value)}
                        className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-cyan-500 focus:outline-none text-md font-bold text-slate-200 flex-1 py-1"
                      />
                      <span className={`px-2 py-0.5 rounded-lg text-2xs ${getConfidenceBadgeColor(item.confidence || 80)}`}>
                        {item.confidence || 80}% conf
                      </span>
                    </div>

                    {/* Input parameters grid depending on Type */}
                    {previewData.importType === 'MENU' ? (
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="text-3xs text-slate-500 font-bold uppercase">Category</label>
                          <input
                            type="text"
                            value={item.category || ''}
                            onChange={(e) => handleItemFieldChange(index, 'category', e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs mt-1 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-3xs text-slate-500 font-bold uppercase">Price (₹)</label>
                          <input
                            type="number"
                            value={item.price || 0}
                            onChange={(e) => handleItemFieldChange(index, 'price', parseFloat(e.target.value))}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs mt-1 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-3xs text-slate-500 font-bold uppercase">Veg/Non-Veg</label>
                          <select
                            value={item.veg_status || 'VEG'}
                            onChange={(e) => handleItemFieldChange(index, 'veg_status', e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs mt-1 outline-none"
                          >
                            <option value="VEG">Veg</option>
                            <option value="NON-VEG">Non-Veg</option>
                            <option value="EGG">Egg</option>
                            <option value="VEGAN">Vegan</option>
                            <option value="JAIN">Jain</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="text-3xs text-slate-500 font-bold uppercase">Quantity</label>
                          <input
                            type="number"
                            value={item.quantity || 0}
                            onChange={(e) => handleItemFieldChange(index, 'quantity', parseFloat(e.target.value))}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs mt-1 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-3xs text-slate-500 font-bold uppercase">Unit</label>
                          <input
                            type="text"
                            value={item.unit || ''}
                            onChange={(e) => handleItemFieldChange(index, 'unit', e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs mt-1 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-3xs text-slate-500 font-bold uppercase">
                            {previewData.importType === 'INVOICE' ? 'Total (₹)' : 'Cost (₹)'}
                          </label>
                          <input
                            type="number"
                            value={previewData.importType === 'INVOICE' ? (item.total || 0) : (item.cost || 0)}
                            onChange={(e) => handleItemFieldChange(index, previewData.importType === 'INVOICE' ? 'total' : 'cost', parseFloat(e.target.value))}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs mt-1 outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Duplicates & Validations Column */}
          <div className="md:col-span-1 space-y-6">
            {/* Validation Warnings Card */}
            <div className="rounded-3xl border border-white/5 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-xl">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Validations
              </h3>

              <div className="space-y-3">
                {previewData.validations.length > 0 ? (
                  previewData.validations.map((val, idx) => (
                    <div key={idx} className={`p-3.5 rounded-xl border text-xs flex gap-2 ${
                      val.severity === 'ERROR' ? 'bg-red-500/5 border-red-500/15 text-red-400' : 'bg-amber-500/5 border-amber-500/15 text-amber-400'
                    }`}>
                      <span className="font-bold flex-shrink-0">[{val.severity}]</span>
                      <span>{val.message}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">All business data validations passed successfully!</p>
                )}
              </div>
            </div>

            {/* Duplicate Warnings Card */}
            <div className="rounded-3xl border border-white/5 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-xl">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Duplicates ({previewData.duplicates.length})
              </h3>

              <div className="space-y-3">
                {previewData.duplicates.length > 0 ? (
                  previewData.duplicates.map((dup, idx) => (
                    <div key={idx} className="p-3.5 bg-white/2 border border-white/5 rounded-xl text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-300">"{dup.name}"</span>
                        <span className="text-cyan-400 font-semibold">{dup.similarity}% match</span>
                      </div>
                      <p className="text-slate-500">
                        Matches existing item <span className="text-slate-300">"{dup.existingName}"</span>.
                      </p>
                      <div className="flex gap-2 mt-2">
                        <select
                          defaultValue={dup.actionSuggested}
                          className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-4xs outline-none text-slate-300 focus:border-cyan-500"
                        >
                          <option value="MERGE">Merge / Alias</option>
                          <option value="REPLACE">Overwrite / Replace</option>
                          <option value="NEW">Create New Item</option>
                          <option value="IGNORE">Ignore Item</option>
                        </select>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No exact or near duplicate records detected in database.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportPreview;
