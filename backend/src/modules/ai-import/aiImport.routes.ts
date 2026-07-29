// File: backend/src/modules/ai-import/aiImport.routes.ts
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateJWT } from '../auth/auth.middleware';
import {
  handleProcessImport,
  handleConfirmImport,
  handleGetHistory,
  handleGetAnalytics
} from './aiImport.controller';

const router = Router();

// Secure file upload configuration
const upload = multer({
  dest: path.join(process.cwd(), 'backend', 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 }, // Max 10MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      return cb(new Error(`Invalid file format '${fileExt}'. Supported formats: JPG, JPEG, PNG, WEBP, PDF.`));
    }
    cb(null, true);
  }
});

// Protect all AI Import routes under JWT verification
router.use(authenticateJWT);

// Wrap Multer middleware to guarantee JSON error response on upload failures
router.post('/process', (req, res, next) => {
  upload.single('file')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      console.error('[Multer Error]:', err);
      return res.status(400).json({ error: `File upload error: ${err.message}` });
    } else if (err) {
      console.error('[File Filter Error]:', err);
      return res.status(400).json({ error: err.message || 'Invalid upload file' });
    }
    next();
  });
}, handleProcessImport);

router.post('/confirm', handleConfirmImport);
router.get('/history', handleGetHistory);
router.get('/analytics', handleGetAnalytics);

export default router;
