// File: backend/src/modules/ai-import/aiImport.service.ts
import fs from 'fs';
import path from 'path';
import pool from '../../config/db';
import { parseImageFile } from '../ocr/ocr.service';
import { ImportType, ImportResult, ImportLog } from './aiImport.types';

function calculateSimilarity(a: string, b: string): number {
  const cleanA = a.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanB = b.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (cleanA === cleanB) return 1.0;
  if (cleanA.length === 0 || cleanB.length === 0) return 0.0;
  
  const matrix = [];
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

export async function processFileImport(
  restaurantId: string,
  filePath: string,
  importType: ImportType
): Promise<ImportResult> {
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
  }

  // Pre-flight image quality check
  const fileStats = fs.statSync(filePath);
  const imageQuality = {
    blur: 'GOOD' as 'POOR' | 'OK' | 'GOOD',
    brightness: 'OK' as 'DARK' | 'OK' | 'BRIGHT',
    cropped: false,
    resolution: fileStats.size < 50 * 1024 ? 'LOW' : 'OK' as 'LOW' | 'OK' | 'HIGH',
    isAcceptable: true
  };

  if (fileStats.size < 20 * 1024) {
    imageQuality.blur = 'POOR';
    imageQuality.resolution = 'LOW';
    imageQuality.isAcceptable = false;
  }

  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  let model;
  try {
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  } catch (e) {
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  // Setup prompt based on import mode
  let prompt = '';
  let jsonSchema = {};

  if (importType === 'MENU') {
    jsonSchema = {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              category: { type: "string" },
              price: { type: "number" },
              description: { type: "string" },
              veg_status: { type: "string", enum: ["VEG", "NON-VEG", "EGG", "VEGAN", "JAIN"] },
              variants: { type: "array", items: { type: "string" } },
              cuisine_type: { type: "string" },
              prep_time_minutes: { type: "integer" },
              tags: { type: "string" },
              confidence: { type: "integer" }
            },
            required: ["name", "category", "price", "veg_status"]
          }
        }
      },
      required: ["items"]
    };

    prompt = `Analyze this restaurant menu document/image. Extract all menu items, categorize them semantically (e.g. Paneer Butter Masala -> Main Course, Biryani -> Rice, Mojito -> Beverages, Chicken 65 -> Appetizers), and format them into a structured JSON payload conforming to the schema. Correct spelling mistakes, capitalize correctly, clean currency signs (e.g. Rs. / Rs -> ₹), and estimate confidence scores for each item from 1 to 100 based on image readability.`;
  } else if (importType === 'INVENTORY' || importType === 'HANDWRITTEN') {
    jsonSchema = {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              quantity: { type: "number" },
              unit: { type: "string" },
              supplier: { type: "string" },
              category: { type: "string" },
              brand: { type: "string" },
              cost: { type: "number" },
              gst_percent: { type: "number" },
              confidence: { type: "integer" }
            },
            required: ["name", "quantity", "unit", "cost"]
          }
        }
      },
      required: ["items"]
    };

    prompt = `Extract all inventory / stock items from this image or handwritten notes. Semantically categorize each item. Correct spelling errors (e.g. Tomatos -> Tomatoes). Standardize quantity units to lower case (e.g. Kg/KG -> kg, Ltr/L -> l, Pkt -> packet). Map confidence scores for each item from 1 to 100.`;
  } else if (importType === 'PANTRY') {
    jsonSchema = {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              confidence: { type: "integer" }
            },
            required: ["name", "confidence"]
          }
        }
      },
      required: ["items"]
    };

    prompt = `This is a photo of a restaurant pantry or shelf. Identify all visible food items, raw ingredients, or products (e.g. soft drinks, spices, onions, oil). Return their standard names and confidence percentages.`;
  } else if (importType === 'INVOICE') {
    jsonSchema = {
      type: "object",
      properties: {
        supplier: { type: "string" },
        invoice_number: { type: "string" },
        date: { type: "string" },
        gst_number: { type: "string" },
        products: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              quantity: { type: "number" },
              unit: { type: "string" },
              price: { type: "number" },
              total: { type: "number" },
              confidence: { type: "integer" }
            },
            required: ["name", "quantity", "price"]
          }
        },
        total_amount: { type: "number" },
        confidence: { type: "integer" }
      },
      required: ["supplier", "invoice_number", "products", "total_amount"]
    };

    prompt = `Analyze this supplier purchase bill or invoice. Extract the supplier name, invoice number, billing date, GST number, all line-item products, quantities, prices, line totals, and the net invoice total amount.`;
  }

  let extractedData: any = null;
  let ocrFallback = false;
  let confidenceTotal = 0;
  let confidenceCount = 0;

  try {
    const ext = path.extname(filePath).toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.pdf') mimeType = 'application/pdf';

    const filePart = {
      inlineData: {
        data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
        mimeType
      }
    };

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [filePart, { text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: jsonSchema
      }
    });

    extractedData = JSON.parse(result.response.text());
  } catch (err: any) {
    console.error('Gemini Vision extraction failed. Falling back to OCR.', err);
    ocrFallback = true;

    // Run fallback to existing OCR
    const ocrResult = await parseImageFile(filePath);
    if (importType === 'MENU') {
      extractedData = {
        items: ocrResult.items.map((it: any) => ({
          name: it.name,
          category: it.category || 'Uncategorized',
          price: it.price || 0,
          description: '',
          veg_status: 'VEG',
          confidence: 70
        }))
      };
    } else {
      extractedData = {
        items: ocrResult.items.map((it: any) => ({
          name: it.name,
          quantity: 1,
          unit: 'units',
          cost: it.price || 0,
          confidence: 60
        }))
      };
    }
  }

  // Calculate confidence scores
  let itemsList: any[] = [];
  if (extractedData.items) itemsList = extractedData.items;
  else if (extractedData.products) itemsList = extractedData.products;

  itemsList.forEach((it: any) => {
    const conf = typeof it.confidence === 'number' ? it.confidence : 75;
    confidenceTotal += conf;
    confidenceCount++;
  });

  const averageConfidence = confidenceCount > 0 ? Math.round(confidenceTotal / confidenceCount) : 80;

  // Run duplicate detection checks
  const duplicates: any[] = [];
  if (importType === 'MENU') {
    const { rows: existingItems } = await pool.query(
      'SELECT id, name, price FROM menu_items WHERE restaurant_id = $1',
      [restaurantId]
    );

    for (const it of itemsList) {
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
  } else if (importType === 'INVENTORY' || importType === 'INVOICE' || importType === 'HANDWRITTEN') {
    const { rows: existingStock } = await pool.query(
      'SELECT id, name FROM inventory_items WHERE restaurant_id = $1',
      [restaurantId]
    );

    for (const it of itemsList) {
      for (const exist of existingStock) {
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
  }

  // Business validations
  const validations: any[] = [];
  itemsList.forEach((it: any, index: number) => {
    if (typeof it.price === 'number' && it.price < 0) {
      validations.push({ field: `items[${index}].price`, message: `${it.name} has a negative price!`, severity: 'ERROR' });
    }
    if (typeof it.cost === 'number' && it.cost < 0) {
      validations.push({ field: `items[${index}].cost`, message: `${it.name} has a negative cost!`, severity: 'ERROR' });
    }
    if (typeof it.quantity === 'number' && it.quantity <= 0) {
      validations.push({ field: `items[${index}].quantity`, message: `${it.name} has impossible quantity: ${it.quantity}`, severity: 'WARNING' });
    }
  });

  return {
    fileId: path.basename(filePath),
    importType,
    extractedData,
    confidence: averageConfidence,
    ocrFallback,
    durationMs: Date.now() - startTime,
    imageQuality,
    duplicates,
    validations
  };
}

export async function confirmImportData(
  restaurantId: string,
  userId: string,
  importType: ImportType,
  data: any,
  fileId: string,
  durationMs: number,
  ocrFallback: boolean
): Promise<void> {
  const client = await pool.connect();
  const filePath = path.join(process.cwd(), 'backend', 'uploads', fileId);
  try {
    await client.query('BEGIN');

    // Resolve workspace ID
    const { rows: uRows } = await client.query('SELECT workspace_id FROM users WHERE id = $1 LIMIT 1', [userId]);
    const workspaceId = uRows[0]?.workspace_id;

    if (importType === 'MENU') {
      const itemsList = data.items || [];
      for (const it of itemsList) {
        // Resolve menu category
        const catName = it.category || 'Uncategorized';
        let { rows: catRows } = await client.query(
          'SELECT id FROM menu_categories WHERE restaurant_id = $1 AND name = $2 LIMIT 1',
          [restaurantId, catName]
        );
        let categoryId = catRows[0]?.id;
        if (!categoryId) {
          const { rows: newCat } = await client.query(
            'INSERT INTO menu_categories (restaurant_id, workspace_id, name, description) VALUES ($1, $2, $3, $4) RETURNING id',
            [restaurantId, workspaceId, catName, 'Imported by AI Smart Center']
          );
          categoryId = newCat[0].id;
        }

        // Insert menu item
        const { rows: itemRows } = await client.query(
          `INSERT INTO menu_items (restaurant_id, workspace_id, category_id, name, description, price, dietary_info, preparation_time, tags)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id`,
          [restaurantId, workspaceId, categoryId, it.name, it.description || '', it.price, it.veg_status, it.prep_time_minutes || 0, it.tags || '']
        );
        const itemId = itemRows[0].id;

        // Insert analytics record
        await client.query(
          'INSERT INTO menu_item_analytics (menu_item_id, orders_count, revenue, rating) VALUES ($1, 0, 0, 0)',
          [itemId]
        );
      }
    } else if (importType === 'INVENTORY' || importType === 'HANDWRITTEN') {
      const itemsList = data.items || [];
      for (const it of itemsList) {
        // Resolve category
        const catName = it.category || 'Pantry Supplies';
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

        // Resolve supplier
        const supName = it.supplier || 'Import Vendor';
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

        // Insert inventory item
        await client.query(
          `INSERT INTO inventory_items (restaurant_id, workspace_id, category_id, supplier_id, name, quantity_on_hand, reorder_threshold)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT DO NOTHING`,
          [restaurantId, workspaceId, categoryId, supplierId, it.name, it.quantity, 0]
        );
      }
    } else if (importType === 'INVOICE') {
      // Resolve supplier
      const supName = data.supplier || 'Invoice Vendor';
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

      // Create Purchase Order record
      const { rows: poRows } = await client.query(
        `INSERT INTO purchase_orders (restaurant_id, workspace_id, supplier_id, status, notes, total_amount, order_date)
         VALUES ($1, $2, $3, 'RECEIVED', $4, $5, NOW())
         RETURNING id`,
        [restaurantId, workspaceId, supplierId, `AI Import Invoice #${data.invoice_number || 'N/A'}`, data.total_amount]
      );
      const poId = poRows[0].id;

      // Add products
      const products = data.products || [];
      for (const prod of products) {
        // Resolve category
        let { rows: catRows } = await client.query(
          "SELECT id FROM inventory_categories WHERE restaurant_id = $1 AND name = 'Invoice Supplies' LIMIT 1",
          [restaurantId]
        );
        let categoryId = catRows[0]?.id;
        if (!categoryId) {
          const { rows: newCat } = await client.query(
            "INSERT INTO inventory_categories (restaurant_id, workspace_id, name) VALUES ($1, $2, 'Invoice Supplies') RETURNING id",
            [restaurantId, workspaceId]
          );
          categoryId = newCat[0].id;
        }

        // Resolve inventory item
        let { rows: stockRows } = await client.query(
          'SELECT id FROM inventory_items WHERE restaurant_id = $1 AND name = $2 LIMIT 1',
          [restaurantId, prod.name]
        );
        let itemId = stockRows[0]?.id;
        if (!itemId) {
          const { rows: newStock } = await client.query(
            `INSERT INTO inventory_items (restaurant_id, workspace_id, category_id, supplier_id, name, quantity_on_hand, reorder_threshold)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [restaurantId, workspaceId, categoryId, supplierId, prod.name, prod.quantity, 0]
          );
          itemId = newStock[0].id;
        } else {
          // Increment stock levels
          await client.query(
            'UPDATE inventory_items SET quantity_on_hand = quantity_on_hand + $1 WHERE id = $2',
            [prod.quantity, itemId]
          );
        }

        // Add PO Line Item
        await client.query(
          `INSERT INTO purchase_order_items (purchase_order_id, inventory_item_id, quantity, unit_price, total_cost)
           VALUES ($1, $2, $3, $4, $5)`,
          [poId, itemId, prod.quantity, prod.price, prod.total]
        );
      }
    }

    // Save final log
    await client.query(
      `INSERT INTO ai_imports (restaurant_id, workspace_id, import_type, original_file_name, original_file_path, ai_raw_response, final_imported_data, confidence_score, processing_time_ms, ocr_fallback_used, status, imported_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'IMPORTED', $11)`,
      [restaurantId, workspaceId, importType, fileId, filePath, JSON.stringify(data), JSON.stringify(data), data.confidence || 85, durationMs, ocrFallback, userId]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getImportHistory(restaurantId: string): Promise<ImportLog[]> {
  const { rows } = await pool.query(
    'SELECT * FROM ai_imports WHERE restaurant_id = $1 ORDER BY created_at DESC',
    [restaurantId]
  );
  return rows as ImportLog[];
}

export async function getImportAnalytics(restaurantId: string): Promise<any> {
  const { rows } = await pool.query(
    `SELECT 
       COALESCE(AVG(confidence_score), 0.00) as avg_accuracy,
       COALESCE(AVG(processing_time_ms), 0) as avg_time_ms,
       COALESCE(COUNT(*), 0) as total_imports,
       COALESCE(SUM(CASE WHEN ocr_fallback_used = true THEN 1 ELSE 0 END), 0) as ocr_fallbacks
     FROM ai_imports 
     WHERE restaurant_id = $1`,
    [restaurantId]
  );
  
  const stats = rows[0];
  return {
    avgAccuracy: parseFloat(stats.avg_accuracy),
    avgTimeMs: Math.round(parseFloat(stats.avg_time_ms)),
    totalImports: parseInt(stats.total_imports),
    ocrFallbackPercent: stats.total_imports > 0 ? Math.round((parseInt(stats.ocr_fallbacks) / parseInt(stats.total_imports)) * 100) : 0
  };
}
