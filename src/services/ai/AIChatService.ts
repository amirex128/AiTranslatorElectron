import { Ollama } from 'ollama';
import OpenAI from 'openai';
import { AIModel, isOpenRouterModel, getOpenRouterModelName, getOpenRouterApiKey } from '../../models/AIModel';
import { validateTranslationResult, TranslationResult } from '../../utils/validation';
import { AIChatRequest, AIChatResponse, AIChatOptions } from './types';

// Grammar teaching result type (without validation)
export type GrammarTeachingResult = any;

export interface AIChatServiceConfig {
  aiProviderUrl: string;
  temperature: number;
  openRouterBaseUrl: string;
  openRouterApiKey1: string;
  openRouterApiKey2: string;
  openRouterReferer: string;
  openRouterSiteName: string;
}

class AIChatService {
  private defaultTimeout = 120000; // 120 seconds
  private defaultMaxRetries = 3;
  private config: AIChatServiceConfig;

  constructor(config: AIChatServiceConfig) {
    this.config = config;
  }

  async chat(
    request: AIChatRequest,
    options: AIChatOptions = {}
  ): Promise<AIChatResponse> {
    const {
      timeout = this.defaultTimeout,
      maxRetries = this.defaultMaxRetries,
      abortSignal,
      onProgress,
      skipValidation = false,
    } = options;

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
            onProgress,
            skipValidation
          );
        } else {
          const aiProviderUrl = request.aiProviderUrl || this.config.aiProviderUrl;
          const client = new Ollama({ host: aiProviderUrl });
          result = await this.makeRequest(
            client,
            request,
            timeout,
            abortSignal,
            onProgress,
            skipValidation
          );
        }

        if (result) {
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

  async chatForGrammarTeaching(
    request: AIChatRequest,
    options: AIChatOptions = {}
  ): Promise<{ result: GrammarTeachingResult }> {
    const {
      timeout = this.defaultTimeout,
      maxRetries = this.defaultMaxRetries,
      abortSignal,
      onProgress,
    } = options;

    // Retry logic
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (abortSignal?.aborted) {
        throw new Error('Request aborted');
      }

      try {
        let result: GrammarTeachingResult | null = null;

        if (isOpenRouterModel(request.model)) {
          result = await this.makeOpenRouterRequestForGrammarTeaching(
            request,
            timeout,
            abortSignal,
            onProgress
          );
        } else {
          const aiProviderUrl = request.aiProviderUrl || this.config.aiProviderUrl;
          const client = new Ollama({ host: aiProviderUrl });
          result = await this.makeRequestForGrammarTeaching(
            client,
            request,
            timeout,
            abortSignal,
            onProgress
          );
        }

        if (result) {
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

  private async makeRequestForGrammarTeaching(
    client: Ollama,
    request: AIChatRequest,
    timeout: number,
    abortSignal?: AbortSignal,
    onProgress?: (progress: number) => void
  ): Promise<GrammarTeachingResult | null> {
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
            temperature: request.temperature ?? this.config.temperature,
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

              if (onProgress) {
                onProgress(100);
              }
              resolve(parsed as GrammarTeachingResult);
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

  private async makeOpenRouterRequestForGrammarTeaching(
    request: AIChatRequest,
    timeout: number,
    abortSignal?: AbortSignal,
    onProgress?: (progress: number) => void
  ): Promise<GrammarTeachingResult | null> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeout);

      const startTime = Date.now();
      const modelName = getOpenRouterModelName(request.model);
      const apiKey = getOpenRouterApiKey(request.model, this.config.openRouterApiKey1, this.config.openRouterApiKey2);

      const openai = new OpenAI({
        baseURL: this.config.openRouterBaseUrl,
        apiKey: apiKey,
        defaultHeaders: {
          'HTTP-Referer': this.config.openRouterReferer,
          'X-Title': this.config.openRouterSiteName,
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
          temperature: request.temperature ?? this.config.temperature,
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

              if (onProgress) {
                onProgress(100);
              }
              resolve(parsed as GrammarTeachingResult);
            } else {
              reject(new Error('No JSON found in response'));
            }
          } catch (error) {
            clearTimeout(timeoutId);
            reject(error);
          }
        })
        .catch((error: unknown) => {
          clearTimeout(timeoutId);
          // Extract more detailed error message from OpenRouter
          let errorMessage = 'Unknown error';
          if (error && typeof error === 'object') {
            const err = error as Record<string, any>;
            if (err.response?.data?.error?.message) {
              errorMessage = err.response.data.error.message;
            } else if (err.error?.message) {
              errorMessage = err.error.message;
            } else if (err.message) {
              errorMessage = err.message;
            }
          } else if (typeof error === 'string') {
            errorMessage = error;
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }
          reject(new Error(`OpenRouter API error: ${errorMessage}`));
        });
    });
  }

  private async makeRequest(
    client: Ollama,
    request: AIChatRequest,
    timeout: number,
    abortSignal?: AbortSignal,
    onProgress?: (progress: number) => void,
    skipValidation: boolean = false
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
            temperature: request.temperature ?? this.config.temperature,
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
              
              if (skipValidation) {
                // Return raw parsed JSON without validation
                if (onProgress) {
                  onProgress(100);
                }
                resolve(parsed as TranslationResult);
              } else {
                const validated = validateTranslationResult(parsed);

                if (validated) {
                  if (onProgress) {
                    onProgress(100);
                  }
                  resolve(validated);
                } else {
                  reject(new Error('Invalid JSON structure'));
                }
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
    onProgress?: (progress: number) => void,
    skipValidation: boolean = false
  ): Promise<TranslationResult | null> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeout);

      const startTime = Date.now();
      const modelName = getOpenRouterModelName(request.model);
      const apiKey = getOpenRouterApiKey(request.model, this.config.openRouterApiKey1, this.config.openRouterApiKey2);
      
      // Debug: Log the model name being sent
      console.log('OpenRouter Model Name:', modelName);

      const openai = new OpenAI({
        baseURL: this.config.openRouterBaseUrl,
        apiKey: apiKey,
        defaultHeaders: {
          'HTTP-Referer': this.config.openRouterReferer,
          'X-Title': this.config.openRouterSiteName,
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
                temperature: request.temperature ?? this.config.temperature,
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
        .catch((error: unknown) => {
          clearTimeout(timeoutId);
          // Extract more detailed error message from OpenRouter
          let errorMessage = 'Unknown error';
          if (error && typeof error === 'object') {
            const err = error as Record<string, any>;
            if (err.response?.data?.error?.message) {
              errorMessage = err.response.data.error.message;
            } else if (err.error?.message) {
              errorMessage = err.error.message;
            } else if (err.message) {
              errorMessage = err.message;
            }
          } else if (typeof error === 'string') {
            errorMessage = error;
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }
          reject(new Error(`OpenRouter API error: ${errorMessage}`));
        });
    });
  }
}

export { AIChatService };

