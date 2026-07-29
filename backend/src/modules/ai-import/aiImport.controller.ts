// File: backend/src/modules/ai-import/aiImport.controller.ts
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { processVisionImport, confirmImportData, getImportHistory, getImportAnalytics } from './aiImport.service';

export async function handleProcessImport(req: any, res: Response): Promise<void> {
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: 'No document file uploaded' });
    return;
  }

  const restaurantId = req.user?.restaurantId || req.user?.id || '00000000-0000-0000-0000-000000000001';

  try {
    const result = await processVisionImport(restaurantId, file.path);
    res.status(200).json(result);
  } catch (err: any) {
    console.error('Vision import controller failed:', err);
    if (file && fs.existsSync(file.path)) {
      try { fs.unlinkSync(file.path); } catch (e) {}
    }
    res.status(500).json({ error: err.message || 'Failed to analyze document with Gemini Vision' });
  }
}

export async function handleConfirmImport(req: any, res: Response): Promise<void> {
  const { documentType, data, fileId, durationMs } = req.body;
  const restaurantId = req.user?.restaurantId || req.user?.id || '00000000-0000-0000-0000-000000000001';
  const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';

  if (!documentType || !data) {
    res.status(400).json({ error: 'Missing documentType or data payload' });
    return;
  }

  try {
    const filePath = path.join(process.cwd(), 'backend', 'uploads', fileId);
    await confirmImportData(
      restaurantId,
      userId,
      documentType as 'MENU' | 'INVENTORY',
      data,
      fileId,
      durationMs || 0
    );

    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }

    res.status(200).json({ success: true, message: `Successfully imported items into ${documentType}` });
  } catch (err: any) {
    console.error('Import confirmation failed:', err);
    res.status(500).json({ error: err.message || 'Failed to commit import data' });
  }
}

export async function handleGetHistory(req: any, res: Response): Promise<void> {
  const restaurantId = req.user?.restaurantId || req.user?.id || '00000000-0000-0000-0000-000000000001';
  try {
    const history = await getImportHistory(restaurantId);
    res.status(200).json(history);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve import history' });
  }
}

export async function handleGetAnalytics(req: any, res: Response): Promise<void> {
  const restaurantId = req.user?.restaurantId || req.user?.id || '00000000-0000-0000-0000-000000000001';
  try {
    const analytics = await getImportAnalytics(restaurantId);
    res.status(200).json(analytics);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve analytics' });
  }
}
