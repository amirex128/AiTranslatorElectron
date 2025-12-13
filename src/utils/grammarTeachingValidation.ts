import { z } from 'zod';

// Difficulty level enum
const DifficultyLevelSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

// Part of speech enum
const PartOfSpeechSchema = z.enum([
  'noun',
  'properNoun',
  'pronoun',
  'verb',
  'auxVerb',
  'modalVerb',
  'adjective',
  'adverb',
  'preposition',
  'conjunction',
  'determiner',
  'article',
  'interjection',
  'number',
  'other',
]);

// Idiom type enum
const IdiomTypeSchema = z.enum(['idiom', 'phrasalVerb', 'collocation', 'fixedExpression']);

// Similar examples schema
const SimilarExampleSchema = z.object({
  exampleEn: z.string(),
  exampleFa: z.string(),
});

// Key points schema
const KeyPointSchema = z.object({
  titleEn: z.string(),
  explanationFa: z.string(),
});

// Common mistakes schema
const CommonMistakeSchema = z.object({
  originalSegmentEn: z.string(),
  correctedSegmentEn: z.string(),
  explanationFa: z.string(),
});

// Token schema
const TokenSchema = z.object({
  token: z.string(),
  normalized: z.string(),
  partOfSpeech: PartOfSpeechSchema,
  meaningFa: z.string(),
  roleExplanationFa: z.string(),
});

// Sentence structure schema
const SentenceStructureSchema = z.object({
  sentenceIndex: z.number(),
  sentenceText: z.string(),
  sentenceTranslationFa: z.string(),
  patternFa: z.string(),
  tokens: z.array(TokenSchema),
});

// Idiom phrases schema
const IdiomPhraseSchema = z.object({
  phraseEn: z.string(),
  type: IdiomTypeSchema,
  meaningFa: z.string(),
  explanationFa: z.string(),
  exampleEn: z.string(),
  exampleFa: z.string(),
});

// Grammar teaching schema
const GrammarTeachingSchema = z.object({
  overviewEn: z.string(),
  overviewFa: z.string(),
  sentenceTenseEn: z.string(),
  sentenceTenseFa: z.string(),
  tenseExplanationFa: z.string(),
  structurePatternEn: z.string(),
  difficultyLevel: DifficultyLevelSchema,
  similarExamples: z.array(SimilarExampleSchema),
  keyPoints: z.array(KeyPointSchema),
  commonMistakes: z.array(CommonMistakeSchema),
});

// Main grammar teaching result schema
export const GrammarTeachingResultSchema = z.object({
  originalText: z.string(),
  correctedText: z.string(),
  fullTranslationFa: z.string(),
  learningTipsFa: z.string(),
  grammarTeaching: GrammarTeachingSchema,
  idiomPhrases: z.array(IdiomPhraseSchema),
  sentenceStructure: z.array(SentenceStructureSchema),
});

export type GrammarTeachingResult = z.infer<typeof GrammarTeachingResultSchema>;

export const validateGrammarTeachingResult = (data: unknown): GrammarTeachingResult | null => {
  try {
    return GrammarTeachingResultSchema.parse(data);
  } catch (error) {
    console.error('Grammar teaching validation error:', error);
    return null;
  }
};

