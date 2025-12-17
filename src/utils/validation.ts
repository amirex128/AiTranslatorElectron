import { z } from 'zod';
import { ResponseSuggestionsResult } from '../types/responseSuggestions';

export const TranslationResultSchema = z.object({
  english_1: z.string(),
  persian_1: z.string(),
  english_2: z.string(),
  persian_2: z.string(),
  english_3: z.string(),
  persian_3: z.string(),
});

export type TranslationResult = z.infer<typeof TranslationResultSchema>;

export const validateTranslationResult = (data: unknown): TranslationResult | null => {
  try {
    const parsed = TranslationResultSchema.parse(data);

    // Ensure at least one field has non-empty content so that
    // completely empty JSON objects are not treated as valid translations.
    const hasContent = Object.values(parsed).some(
      (value) => typeof value === 'string' && value.trim().length > 0
    );

    if (!hasContent) {
      console.error('Validation error for TranslationResult: all fields are empty');
      return null;
    }

    return parsed;
  } catch (error) {
    return null;
  }
};

export const ResponseSuggestionSchema = z.object({
  tone: z.string().min(1),
  responseEn: z.string().min(1),
  responseFa: z.string().min(1),
});

export const ResponseSuggestionsResultSchema = z.object({
  suggestions: z.array(ResponseSuggestionSchema).length(5),
});

export const validateResponseSuggestionsResult = (data: unknown): ResponseSuggestionsResult | null => {
  try {
    return ResponseSuggestionsResultSchema.parse(data);
  } catch (error) {
    console.error('Validation error for ResponseSuggestionsResult:', error);
    return null;
  }
};

