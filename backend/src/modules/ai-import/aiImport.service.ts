// File: backend/src/modules/ai-import/aiImport.service.ts
import fs from 'fs';
import path from 'path';
import pool from '../../config/db';
import { GeminiVisionService, GeminiVisionResult, ExtractedMenuItem, ExtractedInventoryItem } from '../../services/geminiVision.service';
import { ImportLog } from './aiImport.types';

function calculateSimilarity(a: string, b: string): number {
  const cleanA = a.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanB = b.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (cleanA === cleanB) return 1.0;
  if (cleanA.length === 0 || cleanB.length === 0) return 0.0;
  
  const matrix: number[][] = [];
  for (let i = 0; i <= cleanB.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= cleanA.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= cleanB.length; i++) {
    for (let j = 1; j <= cleanA.length; j++) {
      if (cleanB.charAt(i - 1) === cleanA.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  
  const distance = matrix[cleanB.length][cleanA.length];
  const maxLength = Math.max(cleanA.length, cleanB.length);
  return 1.0 - distance / maxLength;
}

export async function processVisionImport(
  restaurantId: string,
  filePath: string
): Promise<any> {
  const startTime = Date.now();

  const fileStats = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  let mimeType = 'image/jpeg';
  if (ext === '.png') mimeType = 'image/png';
  else if (ext === '.webp') mimeType = 'image/webp';
  else if (ext === '.pdf') mimeType = 'application/pdf';

  const imageQuality = {
    blur: 'GOOD' as 'POOR' | 'OK' | 'GOOD',
    resolution: fileStats.size < 30 * 1024 ? 'LOW' : 'OK' as 'LOW' | 'OK' | 'HIGH',
    isAcceptable: fileStats.size >= 15 * 1024
  };

  if (fileStats.size < 15 * 1024) {
    imageQuality.blur = 'POOR';
  }

  // Unified Gemini 2.5 Flash Vision Analysis & Auto-Classification
  const visionResult: GeminiVisionResult = await GeminiVisionService.analyzeDocument(filePath, mimeType);

  const durationMs = Date.now() - startTime;
  const duplicates: any[] = [];
  const validations: any[] = [];

  // Duplicate checks depending on detected document type
  if (visionResult.document_type === 'MENU' && visionResult.menu_items?.length) {
    const { rows: existingItems } = await pool.query(
      'SELECT id, name, price FROM menu_items WHERE restaurant_id = $1',
      [restaurantId]
    );

    for (const it of visionResult.menu_items) {
      if (it.price < 0) {
        validations.push({ field: it.name, message: 'Price cannot be negative', severity: 'ERROR' });
      }
      for (const exist of existingItems) {
        const similarity = calculateSimilarity(it.name, exist.name);
        if (similarity > 0.70) {
          duplicates.push({
            name: it.name,
            existingName: exist.name,
            similarity: Math.round(similarity * 100),
            matchType: similarity === 1.0 ? 'EXACT' : 'FUZZY',
            actionSuggested: similarity === 1.0 ? 'IGNORE' : 'MERGE'
          });
          break;
        }
      }
    }
  } else if (visionResult.document_type === 'INVENTORY' && visionResult.inventory_items?.length) {
    const { rows: existingStock } = await pool.query(
      'SELECT id, name FROM inventory_items WHERE restaurant_id = $1',
      [restaurantId]
    );

    for (const it of visionResult.inventory_items) {
      if (it.quantity <= 0) {
        validations.push({ field: it.ingredient_name, message: 'Quantity is 0 or negative', severity: 'WARNING' });
      }
      for (const exist of existingStock) {
        const similarity = calculateSimilarity(it.ingredient_name, exist.name);
        if (similarity > 0.70) {
          duplicates.push({
            name: it.ingredient_name,
            existingName: exist.name,
            similarity: Math.round(similarity * 100),
            matchType: similarity === 1.0 ? 'EXACT' : 'FUZZY',
            actionSuggested: similarity === 1.0 ? 'IGNORE' : 'MERGE'
          });
          break;
        }
      }
    }
  }

  return {
    fileId: path.basename(filePath),
    documentType: visionResult.document_type,
    confidence: visionResult.confidence_score,
    reasoningSummary: visionResult.reasoning_summary,
    languageDetected: visionResult.language_detected,
    extractedData: {
      menu_items: visionResult.menu_items || [],
      inventory_items: visionResult.inventory_items || [],
      raw_text_summary: visionResult.raw_text_summary || ''
    },
    durationMs,
    imageQuality,
    duplicates,
    validations
  };
}

export async function confirmImportData(
  restaurantId: string,
  userId: string,
  documentType: 'MENU' | 'INVENTORY',
  data: any,
  fileId: string,
  durationMs: number
): Promise<void> {
  await ensureAiImportsTable();
  const client = await pool.connect();
  const filePath = path.join(process.cwd(), 'backend', 'uploads', fileId);
  try {
    await client.query('BEGIN');

    const { rows: uRows } = await client.query('SELECT workspace_id FROM users WHERE id = $1 LIMIT 1', [userId]);
    const workspaceId = uRows[0]?.workspace_id;

    if (documentType === 'MENU') {
      const itemsList: ExtractedMenuItem[] = data.menu_items || data.items || [];
      for (const it of itemsList) {
        const catName = it.category || 'Uncategorized';
        let { rows: catRows } = await client.query(
          'SELECT id FROM menu_categories WHERE restaurant_id = $1 AND name = $2 LIMIT 1',
          [restaurantId, catName]
        );
        let categoryId = catRows[0]?.id;
        if (!categoryId) {
          const { rows: newCat } = await client.query(
            'INSERT INTO menu_categories (restaurant_id, workspace_id, name, description) VALUES ($1, $2, $3, $4) RETURNING id',
            [restaurantId, workspaceId, catName, 'Imported via Gemini Vision Engine']
          );
          categoryId = newCat[0].id;
        }

        const { rows: itemRows } = await client.query(
          `INSERT INTO menu_items (restaurant_id, workspace_id, category_id, name, description, price, dietary_info, preparation_time)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [restaurantId, workspaceId, categoryId, it.name, it.description || '', it.price, it.veg_status || 'VEG', 15]
        );
        const itemId = itemRows[0].id;

        await client.query(
          'INSERT INTO menu_item_analytics (menu_item_id, orders_count, revenue, rating) VALUES ($1, 0, 0, 0)',
          [itemId]
        );
      }
    } else if (documentType === 'INVENTORY') {
      const itemsList: ExtractedInventoryItem[] = data.inventory_items || data.items || [];
      for (const it of itemsList) {
        const catName = it.inventory_category || 'General Stock';
        let { rows: catRows } = await client.query(
          'SELECT id FROM inventory_categories WHERE restaurant_id = $1 AND name = $2 LIMIT 1',
          [restaurantId, catName]
        );
        let categoryId = catRows[0]?.id;
        if (!categoryId) {
          const { rows: newCat } = await client.query(
            'INSERT INTO inventory_categories (restaurant_id, workspace_id, name) VALUES ($1, $2, $3) RETURNING id',
            [restaurantId, workspaceId, catName]
          );
          categoryId = newCat[0].id;
        }

        const supName = it.supplier || 'Gemini Vision Vendor';
        let { rows: supRows } = await client.query(
          'SELECT id FROM suppliers WHERE restaurant_id = $1 AND name = $2 LIMIT 1',
          [restaurantId, supName]
        );
        let supplierId = supRows[0]?.id;
        if (!supplierId) {
          const { rows: newSup } = await client.query(
            'INSERT INTO suppliers (restaurant_id, workspace_id, name) VALUES ($1, $2, $3) RETURNING id',
            [restaurantId, workspaceId, supName]
          );
          supplierId = newSup[0].id;
        }

        await client.query(
          `INSERT INTO inventory_items (restaurant_id, workspace_id, category_id, supplier_id, name, quantity_on_hand, reorder_threshold)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT DO NOTHING`,
          [restaurantId, workspaceId, categoryId, supplierId, it.ingredient_name || (it as any).name, it.quantity || 1, 0]
        );
      }
    }

    await client.query(
      `INSERT INTO ai_imports (restaurant_id, workspace_id, import_type, original_file_name, original_file_path, ai_raw_response, final_imported_data, confidence_score, processing_time_ms, ocr_fallback_used, status, imported_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, 'IMPORTED', $10)`,
      [restaurantId, workspaceId, documentType, fileId, filePath, JSON.stringify(data), JSON.stringify(data), data.confidence || 90, durationMs, userId]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function ensureAiImportsTable(): Promise<void> {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS ai_imports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      restaurant_id UUID NOT NULL,
      workspace_id UUID,
      import_type VARCHAR(50) NOT NULL,
      original_file_name VARCHAR(255),
      original_file_path TEXT,
      ai_raw_response JSONB DEFAULT '{}'::jsonb,
      final_imported_data JSONB DEFAULT '{}'::jsonb,
      user_corrections JSONB DEFAULT '{}'::jsonb,
      confidence_score DECIMAL(5,2) DEFAULT 0.00,
      processing_time_ms INTEGER DEFAULT 0,
      ocr_fallback_used BOOLEAN DEFAULT false,
      status VARCHAR(50) DEFAULT 'PENDING',
      imported_by UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_ai_imports_restaurant_id ON ai_imports(restaurant_id);
  `;
  try {
    await pool.query(createTableSql);
  } catch (err) {
    console.error('[AI Imports Auto-Healer]: Table creation check failed', err);
  }
}

export async function getImportHistory(restaurantId: string): Promise<ImportLog[]> {
  await ensureAiImportsTable();
  const { rows } = await pool.query(
    'SELECT * FROM ai_imports WHERE restaurant_id = $1 ORDER BY created_at DESC',
    [restaurantId]
  );
  return rows as ImportLog[];
}

export async function getImportAnalytics(restaurantId: string): Promise<any> {
  await ensureAiImportsTable();
  const { rows } = await pool.query(
    `SELECT 
       COALESCE(AVG(confidence_score), 0.00) as avg_accuracy,
       COALESCE(AVG(processing_time_ms), 0) as avg_time_ms,
       COALESCE(COUNT(*), 0) as total_imports
     FROM ai_imports 
     WHERE restaurant_id = $1`,
    [restaurantId]
  );
  
  const stats = rows[0] || {};
  return {
    avgAccuracy: parseFloat(stats.avg_accuracy || 0),
    avgTimeMs: Math.round(parseFloat(stats.avg_time_ms || 0)),
    totalImports: parseInt(stats.total_imports || 0),
    ocrFallbackPercent: 0
  };
}
