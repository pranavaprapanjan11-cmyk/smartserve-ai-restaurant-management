// File: backend/src/services/vision/documentIntelligenceEngine.ts
import { ImageOptimizer } from './imageOptimizer';
import { GeminiVisionEngine } from './geminiVisionEngine';
import { JsonValidator } from './jsonValidator';
import { ConfidenceEvaluator, ConfidenceDecision } from './confidenceEvaluator';
import { DuplicateDetectionEngine, DuplicateMatch } from './duplicateDetectionEngine';
import { BusinessRuleEngine, ValidationIssue } from './businessRuleEngine';
import { DocumentClassifier } from './documentClassifier';

export interface DocumentAnalysisResponse {
  documentType: 'MENU' | 'INVENTORY' | 'NEEDS_REVIEW';
  confidenceScore: number;
  decisionTier: ConfidenceDecision;
  isAutoImportable: boolean;
  reasoningSummary: string;
  languageDetected: string;
  menuItems: any[];
  inventoryItems: any[];
  rawTextSummary: string;
  validationIssues: ValidationIssue[];
  duplicateMatches: DuplicateMatch[];
  telemetry: {
    modelUsed: string;
    executionTimeMs: number;
    retryCount: number;
    estimatedInputTokens: number;
    estimatedOutputTokens: number;
    originalSizeBytes: number;
    imageQualityStatus: string;
  };
}

export class DocumentIntelligenceEngine {
  /**
   * Main entrance pipeline for analyzing documents with Gemini Vision.
   */
  public static async analyze(
    filePathOrBuffer: string | Buffer,
    inputMimeType: string = 'image/jpeg',
    existingDbItems: { name: string; price?: number }[] = []
  ): Promise<DocumentAnalysisResponse> {
    // Step 1: Image Pre-flight Optimization
    const imageOpt = await ImageOptimizer.optimizeImage(filePathOrBuffer, inputMimeType);

    // Step 2: System Prompt & Vision API Call
    const systemPrompt = DocumentClassifier.getSystemPrompt();
    const rawResponse = await GeminiVisionEngine.executeVisionPrompt(
      imageOpt.buffer,
      imageOpt.mimeType,
      systemPrompt
    );

    // Step 3: JSON Validation & Schema Parsing
    const jsonResult = JsonValidator.parseAndValidateJson<any>(rawResponse.responseText);
    if (!jsonResult.isValid || !jsonResult.parsedData) {
      return {
        documentType: 'NEEDS_REVIEW',
        confidenceScore: 0,
        decisionTier: 'NEEDS_REVIEW',
        isAutoImportable: false,
        reasoningSummary: `Malformed JSON response from Gemini Vision: ${jsonResult.errorMessage}`,
        languageDetected: 'Unknown',
        menuItems: [],
        inventoryItems: [],
        rawTextSummary: rawResponse.responseText,
        validationIssues: [{ field: 'json', message: 'Malformed JSON', severity: 'ERROR' }],
        duplicateMatches: [],
        telemetry: {
          modelUsed: rawResponse.modelUsed,
          executionTimeMs: rawResponse.executionTimeMs,
          retryCount: rawResponse.retryCount,
          estimatedInputTokens: rawResponse.estimatedInputTokens,
          estimatedOutputTokens: rawResponse.estimatedOutputTokens,
          originalSizeBytes: imageOpt.originalSizeBytes,
          imageQualityStatus: imageOpt.qualityStatus,
        },
      };
    }

    const data = jsonResult.parsedData;
    const documentType: 'MENU' | 'INVENTORY' | 'NEEDS_REVIEW' = data.document_type || 'NEEDS_REVIEW';
    const menuItems = data.menu_items || [];
    const inventoryItems = data.inventory_items || [];
    const rawConfidence = typeof data.confidence_score === 'number' ? data.confidence_score : 80;

    // Step 4: Business Rule Validation
    const validationIssues = BusinessRuleEngine.validateExtractedItems(documentType, menuItems, inventoryItems);
    const hasErrors = validationIssues.some((issue) => issue.severity === 'ERROR');

    // Step 5: Confidence Tier Evaluation
    const itemConfidences = (documentType === 'MENU' ? menuItems : inventoryItems)
      .map((it: any) => typeof it.confidence === 'number' ? it.confidence : 80);

    const confidenceEval = ConfidenceEvaluator.evaluateConfidence(
      rawConfidence,
      itemConfidences,
      hasErrors,
      imageOpt.qualityStatus
    );

    // Step 6: Duplicate Detection
    const candidates = documentType === 'MENU'
      ? menuItems.map((it: any) => ({ name: it.name, price: it.price }))
      : inventoryItems.map((it: any) => ({ name: it.ingredient_name || it.name, price: it.price || it.purchase_cost }));

    const duplicateMatches = DuplicateDetectionEngine.detectDuplicates(candidates, existingDbItems);

    return {
      documentType,
      confidenceScore: confidenceEval.overallConfidence,
      decisionTier: confidenceEval.decision,
      isAutoImportable: confidenceEval.isAutoImportable,
      reasoningSummary: data.reasoning_summary || 'Document analyzed successfully.',
      languageDetected: data.language_detected || 'English',
      menuItems,
      inventoryItems,
      rawTextSummary: data.raw_text_summary || '',
      validationIssues,
      duplicateMatches,
      telemetry: {
        modelUsed: rawResponse.modelUsed,
        executionTimeMs: rawResponse.executionTimeMs,
        retryCount: rawResponse.retryCount,
        estimatedInputTokens: rawResponse.estimatedInputTokens,
        estimatedOutputTokens: rawResponse.estimatedOutputTokens,
        originalSizeBytes: imageOpt.originalSizeBytes,
        imageQualityStatus: imageOpt.qualityStatus,
      },
    };
  }
}
