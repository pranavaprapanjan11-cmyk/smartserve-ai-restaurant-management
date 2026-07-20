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
      return cb(new Error('Invalid file type. Supported types: JPG, PNG, WEBP, PDF.'));
    }
    cb(null, true);
  }
});

// Protect all AI Import routes under JWT verification
router.use(authenticateJWT);

router.post('/process', upload.single('file'), handleProcessImport);
router.post('/confirm', handleConfirmImport);
router.get('/history', handleGetHistory);
router.get('/analytics', handleGetAnalytics);

export default router;
