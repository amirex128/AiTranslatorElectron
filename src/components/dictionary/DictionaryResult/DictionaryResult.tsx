import React from 'react';
import { FastDicResult } from '../../../types/dictionary';
import { Tabs, TabItem } from '../../ui/Tabs/Tabs';
import { Button } from '../../ui/Button/Button';

interface DictionaryResultProps {
  result: FastDicResult;
  onCopy: (text: string) => void;
  fontSize?: number;
}

export const DictionaryResult: React.FC<DictionaryResultProps> = ({
  result,
  onCopy,
  fontSize = 16,
}) => {
  const tabItems: TabItem[] = [];

  // Meanings & Examples Tab
  if (result.meanings && result.meanings.length > 0) {
    tabItems.push({
      id: 'meanings',
      label: 'معنی‌ها و نمونه‌جمله‌ها',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          {/* Word Header */}
          <div className="backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-xl p-4 border border-white/20 dark:border-gray-700/30">
            <h2 className="text-2xl font-bold text-white mb-2" dir="ltr">{result.word}</h2>
            {result.pronunciation && result.pronunciation.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {result.pronunciation.map((pron, idx) => (
                  <span key={idx} className="text-sm text-white/80 font-mono" dir="ltr">
                    [{pron}]
                  </span>
                ))}
              </div>
            )}
            {result.verbForms && (
              <div className="mt-3 space-y-1 text-sm text-white/90">
                {result.verbForms.pastTense && (
                  <div>گذشته‌ی ساده: <strong dir="ltr">{result.verbForms.pastTense}</strong></div>
                )}
                {result.verbForms.pastParticiple && (
                  <div>شکل سوم: <strong dir="ltr">{result.verbForms.pastParticiple}</strong></div>
                )}
                {result.verbForms.thirdPersonSingular && (
                  <div>سوم‌شخص مفرد: <strong dir="ltr">{result.verbForms.thirdPersonSingular}</strong></div>
                )}
                {result.verbForms.presentParticiple && (
                  <div>وجه وصفی حال: <strong dir="ltr">{result.verbForms.presentParticiple}</strong></div>
                )}
                {result.verbForms.plural && (
                  <div>شکل جمع: <strong dir="ltr">{result.verbForms.plural}</strong></div>
                )}
              </div>
            )}
          </div>

          {/* Meanings */}
          {result.meanings.map((meaning, idx) => (
            <div key={idx} className="backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-xl p-4 border border-white/20 dark:border-gray-700/30">
              <div className="flex items-center gap-2 mb-3">
                {meaning.partOfSpeech && (
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-200">
                    {meaning.partOfSpeech}
                  </span>
                )}
                {meaning.level && (
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-500/30 text-purple-200">
                    {meaning.level}
                  </span>
                )}
              </div>
              
              {meaning.meaning && (
                <div className="mb-3">
                  <div className="text-white font-semibold mb-2">معنی:</div>
                  <div 
                    className="p-3 backdrop-blur-md bg-white/5 dark:bg-gray-900/20 rounded-lg border border-white/10 dark:border-gray-700/20 text-white"
                    style={{ fontSize: `${fontSize}px` }}
                    dir="rtl"
                  >
                    {meaning.meaning}
                  </div>
                </div>
              )}

              {meaning.examples && meaning.examples.length > 0 && (
                <div>
                  <div className="text-white font-semibold mb-2">نمونه‌جمله‌ها:</div>
                  <div className="space-y-2">
                    {meaning.examples.map((example, exIdx) => (
                      <div key={exIdx} className="p-3 backdrop-blur-md bg-white/5 dark:bg-gray-900/20 rounded-lg border border-white/10 dark:border-gray-700/20">
                        <div 
                          className="text-white/90 mb-1"
                          style={{ fontSize: `${fontSize}px` }}
                          dir="ltr"
                        >
                          {example.english}
                        </div>
                        <div 
                          className="text-white/80"
                          style={{ fontSize: `${fontSize}px` }}
                          dir="rtl"
                        >
                          {example.persian}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => onCopy(example.english)}
                            className="rounded-full"
                          >
                            کپی انگلیسی
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => onCopy(example.persian)}
                            className="rounded-full"
                          >
                            کپی فارسی
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ),
    });
  }

  // English-to-English Tab
  if (result.englishToEnglish) {
    tabItems.push({
      id: 'english-to-english',
      label: 'انگلیسی به انگلیسی',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      ),
      content: (
        <div className="backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-xl p-4 border border-white/20 dark:border-gray-700/30">
          <div 
            className="text-white"
            style={{ fontSize: `${fontSize}px` }}
            dir="ltr"
          >
            {result.englishToEnglish}
          </div>
          <div className="mt-3">
            <Button
              size="sm"
              variant="primary"
              onClick={() => onCopy(result.englishToEnglish || '')}
              className="rounded-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
            >
              کپی
            </Button>
          </div>
        </div>
      ),
    });
  }

  // Synonyms & Antonyms Tab
  if ((result.synonyms && result.synonyms.length > 0) || (result.antonyms && result.antonyms.length > 0)) {
    tabItems.push({
      id: 'synonyms-antonyms',
      label: 'مترادف و متضاد',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      ),
      content: (
        <div className="space-y-4">
          {result.synonyms && result.synonyms.length > 0 && (
            <div className="backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-xl p-4 border border-white/20 dark:border-gray-700/30">
              <div className="text-white font-semibold mb-3">مترادف:</div>
              <div className="flex flex-wrap gap-2">
                {result.synonyms.map((synonym, idx) => (
                  <button
                    key={idx}
                    onClick={() => onCopy(synonym)}
                    className="px-3 py-1.5 rounded-full bg-blue-500/30 hover:bg-blue-500/50 text-blue-200 text-sm transition-colors"
                    dir="ltr"
                  >
                    {synonym}
                  </button>
                ))}
              </div>
            </div>
          )}
          {result.antonyms && result.antonyms.length > 0 && (
            <div className="backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-xl p-4 border border-white/20 dark:border-gray-700/30">
              <div className="text-white font-semibold mb-3">متضاد:</div>
              <div className="flex flex-wrap gap-2">
                {result.antonyms.map((antonym, idx) => (
                  <button
                    key={idx}
                    onClick={() => onCopy(antonym)}
                    className="px-3 py-1.5 rounded-full bg-red-500/30 hover:bg-red-500/50 text-red-200 text-sm transition-colors"
                    dir="ltr"
                  >
                    {antonym}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    });
  }

  // Collocations Tab
  if (result.collocations && result.collocations.length > 0) {
    tabItems.push({
      id: 'collocations',
      label: 'Collocations',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
      content: (
        <div className="space-y-3">
          {result.collocations.map((collocation, idx) => (
            <div key={idx} className="backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-xl p-4 border border-white/20 dark:border-gray-700/30">
              <div className="flex items-start justify-between mb-2">
                <div 
                  className="text-white font-semibold"
                  style={{ fontSize: `${fontSize}px` }}
                  dir="ltr"
                >
                  {collocation.phrase}
                </div>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => onCopy(collocation.phrase)}
                  className="rounded-full"
                >
                  کپی
                </Button>
              </div>
              <div 
                className="text-white/80"
                style={{ fontSize: `${fontSize}px` }}
                dir="rtl"
              >
                {collocation.meaning}
              </div>
              {collocation.example && (
                <div 
                  className="text-white/70 mt-2 italic"
                  style={{ fontSize: `${fontSize - 2}px` }}
                  dir="ltr"
                >
                  مثال: {collocation.example}
                </div>
              )}
            </div>
          ))}
        </div>
      ),
    });
  }

  // Idioms Tab
  if (result.idioms && result.idioms.length > 0) {
    tabItems.push({
      id: 'idioms',
      label: 'Idioms',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      content: (
        <div className="space-y-3">
          {result.idioms.map((idiom, idx) => (
            <div key={idx} className="backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-xl p-4 border border-white/20 dark:border-gray-700/30">
              <div className="flex items-start justify-between mb-2">
                <div 
                  className="text-white font-semibold"
                  style={{ fontSize: `${fontSize}px` }}
                  dir="ltr"
                >
                  {idiom.phrase}
                </div>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => onCopy(idiom.phrase)}
                  className="rounded-full"
                >
                  کپی
                </Button>
              </div>
              <div 
                className="text-white/80"
                style={{ fontSize: `${fontSize}px` }}
                dir="rtl"
              >
                {idiom.meaning}
              </div>
              {idiom.example && (
                <div 
                  className="text-white/70 mt-2 italic"
                  style={{ fontSize: `${fontSize - 2}px` }}
                  dir="ltr"
                >
                  مثال: {idiom.example}
                </div>
              )}
            </div>
          ))}
        </div>
      ),
    });
  }

  // Related Words Tab
  if (result.relatedWords && result.relatedWords.length > 0) {
    tabItems.push({
      id: 'related-words',
      label: 'لغات هم‌خانواده',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      content: (
        <div className="backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-xl p-4 border border-white/20 dark:border-gray-700/30">
          <div className="flex flex-wrap gap-2">
            {result.relatedWords.map((word, idx) => (
              <button
                key={idx}
                onClick={() => onCopy(word)}
                className="px-3 py-1.5 rounded-full bg-purple-500/30 hover:bg-purple-500/50 text-purple-200 text-sm transition-colors"
                dir="ltr"
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      ),
    });
  }

  // Common Questions Tab
  if (result.commonQuestions && result.commonQuestions.length > 0) {
    tabItems.push({
      id: 'common-questions',
      label: 'سوال‌های رایج',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      content: (
        <div className="space-y-3">
          {result.commonQuestions.map((qa, idx) => (
            <div key={idx} className="backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-xl p-4 border border-white/20 dark:border-gray-700/30">
              <div className="text-white font-semibold mb-2" dir="rtl">
                {qa.question}
              </div>
              <div 
                className="text-white/80"
                style={{ fontSize: `${fontSize}px` }}
                dir="rtl"
              >
                {qa.answer}
              </div>
            </div>
          ))}
        </div>
      ),
    });
  }

  // Reference Tab
  if (result.reference) {
    tabItems.push({
      id: 'reference',
      label: 'ارجاع',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      content: (
        <div className="backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-xl p-4 border border-white/20 dark:border-gray-700/30">
          <div 
            className="text-white"
            style={{ fontSize: `${fontSize}px` }}
            dir="rtl"
          >
            {result.reference}
          </div>
          <div className="mt-3">
            <Button
              size="sm"
              variant="primary"
              onClick={() => onCopy(result.reference || '')}
              className="rounded-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
            >
              کپی
            </Button>
          </div>
        </div>
      ),
    });
  }

  if (tabItems.length === 0) {
    return (
      <div className="backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-xl p-4 border border-white/20 dark:border-gray-700/30">
        <div className="text-white text-center">هیچ داده‌ای یافت نشد</div>
      </div>
    );
  }

  return <Tabs items={tabItems} defaultActiveId={tabItems[0]?.id} />;
};

