// File: backend/src/services/vision/confidenceEvaluator.ts

export type ConfidenceDecision =
  | 'AUTO_IMPORT'
  | 'AUTO_IMPORT_WITH_WARNING'
  | 'MANUAL_REVIEW_RECOMMENDED'
  | 'NEEDS_REVIEW';

export interface ConfidenceEvaluation {
  overallConfidence: number;
  decision: ConfidenceDecision;
  reasons: string[];
  isAutoImportable: boolean;
}

export class ConfidenceEvaluator {
  private static AUTO_IMPORT_THRESHOLD = 95;
  private static WARNING_THRESHOLD = 85;
  private static MANUAL_REVIEW_THRESHOLD = 70;

  /**
   * Evaluates document extraction data against strict confidence thresholds.
   */
  public static evaluateConfidence(
    rawConfidence: number,
    itemConfidences: number[],
    hasValidationErrors: boolean,
    imageQualityStatus: string
  ): ConfidenceEvaluation {
    const reasons: string[] = [];

    // Calculate item average confidence if available
    let avgItemConfidence = rawConfidence;
    if (itemConfidences.length > 0) {
      const sum = itemConfidences.reduce((a, b) => a + b, 0);
      avgItemConfidence = Math.round(sum / itemConfidences.length);
    }

    let overallConfidence = Math.min(rawConfidence, avgItemConfidence);

    // Apply penalties based on image quality & business validations
    if (imageQualityStatus === 'POOR') {
      overallConfidence = Math.max(0, overallConfidence - 25);
      reasons.push('Image quality is poor or low resolution.');
    } else if (imageQualityStatus === 'ACCEPTABLE') {
      overallConfidence = Math.max(0, overallConfidence - 10);
      reasons.push('Image resolution is acceptable but slightly low.');
    }

    if (hasValidationErrors) {
      overallConfidence = Math.max(0, overallConfidence - 15);
      reasons.push('Business rule validation errors present.');
    }

    // Determine decision tier
    let decision: ConfidenceDecision;
    let isAutoImportable = false;

    if (overallConfidence >= this.AUTO_IMPORT_THRESHOLD) {
      decision = 'AUTO_IMPORT';
      isAutoImportable = true;
      reasons.push('High extraction confidence (≥95%). Ready for automated ingestion.');
    } else if (overallConfidence >= this.WARNING_THRESHOLD) {
      decision = 'AUTO_IMPORT_WITH_WARNING';
      isAutoImportable = true;
      reasons.push('Good confidence (85-94%). Auto-import enabled with non-critical warnings.');
    } else if (overallConfidence >= this.MANUAL_REVIEW_THRESHOLD) {
      decision = 'MANUAL_REVIEW_RECOMMENDED';
      isAutoImportable = false;
      reasons.push('Moderate confidence (70-84%). Manual review recommended before committing.');
    } else {
      decision = 'NEEDS_REVIEW';
      isAutoImportable = false;
      reasons.push('Low confidence (<70%) or unreadable text. Manual review required.');
    }

    return {
      overallConfidence,
      decision,
      reasons,
      isAutoImportable,
    };
  }
}
