// File: frontend/src/pages/ai-import/ImportPreview.tsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface ImportPreviewProps {
  previewData: {
    fileId: string;
    documentType: 'MENU' | 'INVENTORY' | 'NEEDS_REVIEW';
    confidence: number;
    reasoningSummary: string;
    languageDetected: string;
    extractedData: {
      menu_items?: any[];
      inventory_items?: any[];
      raw_text_summary?: string;
    };
    durationMs: number;
    imageQuality: {
      blur: 'POOR' | 'OK' | 'GOOD';
      resolution: 'LOW' | 'OK' | 'HIGH';
      isAcceptable: boolean;
    };
    duplicates: {
      name: string;
      existingName: string;
      similarity: number;
      matchType: 'EXACT' | 'FUZZY';
      actionSuggested: 'MERGE' | 'IGNORE';
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
  const [documentType] = useState<'MENU' | 'INVENTORY' | 'NEEDS_REVIEW'>(previewData.documentType);
  const [data, setData] = useState(previewData.extractedData);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const [imageUrl] = useState(() => file ? URL.createObjectURL(file) : null);

  const handleMenuItemChange = (index: number, field: string, value: any) => {
    const updated = { ...data };
    if (!updated.menu_items) updated.menu_items = [];
    updated.menu_items[index][field] = value;
    setData(updated);
  };

  const handleInventoryItemChange = (index: number, field: string, value: any) => {
    const updated = { ...data };
    if (!updated.inventory_items) updated.inventory_items = [];
    updated.inventory_items[index][field] = value;
    setData(updated);
  };

  const handleDeleteItem = (index: number, type: 'MENU' | 'INVENTORY') => {
    const updated = { ...data };
    if (type === 'MENU' && updated.menu_items) {
      updated.menu_items.splice(index, 1);
    } else if (type === 'INVENTORY' && updated.inventory_items) {
      updated.inventory_items.splice(index, 1);
    }
    setData(updated);
  };

  const handleAddRow = (type: 'MENU' | 'INVENTORY') => {
    const updated = { ...data };
    if (type === 'MENU') {
      if (!updated.menu_items) updated.menu_items = [];
      updated.menu_items.push({
        name: 'New Item',
        category: 'Main Course',
        price: 100,
        veg_status: 'VEG',
        confidence: 100
      });
    } else {
      if (!updated.inventory_items) updated.inventory_items = [];
      updated.inventory_items.push({
        ingredient_name: 'New Ingredient',
        quantity: 1,
        unit: 'kg',
        supplier: 'Vendor',
        price: 50,
        purchase_cost: 50,
        inventory_category: 'General',
        confidence: 100
      });
    }
    setData(updated);
  };

  const confirmImport = async () => {
    if (!token || documentType === 'NEEDS_REVIEW') return;
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
          documentType,
          data,
          fileId: previewData.fileId,
          durationMs: previewData.durationMs
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to import document');
      }

      onSuccess();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to complete import.');
    } finally {
      setIsSaving(false);
    }
  };

  const menuItems = data.menu_items || [];
  const inventoryItems = data.inventory_items || [];

  return (
    <div className="space-y-8 text-white">
      {/* Header Actions */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight">AI Understanding Result</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              documentType === 'MENU'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-400/20'
                : documentType === 'INVENTORY'
                ? 'bg-purple-500/10 text-purple-400 border border-purple-400/20'
                : 'bg-red-500/10 text-red-400 border border-red-400/20'
            }`}>
              Detected: {documentType}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Gemini 2.5 Flash Vision automatically categorized and extracted items from your document.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold transition border border-white/10 hover:bg-white/5"
          >
            Cancel
          </button>
          {documentType !== 'NEEDS_REVIEW' && (
            <button
              onClick={confirmImport}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold transition bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 flex items-center gap-2"
            >
              {isSaving ? 'Importing...' : `Commit to ${documentType}`}
            </button>
          )}
        </div>
      </div>

      {/* Reasoning Summary Card */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <h3 className="font-bold text-sm text-cyan-300">Gemini Vision Reasoning & Context</h3>
          </div>
          <div className="text-xs text-slate-400">
            Confidence: <span className="font-bold text-white">{previewData.confidence}%</span> | Language: <span className="font-bold text-white">{previewData.languageDetected}</span> | Time: <span className="font-bold text-white">{previewData.durationMs}ms</span>
          </div>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{previewData.reasoningSummary}</p>
      </div>

      {saveError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
          {saveError}
        </div>
      )}

      {/* Main Grid split: Document image & Structured Data */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Image preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Original Document Source</h4>
            {imageUrl ? (
              <div className="rounded-xl overflow-hidden border border-white/10 max-h-[500px] flex items-center justify-center bg-slate-950">
                <img src={imageUrl} alt="Document upload" className="object-contain max-h-[480px] w-full" />
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs border border-dashed border-white/10 rounded-xl">
                No visual preview available
              </div>
            )}
          </div>
        </div>

        {/* Right column: Extracted Items Table */}
        <div className="lg:col-span-7 space-y-4">
          {documentType === 'MENU' && (
            <div className="p-5 bg-slate-900/60 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white">Extracted Menu Items ({menuItems.length})</h3>
                <button
                  onClick={() => handleAddRow('MENU')}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold hover:bg-cyan-500/20"
                >
                  + Add Item
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/50 uppercase text-[10px] tracking-wider text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="p-2.5">Item Name</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Price (₹)</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {menuItems.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleMenuItemChange(idx, 'name', e.target.value)}
                            className="bg-slate-950/80 border border-white/10 rounded px-2 py-1 text-white w-full text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.category}
                            onChange={(e) => handleMenuItemChange(idx, 'category', e.target.value)}
                            className="bg-slate-950/80 border border-white/10 rounded px-2 py-1 text-white w-full text-xs"
                          />
                        </td>
                        <td className="p-2 w-24">
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleMenuItemChange(idx, 'price', parseFloat(e.target.value) || 0)}
                            className="bg-slate-950/80 border border-white/10 rounded px-2 py-1 text-white w-full text-xs"
                          />
                        </td>
                        <td className="p-2 w-28">
                          <select
                            value={item.veg_status}
                            onChange={(e) => handleMenuItemChange(idx, 'veg_status', e.target.value)}
                            className="bg-slate-950/80 border border-white/10 rounded px-2 py-1 text-white w-full text-xs"
                          >
                            <option value="VEG">VEG</option>
                            <option value="NON-VEG">NON-VEG</option>
                            <option value="EGG">EGG</option>
                            <option value="VEGAN">VEGAN</option>
                            <option value="JAIN">JAIN</option>
                          </select>
                        </td>
                        <td className="p-2 text-right">
                          <button
                            onClick={() => handleDeleteItem(idx, 'MENU')}
                            className="text-red-400 hover:text-red-300 text-xs px-2 py-1"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {documentType === 'INVENTORY' && (
            <div className="p-5 bg-slate-900/60 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white">Extracted Inventory Items ({inventoryItems.length})</h3>
                <button
                  onClick={() => handleAddRow('INVENTORY')}
                  className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold hover:bg-purple-500/20"
                >
                  + Add Item
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/50 uppercase text-[10px] tracking-wider text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="p-2.5">Ingredient Name</th>
                      <th className="p-2.5">Qty</th>
                      <th className="p-2.5">Unit</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {inventoryItems.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.ingredient_name || item.name}
                            onChange={(e) => handleInventoryItemChange(idx, 'ingredient_name', e.target.value)}
                            className="bg-slate-950/80 border border-white/10 rounded px-2 py-1 text-white w-full text-xs"
                          />
                        </td>
                        <td className="p-2 w-20">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleInventoryItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="bg-slate-950/80 border border-white/10 rounded px-2 py-1 text-white w-full text-xs"
                          />
                        </td>
                        <td className="p-2 w-20">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleInventoryItemChange(idx, 'unit', e.target.value)}
                            className="bg-slate-950/80 border border-white/10 rounded px-2 py-1 text-white w-full text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.inventory_category || item.category || 'General'}
                            onChange={(e) => handleInventoryItemChange(idx, 'inventory_category', e.target.value)}
                            className="bg-slate-950/80 border border-white/10 rounded px-2 py-1 text-white w-full text-xs"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <button
                            onClick={() => handleDeleteItem(idx, 'INVENTORY')}
                            className="text-red-400 hover:text-red-300 text-xs px-2 py-1"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {documentType === 'NEEDS_REVIEW' && (
            <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-2xl text-center space-y-3">
              <h3 className="font-bold text-lg text-red-400">Manual Review Required</h3>
              <p className="text-sm text-red-300/80 max-w-md mx-auto">
                Gemini Vision could not automatically classify this document with sufficient confidence. Please upload a clearer photo of your menu card or supplier receipt.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportPreview;
