// File: backend/src/modules/ai-import/aiImport.controller.ts
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { processFileImport, confirmImportData, getImportHistory, getImportAnalytics } from './aiImport.service';
import { ImportType } from './aiImport.types';

export async function handleProcessImport(req: any, res: Response): Promise<void> {
  const file = req.file;
  const importType = req.body.importType as ImportType;

  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  if (!importType) {
    // Cleanup uploaded file
    try { fs.unlinkSync(file.path); } catch (e) {}
    res.status(400).json({ error: 'Missing importType parameter' });
    return;
  }

  const restaurantId = req.user?.restaurantId || req.user?.id;
  if (!restaurantId) {
    try { fs.unlinkSync(file.path); } catch (e) {}
    res.status(401).json({ error: 'Unauthorized restaurant session' });
    return;
  }

  try {
    const result = await processFileImport(restaurantId, file.path, importType);
    res.status(200).json(result);
  } catch (err: any) {
    console.error('Import processing controller failed:', err);
    res.status(500).json({ error: err.message || 'Failed to process AI import' });
  }
}

export async function handleConfirmImport(req: any, res: Response): Promise<void> {
  const { importType, data, fileId, durationMs, ocrFallback } = req.body;
  const restaurantId = req.user?.restaurantId || req.user?.id;
  const userId = req.user?.id;

  if (!restaurantId || !userId) {
    res.status(401).json({ error: 'Unauthorized session' });
    return;
  }

  if (!importType || !data) {
    res.status(400).json({ error: 'Missing required request parameters' });
    return;
  }

  try {
    const filePath = path.join(process.cwd(), 'backend', 'uploads', fileId);
    await confirmImportData(
      restaurantId,
      userId,
      importType as ImportType,
      data,
      fileId,
      durationMs || 0,
      !!ocrFallback
    );

    // Clean up processed upload file
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }

    res.status(200).json({ success: true, message: 'Data successfully reviewed and imported!' });
  } catch (err: any) {
    console.error('Import confirmation failed:', err);
    res.status(500).json({ error: err.message || 'Failed to commit import data' });
  }
}

export async function handleGetHistory(req: any, res: Response): Promise<void> {
  const restaurantId = req.user?.restaurantId || req.user?.id;
  if (!restaurantId) {
    res.status(401).json({ error: 'Unauthorized session' });
    return;
  }

  try {
    const history = await getImportHistory(restaurantId);
    res.status(200).json(history);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve import history' });
  }
}

export async function handleGetAnalytics(req: any, res: Response): Promise<void> {
  const restaurantId = req.user?.restaurantId || req.user?.id;
  if (!restaurantId) {
    res.status(401).json({ error: 'Unauthorized session' });
    return;
  }

  try {
    const analytics = await getImportAnalytics(restaurantId);
    res.status(200).json(analytics);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve analytics' });
  }
}
