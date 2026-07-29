// File: backend/src/services/vision/geminiVisionEngine.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export interface GeminiEngineConfig {
  apiKey: string;
  modelName: string;
  temperature: number;
  timeoutMs: number;
  maxRetries: number;
}

export interface RawVisionResponse {
  responseText: string;
  modelUsed: string;
  executionTimeMs: number;
  retryCount: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
}

export class GeminiVisionEngine {
  private static DEFAULT_CONFIG: GeminiEngineConfig = {
    apiKey: process.env.GEMINI_API_KEY || '',
    modelName: 'gemini-2.5-flash',
    temperature: 0.1,
    timeoutMs: 30000, // 30 seconds strict timeout
    maxRetries: 2,    // 3 attempts total
  };

  /**
   * Executes a multimodal vision request to Gemini with exponential retries and timeout protection.
   */
  public static async executeVisionPrompt(
    imageBuffer: Buffer,
    mimeType: string,
    systemPrompt: string,
    config: Partial<GeminiEngineConfig> = {}
  ): Promise<RawVisionResponse> {
    const mergedConfig: GeminiEngineConfig = {
      ...this.DEFAULT_CONFIG,
      ...config,
      apiKey: config.apiKey || process.env.GEMINI_API_KEY || '',
    };

    if (!mergedConfig.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not defined.');
    }

    const genAI = new GoogleGenerativeAI(mergedConfig.apiKey);
    const startTime = Date.now();
    let attempt = 0;
    let lastError: any = null;

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    while (attempt <= mergedConfig.maxRetries) {
      try {
        let modelName = mergedConfig.modelName;
        if (attempt === 1) modelName = 'gemini-2.0-flash';
        else if (attempt === 2) modelName = 'gemini-2.5-flash';

        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: mergedConfig.temperature,
          },
          safetySettings,
        });

        const imagePart = {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType: mimeType || 'image/jpeg',
          },
        };

        // Timeout promise race
        const apiPromise = model.generateContent([systemPrompt, imagePart]);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini Vision API request timed out after ${mergedConfig.timeoutMs}ms`)), mergedConfig.timeoutMs)
        );

        const result = await Promise.race([apiPromise, timeoutPromise]);
        const responseText = result.response.text();
        const executionTimeMs = Date.now() - startTime;

        // Approximate token counting
        const estimatedInputTokens = Math.ceil(imageBuffer.length / 1024) + Math.ceil(systemPrompt.length / 4);
        const estimatedOutputTokens = Math.ceil(responseText.length / 4);

        return {
          responseText,
          modelUsed: modelName,
          executionTimeMs,
          retryCount: attempt,
          estimatedInputTokens,
          estimatedOutputTokens,
        };
      } catch (err: any) {
        lastError = err;
        attempt++;
        if (attempt <= mergedConfig.maxRetries) {
          const delayMs = Math.pow(2, attempt) * 500; // Exponential backoff (1s, 2s)
          console.warn(`Gemini Vision call failed (attempt ${attempt}/${mergedConfig.maxRetries + 1}). Retrying in ${delayMs}ms... Reason: ${err.message}`);
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
    }

    throw new Error(`Gemini Vision Engine failed after ${mergedConfig.maxRetries + 1} attempts. Last Error: ${lastError?.message || lastError}`);
  }
}
