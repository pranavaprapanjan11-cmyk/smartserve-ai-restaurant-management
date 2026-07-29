// File: backend/src/services/vision/jsonValidator.ts

export interface ValidationResult<T> {
  isValid: boolean;
  parsedData: T | null;
  rawString: string;
  errorMessage?: string;
}

export class JsonValidator {
  /**
   * Cleans markdown fences and parses raw JSON response strings cleanly.
   */
  public static parseAndValidateJson<T = any>(rawResponse: string): ValidationResult<T> {
    if (!rawResponse || typeof rawResponse !== 'string') {
      return {
        isValid: false,
        parsedData: null,
        rawString: rawResponse || '',
        errorMessage: 'Raw response string is empty or invalid.',
      };
    }

    let cleaned = rawResponse.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      const parsed = JSON.parse(cleaned) as T;
      return {
        isValid: true,
        parsedData: parsed,
        rawString: cleaned,
      };
    } catch (err: any) {
      console.error('JSON Validation error:', err.message, 'Raw text:', cleaned);
      return {
        isValid: false,
        parsedData: null,
        rawString: cleaned,
        errorMessage: `Malformed JSON response from Gemini Vision: ${err.message}`,
      };
    }
  }
}
