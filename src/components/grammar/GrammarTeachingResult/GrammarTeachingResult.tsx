import React, { useState } from 'react';
import { GrammarTeachingResult } from '../../../utils/grammarTeachingValidation';
import { ttsService } from '../../../services/tts/TTSService';
import { Button } from '../../ui/Button/Button';

interface GrammarTeachingResultProps {
  result: GrammarTeachingResult;
  onCopy: (text: string) => void;
  fontSize?: number;
}

const TTSButton: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async () => {
    if (isPlaying) {
      ttsService.stop();
      setIsPlaying(false);
    } else {
      try {
        setIsPlaying(true);
        await ttsService.speak(text, 1.0);
        setIsPlaying(false);
      } catch (error) {
        console.error('TTS Error:', error);
        setIsPlaying(false);
      }
    }
  };

  return (
    <button
      onClick={handlePlay}
      className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors ${className}`}
      title={isPlaying ? 'توقف' : 'پخش صدا'}
    >
      {isPlaying ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  );
};

const CollapsibleSection: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
      >
        <span className="font-medium text-gray-900 dark:text-white">{title}</span>
        <svg
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
};

const DifficultyBadge: React.FC<{ level: string }> = ({ level }) => {
  const colors: Record<string, string> = {
    A1: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    A2: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100',
    B1: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    B2: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    C1: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    C2: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[level] || colors.B1}`}>
      {level}
    </span>
  );
};

export const GrammarTeachingResultComponent: React.FC<GrammarTeachingResultProps> = ({
  result,
  onCopy,
  fontSize = 16,
}) => {
  const handleCopy = (text: string) => {
    onCopy(text);
  };

  return (
    <div className="space-y-6" style={{ fontSize: `${fontSize}px` }}>
      {/* Original vs Corrected */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">متن اصلی و اصلاح شده</h2>
        
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">متن اصلی:</label>
              <div className="flex gap-2">
                <TTSButton text={result.originalText} />
                <Button variant="ghost" size="sm" onClick={() => handleCopy(result.originalText)}>
                  کپی
                </Button>
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-gray-900 dark:text-white" dir="ltr">{result.originalText}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">متن اصلاح شده:</label>
              <div className="flex gap-2">
                <TTSButton text={result.correctedText} />
                <Button variant="ghost" size="sm" onClick={() => handleCopy(result.correctedText)}>
                  کپی
                </Button>
              </div>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-gray-900 dark:text-white" dir="ltr">{result.correctedText}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Translation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">ترجمه کامل</h2>
        <div className="flex items-start justify-between mb-2">
          <p className="text-gray-700 dark:text-gray-300 flex-1">{result.fullTranslationFa}</p>
          <Button variant="ghost" size="sm" onClick={() => handleCopy(result.fullTranslationFa)}>
            کپی
          </Button>
        </div>
      </div>

      {/* Learning Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-lg p-6 border border-blue-200 dark:border-blue-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>💡</span>
          نکات یادگیری
        </h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{result.learningTipsFa}</p>
      </div>

      {/* Grammar Teaching */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">آموزش گرامر</h2>
          <DifficultyBadge level={result.grammarTeaching.difficultyLevel} />
        </div>

        {/* Overview */}
        <CollapsibleSection title="نمای کلی" defaultOpen={true}>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">توضیح انگلیسی:</h4>
              <div className="flex items-start justify-between">
                <p className="text-gray-700 dark:text-gray-300 flex-1" dir="ltr">{result.grammarTeaching.overviewEn}</p>
                <div className="flex gap-2 mr-2">
                  <TTSButton text={result.grammarTeaching.overviewEn} />
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(result.grammarTeaching.overviewEn)}>
                    کپی
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">توضیح فارسی:</h4>
              <p className="text-gray-700 dark:text-gray-300">{result.grammarTeaching.overviewFa}</p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Tense */}
        <CollapsibleSection title="زمان جمله" defaultOpen={true}>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">زمان (انگلیسی):</span>
              <div className="flex items-center justify-between mt-1">
                <p className="text-gray-900 dark:text-white font-medium" dir="ltr">{result.grammarTeaching.sentenceTenseEn}</p>
                <TTSButton text={result.grammarTeaching.sentenceTenseEn} />
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">زمان (فارسی):</span>
              <p className="text-gray-900 dark:text-white font-medium mt-1">{result.grammarTeaching.sentenceTenseFa}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">توضیح:</span>
              <p className="text-gray-700 dark:text-gray-300 mt-1">{result.grammarTeaching.tenseExplanationFa}</p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Structure Pattern */}
        <CollapsibleSection title="الگوی ساختاری">
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">الگو (انگلیسی):</span>
              <div className="flex items-center justify-between mt-1">
                <p className="text-gray-900 dark:text-white font-mono" dir="ltr">{result.grammarTeaching.structurePatternEn}</p>
                <TTSButton text={result.grammarTeaching.structurePatternEn} />
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Similar Examples */}
        {result.grammarTeaching.similarExamples.length > 0 && (
          <CollapsibleSection title="مثال‌های مشابه">
            <div className="space-y-4">
              {result.grammarTeaching.similarExamples.map((example, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex-1" dir="ltr">
                      <p className="text-gray-900 dark:text-white font-medium">{example.exampleEn}</p>
                    </div>
                    <TTSButton text={example.exampleEn} className="mr-2" />
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700" dir="rtl">
                    <p className="text-gray-700 dark:text-gray-300">{example.exampleFa}</p>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Key Points */}
        {result.grammarTeaching.keyPoints.length > 0 && (
          <CollapsibleSection title="نکات کلیدی">
            <div className="space-y-3">
              {result.grammarTeaching.keyPoints.map((point, index) => (
                <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2" dir="ltr">{point.titleEn}</h4>
                  <p className="text-gray-700 dark:text-gray-300" dir="rtl">{point.explanationFa}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Common Mistakes */}
        {result.grammarTeaching.commonMistakes.length > 0 && (
          <CollapsibleSection title="اشتباهات رایج">
            <div className="space-y-4">
              {result.grammarTeaching.commonMistakes.map((mistake, index) => (
                <div key={index} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">اشتباه:</span>
                      <p className="text-red-700 dark:text-red-300 line-through mt-1" dir="ltr">{mistake.originalSegmentEn}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">درست:</span>
                      <p className="text-green-700 dark:text-green-300 font-medium mt-1" dir="ltr">{mistake.correctedSegmentEn}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mt-2">{mistake.explanationFa}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>

      {/* Idioms and Phrases */}
      {result.idiomPhrases.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">اصطلاحات و عبارات</h2>
          <div className="space-y-4">
            {result.idiomPhrases.map((phrase, index) => (
              <div key={index} className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded text-xs font-medium">
                      {phrase.type === 'idiom' ? 'اصطلاح' : phrase.type === 'phrasalVerb' ? 'فعل عبارتی' : phrase.type === 'collocation' ? 'کلوکیشن' : 'عبارت ثابت'}
                    </span>
                    <p className="text-gray-900 dark:text-white font-medium" dir="ltr">{phrase.phraseEn}</p>
                  </div>
                  <TTSButton text={phrase.phraseEn} />
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <span className="font-medium">معنی:</span> {phrase.meaningFa}
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-2">{phrase.explanationFa}</p>
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 mt-2 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 flex-1" dir="ltr">
                      <p className="text-gray-900 dark:text-white text-sm">{phrase.exampleEn}</p>
                    </div>
                    <TTSButton text={phrase.exampleEn} className="mr-2" />
                  </div>
                  <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700" dir="rtl">
                    <p className="text-gray-700 dark:text-gray-300 text-sm">{phrase.exampleFa}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sentence Structure */}
      {result.sentenceStructure.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">تحلیل ساختار جمله</h2>
          <div className="space-y-6">
            {result.sentenceStructure.map((sentence, sentenceIndex) => (
              <CollapsibleSection
                key={sentenceIndex}
                title={`جمله ${sentenceIndex + 1}: ${sentence.sentenceText.substring(0, 50)}...`}
              >
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 flex-1" dir="ltr">
                        <p className="text-gray-900 dark:text-white font-medium">{sentence.sentenceText}</p>
                      </div>
                      <TTSButton text={sentence.sentenceText} className="mr-2" />
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700" dir="rtl">
                      <p className="text-gray-700 dark:text-gray-300">{sentence.sentenceTranslationFa}</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700" dir="rtl">
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{sentence.patternFa}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">تحلیل کلمه به کلمه:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {sentence.tokens.map((token, tokenIndex) => (
                        <div
                          key={tokenIndex}
                          className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900 dark:text-white" dir="ltr">{token.token}</span>
                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                              {token.partOfSpeech}
                            </span>
                          </div>
                          {token.normalized !== token.token && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1" dir="ltr">
                              پایه: {token.normalized}
                            </p>
                          )}
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1" dir="rtl">
                            <span className="font-medium">معنی:</span> {token.meaningFa}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400" dir="rtl">{token.roleExplanationFa}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsibleSection>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

