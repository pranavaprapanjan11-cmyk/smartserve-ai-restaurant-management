// File: backend/src/services/geminiVision.service.ts
import { DocumentIntelligenceEngine, DocumentAnalysisResponse } from './vision/documentIntelligenceEngine';
import { ConfidenceDecision } from './vision/confidenceEvaluator';

export type DocumentType = 'MENU' | 'INVENTORY' | 'NEEDS_REVIEW';

export interface ExtractedMenuItem {
  name: string;
  category: string;
  price: number;
  veg_status: 'VEG' | 'NON-VEG' | 'EGG' | 'VEGAN' | 'JAIN';
  description?: string;
  available_status?: boolean;
  recommended_category?: string;
  confidence: number;
}

export interface ExtractedInventoryItem {
  ingredient_name: string;
  quantity: number;
  unit: string;
  supplier?: string;
  price: number;
  purchase_cost: number;
  inventory_category: string;
  confidence: number;
}

export interface GeminiVisionResult {
  document_type: DocumentType;
  confidence_score: number;
  decision_tier: ConfidenceDecision;
  is_auto_importable: boolean;
  reasoning_summary: string;
  language_detected: string;
  menu_items?: ExtractedMenuItem[];
  inventory_items?: ExtractedInventoryItem[];
  raw_text_summary?: string;
  validation_issues?: any[];
  duplicate_matches?: any[];
  telemetry?: any;
  error?: string;
}

export class GeminiVisionService {
  /**
   * Facade entry point delegating directly to DocumentIntelligenceEngine.
   */
  public static async analyzeDocument(
    filePathOrBuffer: string | Buffer,
    mimeType: string = 'image/jpeg',
    existingDbItems: { name: string; price?: number }[] = []
  ): Promise<GeminiVisionResult> {
    try {
      const response: DocumentAnalysisResponse = await DocumentIntelligenceEngine.analyze(
        filePathOrBuffer,
        mimeType,
        existingDbItems
      );

      return {
        document_type: response.documentType,
        confidence_score: response.confidenceScore,
        decision_tier: response.decisionTier,
        is_auto_importable: response.isAutoImportable,
        reasoning_summary: response.reasoningSummary,
        language_detected: response.languageDetected,
        menu_items: response.menuItems,
        inventory_items: response.inventoryItems,
        raw_text_summary: response.rawTextSummary,
        validation_issues: response.validationIssues,
        duplicate_matches: response.duplicateMatches,
        telemetry: response.telemetry,
      };
    } catch (err: any) {
      console.error('GeminiVisionService facade error:', err);
      return {
        document_type: 'NEEDS_REVIEW',
        confidence_score: 0,
        decision_tier: 'NEEDS_REVIEW',
        is_auto_importable: false,
        reasoning_summary: `Vision analysis failed: ${err?.message || 'Unknown error'}`,
        language_detected: 'Unknown',
        error: err?.message || 'Processing failed',
      };
    }
  }
}
