import { z } from 'zod';

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
    return TranslationResultSchema.parse(data);
  } catch (error) {
    return null;
  }
};

