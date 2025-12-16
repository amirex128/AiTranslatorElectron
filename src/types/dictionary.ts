/**
 * Dictionary types for FastDic integration
 */

export interface FastDicMeaning {
  partOfSpeech: string; // noun, verb, etc.
  level?: string; // A1, A2, B2, etc.
  meaning: string; // Persian translation
  examples: Array<{
    english: string;
    persian: string;
  }>;
  notes?: string; // Additional notes or context
}

export interface FastDicVerbForms {
  pastTense?: string;
  pastParticiple?: string;
  thirdPersonSingular?: string;
  presentParticiple?: string;
  plural?: string;
}

export interface FastDicCollocation {
  phrase: string;
  meaning: string;
  example?: string;
}

export interface FastDicIdiom {
  phrase: string;
  meaning: string;
  example?: string;
}

export interface FastDicCommonQuestion {
  question: string;
  answer: string;
}

export interface FastDicResult {
  word: string;
  pronunciation: string[];
  verbForms?: FastDicVerbForms;
  meanings: FastDicMeaning[];
  englishToEnglish?: string;
  synonyms?: string[];
  antonyms?: string[];
  collocations?: FastDicCollocation[];
  idioms?: FastDicIdiom[];
  relatedWords?: string[];
  commonQuestions?: FastDicCommonQuestion[];
  reference?: string;
}

