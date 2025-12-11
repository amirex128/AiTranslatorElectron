import { Ollama } from 'ollama';
import OpenAI from 'openai';
import { AIModel, isOpenRouterModel, getOpenRouterModelName, getOpenRouterApiKey } from '../../models/AIModel';
import { APP_CONFIG } from '../../constants/appConfig';
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

    // Check cache first
    const cachedResult = await cacheService.get(
      request.model,
      request.userInput,
      request.systemTemplate
    );

    if (cachedResult) {
      return {
        result: cachedResult,
      };
    }

    // Retry logic
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (abortSignal?.aborted) {
        throw new Error('Request aborted');
      }

      try {
        let result: TranslationResult | null = null;

        if (isOpenRouterModel(request.model)) {
          result = await this.makeOpenRouterRequest(
            request,
            timeout,
            abortSignal,
            onProgress
          );
        } else {
          const aiProviderUrl = request.aiProviderUrl || APP_CONFIG.aiProviderUrl;
          const client = new Ollama({ host: aiProviderUrl });
          result = await this.makeRequest(
            client,
            request,
            timeout,
            abortSignal,
            onProgress
          );
        }

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
            temperature: request.temperature ?? APP_CONFIG.temperature,
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

  private async makeOpenRouterRequest(
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
      const modelName = getOpenRouterModelName(request.model);
      const apiKey = getOpenRouterApiKey(request.model);
      
      // Debug: Log the model name being sent
      console.log('OpenRouter Model Name:', modelName);

      const openai = new OpenAI({
        baseURL: APP_CONFIG.openRouterBaseUrl,
        apiKey: apiKey,
        defaultHeaders: {
          'HTTP-Referer': APP_CONFIG.openRouterReferer,
          'X-Title': APP_CONFIG.openRouterSiteName,
        },
      });

      const messages = [
        {
          role: 'system' as const,
          content: request.systemTemplate,
        },
        {
          role: 'user' as const,
          content: request.userInput,
        },
      ];

      openai.chat.completions
        .create({
          model: modelName,
          messages: messages,
          temperature: request.temperature ?? APP_CONFIG.temperature,
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

              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                fullResponse += content;

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
        .catch((error: any) => {
          clearTimeout(timeoutId);
          // Extract more detailed error message from OpenRouter
          let errorMessage = 'Unknown error';
          if (error?.response?.data?.error?.message) {
            errorMessage = error.response.data.error.message;
          } else if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error?.message) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          }
          reject(new Error(`OpenRouter API error: ${errorMessage}`));
        });
    });
  }
}

export const aiChatService = new AIChatService();

