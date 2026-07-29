// File: frontend/src/pages/ai-import/ImportPreview.tsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config';

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
      const res = await fetch(`${API_BASE}/ai-import/confirm`, {
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

      const responseText = await res.text();
      let errorData: any = {};
      try {
        errorData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {}

      if (!res.ok) {
        throw new Error(errorData.error || errorData.message || `Failed to import document (${res.status})`);
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
    <div className="space-y-6 text-gray-900">
      {/* Header Actions */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">AI Understanding Result</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              documentType === 'MENU'
                ? 'bg-[#0F6B4B]/10 text-[#0F6B4B] border border-[#0F6B4B]/20'
                : documentType === 'INVENTORY'
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              Detected: {documentType}
            </span>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Gemini 2.5 Flash Vision automatically categorized and extracted items from your document.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-lg text-xs font-semibold text-gray-700 bg-white border border-[#E5E7EB] hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          {documentType !== 'NEEDS_REVIEW' && (
            <button
              onClick={confirmImport}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-[#0F6B4B] hover:bg-[#084C37] transition shadow-sm flex items-center gap-2"
            >
              {isSaving ? 'Importing...' : `Commit to ${documentType}`}
            </button>
          )}
        </div>
      </div>

      {/* Reasoning Summary Card */}
      <div className="p-4 rounded-xl bg-[#0F6B4B]/5 border border-[#0F6B4B]/20 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0F6B4B]"></span>
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#0F6B4B]">Gemini Vision Intelligence Context</h3>
          </div>
          <div className="text-xs text-gray-600">
            Confidence: <span className="font-bold text-gray-900">{previewData.confidence}%</span> | Language: <span className="font-bold text-gray-900">{previewData.languageDetected}</span> | Processing: <span className="font-bold text-gray-900">{previewData.durationMs}ms</span>
          </div>
        </div>
        <p className="text-xs text-gray-700 leading-relaxed">{previewData.reasoningSummary}</p>
      </div>

      {saveError && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold">
          {saveError}
        </div>
      )}

      {/* Main Grid: Image Preview & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Source Image */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 bg-white rounded-xl border border-[#E5E7EB] shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Original Document Source</h4>
            {imageUrl ? (
              <div className="rounded-lg overflow-hidden border border-[#E5E7EB] max-h-[480px] flex items-center justify-center bg-gray-50">
                <img src={imageUrl} alt="Document upload" className="object-contain max-h-[460px] w-full" />
              </div>
            ) : (
              <div className="p-10 text-center text-gray-400 text-xs border border-dashed border-gray-200 rounded-lg">
                No visual preview available
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Extracted Items */}
        <div className="lg:col-span-7 space-y-4">
          {documentType === 'MENU' && (
            <div className="p-5 bg-white rounded-xl border border-[#E5E7EB] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-sm text-gray-900">Extracted Menu Items ({menuItems.length})</h3>
                <button
                  onClick={() => handleAddRow('MENU')}
                  className="px-3 py-1.5 rounded-lg bg-[#0F6B4B]/10 text-[#0F6B4B] border border-[#0F6B4B]/20 text-xs font-semibold hover:bg-[#0F6B4B]/20"
                >
                  + Add Item
                </button>
              </div>

              <div className="overflow-x-auto border border-[#E5E7EB] rounded-lg">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-gray-50 uppercase text-[10px] tracking-wider text-gray-500 border-b border-[#E5E7EB]">
                    <tr>
                      <th className="p-2.5">Item Name</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Price (₹)</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {menuItems.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleMenuItemChange(idx, 'name', e.target.value)}
                            className="bg-white border border-[#E5E7EB] rounded px-2 py-1 text-gray-900 w-full text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.category}
                            onChange={(e) => handleMenuItemChange(idx, 'category', e.target.value)}
                            className="bg-white border border-[#E5E7EB] rounded px-2 py-1 text-gray-900 w-full text-xs"
                          />
                        </td>
                        <td className="p-2 w-24">
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleMenuItemChange(idx, 'price', parseFloat(e.target.value) || 0)}
                            className="bg-white border border-[#E5E7EB] rounded px-2 py-1 text-gray-900 w-full text-xs font-mono font-semibold"
                          />
                        </td>
                        <td className="p-2 w-28">
                          <select
                            value={item.veg_status}
                            onChange={(e) => handleMenuItemChange(idx, 'veg_status', e.target.value)}
                            className="bg-white border border-[#E5E7EB] rounded px-2 py-1 text-gray-900 w-full text-xs"
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
                            className="text-red-600 hover:text-red-800 text-xs px-2 py-1 font-semibold"
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
            <div className="p-5 bg-white rounded-xl border border-[#E5E7EB] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-sm text-gray-900">Extracted Inventory Items ({inventoryItems.length})</h3>
                <button
                  onClick={() => handleAddRow('INVENTORY')}
                  className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold hover:bg-purple-100"
                >
                  + Add Item
                </button>
              </div>

              <div className="overflow-x-auto border border-[#E5E7EB] rounded-lg">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-gray-50 uppercase text-[10px] tracking-wider text-gray-500 border-b border-[#E5E7EB]">
                    <tr>
                      <th className="p-2.5">Ingredient Name</th>
                      <th className="p-2.5">Qty</th>
                      <th className="p-2.5">Unit</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {inventoryItems.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.ingredient_name || item.name}
                            onChange={(e) => handleInventoryItemChange(idx, 'ingredient_name', e.target.value)}
                            className="bg-white border border-[#E5E7EB] rounded px-2 py-1 text-gray-900 w-full text-xs"
                          />
                        </td>
                        <td className="p-2 w-20">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleInventoryItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="bg-white border border-[#E5E7EB] rounded px-2 py-1 text-gray-900 w-full text-xs font-mono font-semibold"
                          />
                        </td>
                        <td className="p-2 w-20">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleInventoryItemChange(idx, 'unit', e.target.value)}
                            className="bg-white border border-[#E5E7EB] rounded px-2 py-1 text-gray-900 w-full text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.inventory_category || item.category || 'General'}
                            onChange={(e) => handleInventoryItemChange(idx, 'inventory_category', e.target.value)}
                            className="bg-white border border-[#E5E7EB] rounded px-2 py-1 text-gray-900 w-full text-xs"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <button
                            onClick={() => handleDeleteItem(idx, 'INVENTORY')}
                            className="text-red-600 hover:text-red-800 text-xs px-2 py-1 font-semibold"
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
            <div className="p-8 bg-red-50 border border-red-200 rounded-xl text-center space-y-3">
              <h3 className="font-bold text-base text-red-700">Manual Review Required</h3>
              <p className="text-xs text-red-600 max-w-md mx-auto">
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
