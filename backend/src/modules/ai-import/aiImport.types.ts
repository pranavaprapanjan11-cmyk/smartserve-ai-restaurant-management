// File: backend/src/modules/ai-import/aiImport.types.ts

export type ImportType = 'MENU' | 'INVENTORY' | 'PANTRY' | 'INVOICE' | 'HANDWRITTEN';

export interface ImportLog {
  id: string;
  restaurant_id: string;
  workspace_id?: string;
  import_type: ImportType;
  original_file_name: string;
  original_file_path: string;
  ai_raw_response: any;
  final_imported_data: any;
  user_corrections: any;
  confidence_score: number;
  processing_time_ms: number;
  ocr_fallback_used: boolean;
  status: 'PENDING' | 'IMPORTED' | 'FAILED';
  imported_by?: string;
  created_at: string;
  updated_at: string;
}

export interface MenuItemImportData {
  name: string;
  category: string;
  price: number;
  description?: string;
  veg_status: 'VEG' | 'NON-VEG' | 'EGG' | 'VEGAN' | 'JAIN';
  variants?: string[];
  addons?: string[];
  cuisine_type?: string;
  prep_time_minutes?: number;
  tags?: string;
  is_available?: boolean;
  confidence: number;
}

export interface InventoryItemImportData {
  name: string;
  quantity: number;
  unit: string;
  supplier?: string;
  category?: string;
  brand?: string;
  cost: number;
  purchase_date?: string;
  gst_percent?: number;
  expiry_date?: string;
  batch_number?: string;
  confidence: number;
}

export interface PantryItemData {
  name: string;
  confidence: number;
}

export interface SupplierInvoiceProduct {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
  confidence: number;
}

export interface SupplierInvoiceImportData {
  supplier: string;
  invoice_number: string;
  date: string;
  gst_number?: string;
  products: SupplierInvoiceProduct[];
  total_amount: number;
  confidence: number;
}

export interface HandwrittenListItem {
  name: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  confidence: number;
}

export interface ImportResult {
  fileId: string;
  importType: ImportType;
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
}
