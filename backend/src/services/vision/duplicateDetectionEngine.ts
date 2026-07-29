// File: backend/src/services/vision/duplicateDetectionEngine.ts

export interface DuplicateMatch {
  candidateName: string;
  existingName: string;
  similarityScore: number; // 0 to 100
  matchType: 'EXACT' | 'FUZZY_HIGH' | 'FUZZY_MEDIUM' | 'NONE';
  suggestedAction: 'IGNORE' | 'MERGE' | 'REPLACE' | 'NEW';
  priceVariancePercent?: number;
}

export class DuplicateDetectionEngine {
  /**
   * Computes string similarity using normalized Levenshtein distance.
   */
  public static computeSimilarity(str1: string, str2: string): number {
    const clean1 = (str1 || '').toLowerCase().replace(/[^a-z0-9]/gi, '');
    const clean2 = (str2 || '').toLowerCase().replace(/[^a-z0-9]/gi, '');

    if (clean1 === clean2) return 1.0;
    if (!clean1.length || !clean2.length) return 0.0;

    const len1 = clean1.length;
    const len2 = clean2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len2; i++) matrix[i] = [i];
    for (let j = 0; j <= len1; j++) matrix[0][j] = j;

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (clean2.charAt(i - 1) === clean1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
          );
        }
      }
    }

    const distance = matrix[len2][len1];
    const maxLen = Math.max(len1, len2);
    return 1.0 - distance / maxLen;
  }

  /**
   * Analyzes candidate items against existing database items to detect duplicates.
   */
  public static detectDuplicates(
    candidateItems: { name: string; price?: number }[],
    existingItems: { name: string; price?: number }[]
  ): DuplicateMatch[] {
    const matches: DuplicateMatch[] = [];

    for (const candidate of candidateItems) {
      if (!candidate.name) continue;

      let bestMatch: DuplicateMatch | null = null;
      let maxSim = 0;

      for (const existing of existingItems) {
        const sim = this.computeSimilarity(candidate.name, existing.name);

        if (sim > maxSim) {
          maxSim = sim;
          const similarityScore = Math.round(sim * 100);

          let matchType: 'EXACT' | 'FUZZY_HIGH' | 'FUZZY_MEDIUM' | 'NONE' = 'NONE';
          let suggestedAction: 'IGNORE' | 'MERGE' | 'REPLACE' | 'NEW' = 'NEW';

          if (similarityScore === 100) {
            matchType = 'EXACT';
            suggestedAction = 'IGNORE';
          } else if (similarityScore >= 85) {
            matchType = 'FUZZY_HIGH';
            suggestedAction = 'MERGE';
          } else if (similarityScore >= 70) {
            matchType = 'FUZZY_MEDIUM';
            suggestedAction = 'MERGE';
          }

          let priceVariancePercent: number | undefined = undefined;
          if (candidate.price && existing.price && existing.price > 0) {
            priceVariancePercent = Math.round((Math.abs(candidate.price - existing.price) / existing.price) * 100);
          }

          bestMatch = {
            candidateName: candidate.name,
            existingName: existing.name,
            similarityScore,
            matchType,
            suggestedAction,
            priceVariancePercent,
          };
        }
      }

      if (bestMatch && bestMatch.similarityScore >= 70) {
        matches.push(bestMatch);
      }
    }

    return matches;
  }
}
