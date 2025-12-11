import { Ollama } from 'ollama';
import { OllamaModel } from '../../models/OllamaModel';
import { validateTranslationResult, TranslationResult } from '../../utils/validation';
import { cacheService } from '../cache/CacheService';
import { AIChatRequest, AIChatResponse, AIChatOptions } from './types';

class AIChatService {
  private defaultTimeout = 120000; // 120 seconds
  private defaultMaxRetries = 3;

  async chat(
    request: AIChatRequest,
    options: AIChatOptions = {}
  ): Promise<AIChatResponse> {
    const {
      timeout = this.defaultTimeout,
      maxRetries = this.defaultMaxRetries,
      abortSignal,
      onProgress,
    } = options;

    const ollamaUrl = request.ollamaUrl || 'http://localhost:11434';
    const client = new Ollama({ host: ollamaUrl });

    // Check cache first
    const cachedResult = await cacheService.get(
      request.model,
      request.userInput,
      request.systemTemplate
    );

    if (cachedResult) {
      return {
        result: cachedResult,
        confidenceScore: this.calculateConfidenceScore(cachedResult),
      };
    }

    // Retry logic
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (abortSignal?.aborted) {
        throw new Error('Request aborted');
      }

      try {
        const result = await this.makeRequest(
          client,
          request,
          timeout,
          abortSignal,
          onProgress
        );

        if (result) {
          // Save to cache
          await cacheService.set(
            request.model,
            request.userInput,
            request.systemTemplate,
            result
          );

          return {
            result,
            confidenceScore: this.calculateConfidenceScore(result),
          };
        }
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw lastError || new Error('Failed to get valid response after retries');
  }

  private async makeRequest(
    client: Ollama,
    request: AIChatRequest,
    timeout: number,
    abortSignal?: AbortSignal,
    onProgress?: (progress: number) => void
  ): Promise<TranslationResult | null> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeout);

      const startTime = Date.now();

      client
        .generate({
          model: request.model,
          prompt: request.userInput,
          system: request.systemTemplate,
          options: {
            temperature: request.temperature ?? 0.7,
          },
          stream: true,
        })
        .then(async (stream) => {
          let fullResponse = '';

          try {
            for await (const chunk of stream) {
              if (abortSignal?.aborted) {
                clearTimeout(timeoutId);
                reject(new Error('Request aborted'));
                return;
              }

              if (chunk.response) {
                fullResponse += chunk.response;

                // Calculate progress (rough estimate)
                if (onProgress) {
                  const elapsed = Date.now() - startTime;
                  const estimatedProgress = Math.min(90, (elapsed / timeout) * 100);
                  onProgress(estimatedProgress);
                }
              }
            }

            clearTimeout(timeoutId);

            // Try to extract JSON from response
            const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const jsonStr = jsonMatch[0];
              const parsed = JSON.parse(jsonStr);
              const validated = validateTranslationResult(parsed);

              if (validated) {
                if (onProgress) {
                  onProgress(100);
                }
                resolve(validated);
              } else {
                reject(new Error('Invalid JSON structure'));
              }
            } else {
              reject(new Error('No JSON found in response'));
            }
          } catch (error) {
            clearTimeout(timeoutId);
            reject(error);
          }
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private calculateConfidenceScore(result: TranslationResult): number {
    // Simple confidence score based on result completeness
    let score = 0;
    const fields = [
      result.english_1,
      result.persian_1,
      result.english_2,
      result.persian_2,
      result.english_3,
      result.persian_3,
    ];

    fields.forEach((field) => {
      if (field && field.length > 0) {
        score += 1;
      }
    });

    return Math.round((score / fields.length) * 100);
  }
}

export const aiChatService = new AIChatService();

