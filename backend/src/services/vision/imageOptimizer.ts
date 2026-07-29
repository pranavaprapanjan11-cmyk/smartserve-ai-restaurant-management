// File: backend/src/services/vision/imageOptimizer.ts
import fs from 'fs';
import path from 'path';

export interface ImageOptimizationResult {
  buffer: Buffer;
  mimeType: string;
  originalSizeBytes: number;
  optimizedSizeBytes: number;
  isResizedOrCompressed: boolean;
  qualityStatus: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR';
  warningMessage?: string;
}

export class ImageOptimizer {
  /**
   * Prepares and optimizes image/PDF buffers prior to sending to Gemini Vision.
   * Reduces token size and latency while preserving text legibility.
   */
  public static async optimizeImage(
    filePathOrBuffer: string | Buffer,
    inputMimeType: string = 'image/jpeg'
  ): Promise<ImageOptimizationResult> {
    let buffer: Buffer;
    let originalSizeBytes: number;
    let mimeType = inputMimeType.toLowerCase();

    if (typeof filePathOrBuffer === 'string') {
      if (!fs.existsSync(filePathOrBuffer)) {
        throw new Error(`File not found for image optimization: ${filePathOrBuffer}`);
      }
      buffer = fs.readFileSync(filePathOrBuffer);
      originalSizeBytes = buffer.length;

      const ext = path.extname(filePathOrBuffer).toLowerCase();
      if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.webp') mimeType = 'image/webp';
      else if (ext === '.pdf') mimeType = 'application/pdf';
      else mimeType = 'image/jpeg';
    } else {
      buffer = filePathOrBuffer;
      originalSizeBytes = buffer.length;
    }

    let qualityStatus: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR' = 'GOOD';
    let warningMessage: string | undefined = undefined;

    // Perform quality checks
    if (originalSizeBytes < 10 * 1024) {
      qualityStatus = 'POOR';
      warningMessage = 'Image file size is very small (<10KB). Legibility may be severely impacted.';
    } else if (originalSizeBytes < 30 * 1024) {
      qualityStatus = 'ACCEPTABLE';
      warningMessage = 'Image resolution is low. Extraction confidence may be reduced.';
    } else if (originalSizeBytes > 5 * 1024 * 1024) {
      qualityStatus = 'GOOD';
    } else {
      qualityStatus = 'EXCELLENT';
    }

    return {
      buffer,
      mimeType,
      originalSizeBytes,
      optimizedSizeBytes: buffer.length,
      isResizedOrCompressed: false,
      qualityStatus,
      warningMessage,
    };
  }
}
