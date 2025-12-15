import React, { useState } from 'react';
import { GrammarTeachingResult } from '../../../services/ai/AIChatService';
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
    <div className="border-2 border-white/30 dark:border-white/20 rounded-xl overflow-hidden backdrop-blur-md bg-white/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 flex items-center justify-between transition-all duration-300"
      >
        <span className="font-semibold text-white">{title}</span>
        <svg
          className={`w-5 h-5 text-white transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="p-4 bg-white/5">{children}</div>}
    </div>
  );
};

const DifficultyBadge: React.FC<{ level: string }> = ({ level }) => {
  const colors: Record<string, string> = {
    A1: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
    A2: 'bg-gradient-to-r from-green-400 to-teal-500 text-white',
    B1: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white',
    B2: 'bg-gradient-to-r from-orange-500 to-red-500 text-white',
    C1: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
    C2: 'bg-gradient-to-r from-red-600 to-rose-600 text-white',
  };

  return (
    <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-lg ${colors[level] || colors.B1}`}>
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
      <div className="backdrop-blur-xl bg-white/15 dark:bg-white/10 rounded-2xl shadow-lg p-6 border-2 border-white/30 dark:border-white/20 space-y-4">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          متن اصلی و اصلاح شده
        </h2>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                متن اصلی:
              </label>
              <div className="flex gap-2">
                <TTSButton text={result.originalText} className="hover:bg-white/20 text-white" />
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => handleCopy(result.originalText)}
                  className="rounded-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
                >
                  کپی
                </Button>
              </div>
            </div>
            <div className="p-4 backdrop-blur-md bg-white/20 dark:bg-white/15 rounded-xl border border-white/30 dark:border-white/20 shadow-inner">
              <p className="text-white font-medium" dir="ltr">{result.originalText}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                متن اصلاح شده:
              </label>
              <div className="flex gap-2">
                <TTSButton text={result.correctedText} className="hover:bg-white/20 text-white" />
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => handleCopy(result.correctedText)}
                  className="rounded-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
                >
                  کپی
                </Button>
              </div>
            </div>
            <div className="p-4 backdrop-blur-md bg-green-500/20 dark:bg-green-500/15 rounded-xl border border-green-300/30 dark:border-green-300/20 shadow-inner">
              <p className="text-white font-medium" dir="ltr">{result.correctedText}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Translation */}
      <div className="backdrop-blur-xl bg-white/15 dark:bg-white/10 rounded-2xl shadow-lg p-6 border-2 border-white/30 dark:border-white/20">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          ترجمه کامل
        </h2>
        <div className="flex items-start justify-between">
          <p className="text-white flex-1 leading-relaxed">{result.fullTranslationFa}</p>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => handleCopy(result.fullTranslationFa)}
            className="rounded-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
          >
            کپی
          </Button>
        </div>
      </div>

      {/* Learning Tips */}
      <div className="backdrop-blur-xl bg-blue-500/20 dark:bg-blue-500/15 rounded-2xl shadow-lg p-6 border-2 border-blue-300/30 dark:border-blue-300/20">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          نکات یادگیری
        </h2>
        <p className="text-white leading-relaxed">{result.learningTipsFa}</p>
      </div>

      {/* Grammar Teaching */}
      <div className="backdrop-blur-xl bg-white/15 dark:bg-white/10 rounded-2xl shadow-lg p-6 border-2 border-white/30 dark:border-white/20 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            آموزش گرامر
          </h2>
          <DifficultyBadge level={result.grammarTeaching.difficultyLevel} />
        </div>

        {/* Overview */}
        <CollapsibleSection title="نمای کلی" defaultOpen={true}>
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                توضیح انگلیسی:
              </h4>
              <div className="flex items-start justify-between">
                <p className="text-white flex-1" dir="ltr">{result.grammarTeaching.overviewEn}</p>
                <div className="flex gap-2 mr-2">
                  <TTSButton text={result.grammarTeaching.overviewEn} className="hover:bg-white/20 text-white" />
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => handleCopy(result.grammarTeaching.overviewEn)}
                    className="rounded-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
                  >
                    کپی
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                توضیح فارسی:
              </h4>
              <p className="text-white">{result.grammarTeaching.overviewFa}</p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Tense */}
        <CollapsibleSection title="زمان جمله" defaultOpen={true}>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-semibold text-white/80">زمان (انگلیسی):</span>
              <div className="flex items-center justify-between mt-1">
                <p className="text-white font-medium" dir="ltr">{result.grammarTeaching.sentenceTenseEn}</p>
                <TTSButton text={result.grammarTeaching.sentenceTenseEn} className="hover:bg-white/20 text-white" />
              </div>
            </div>
            <div>
              <span className="text-sm font-semibold text-white/80">زمان (فارسی):</span>
              <p className="text-white font-medium mt-1">{result.grammarTeaching.sentenceTenseFa}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-white/80">توضیح:</span>
              <p className="text-white/90 mt-1">{result.grammarTeaching.tenseExplanationFa}</p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Structure Pattern */}
        <CollapsibleSection title="الگوی ساختاری">
          <div className="space-y-3">
            <div>
              <span className="text-sm font-semibold text-white/80">الگو (انگلیسی):</span>
              <div className="flex items-center justify-between mt-1">
                <p className="text-white font-mono" dir="ltr">{result.grammarTeaching.structurePatternEn}</p>
                <TTSButton text={result.grammarTeaching.structurePatternEn} className="hover:bg-white/20 text-white" />
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Similar Examples */}
        {result.grammarTeaching.similarExamples.length > 0 && (
          <CollapsibleSection title="مثال‌های مشابه">
            <div className="space-y-4">
              {result.grammarTeaching.similarExamples.map((example: any, index: number) => (
                <div key={index} className="backdrop-blur-md bg-white/10 rounded-xl p-4 border border-white/20 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="p-3 backdrop-blur-md bg-white/20 rounded-lg border border-white/30 flex-1" dir="ltr">
                      <p className="text-white font-medium">{example.exampleEn}</p>
                    </div>
                    <TTSButton text={example.exampleEn} className="mr-2 hover:bg-white/20 text-white" />
                  </div>
                  <div className="p-3 backdrop-blur-md bg-white/20 rounded-lg border border-white/30" dir="rtl">
                    <p className="text-white">{example.exampleFa}</p>
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
              {result.grammarTeaching.keyPoints.map((point: any, index: number) => (
                <div key={index} className="backdrop-blur-md bg-yellow-500/20 rounded-xl p-4 border border-yellow-300/30">
                  <h4 className="font-bold text-white mb-2" dir="ltr">{point.titleEn}</h4>
                  <p className="text-white/90" dir="rtl">{point.explanationFa}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Common Mistakes */}
        {result.grammarTeaching.commonMistakes.length > 0 && (
          <CollapsibleSection title="اشتباهات رایج">
            <div className="space-y-4">
              {result.grammarTeaching.commonMistakes.map((mistake: any, index: number) => (
                <div key={index} className="backdrop-blur-md bg-red-500/20 rounded-xl p-4 border border-red-300/30">
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <span className="text-sm font-semibold text-white/80">اشتباه:</span>
                      <p className="text-red-200 line-through mt-1" dir="ltr">{mistake.originalSegmentEn}</p>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white/80">درست:</span>
                      <p className="text-green-200 font-bold mt-1" dir="ltr">{mistake.correctedSegmentEn}</p>
                    </div>
                  </div>
                  <p className="text-white/90 mt-2">{mistake.explanationFa}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>

      {/* Idioms and Phrases */}
      {result.idiomPhrases.length > 0 && (
        <div className="backdrop-blur-xl bg-white/15 dark:bg-white/10 rounded-2xl shadow-lg p-6 border-2 border-white/30 dark:border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            اصطلاحات و عبارات
          </h2>
          <div className="space-y-4">
            {result.idiomPhrases.map((phrase: any, index: number) => (
              <div key={index} className="backdrop-blur-md bg-purple-500/20 rounded-xl p-4 border border-purple-300/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs font-bold">
                      {phrase.type === 'idiom' ? 'اصطلاح' : phrase.type === 'phrasalVerb' ? 'فعل عبارتی' : phrase.type === 'collocation' ? 'کلوکیشن' : 'عبارت ثابت'}
                    </span>
                    <p className="text-white font-bold" dir="ltr">{phrase.phraseEn}</p>
                  </div>
                  <TTSButton text={phrase.phraseEn} className="hover:bg-white/20 text-white" />
                </div>
                <p className="text-white/90 mb-2">
                  <span className="font-bold">معنی:</span> {phrase.meaningFa}
                </p>
                <p className="text-white/90 mb-2">{phrase.explanationFa}</p>
                <div className="backdrop-blur-md bg-white/10 rounded-xl p-3 mt-2 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="p-2 backdrop-blur-md bg-white/20 rounded-lg border border-white/30 flex-1" dir="ltr">
                      <p className="text-white text-sm">{phrase.exampleEn}</p>
                    </div>
                    <TTSButton text={phrase.exampleEn} className="mr-2 hover:bg-white/20 text-white" />
                  </div>
                  <div className="p-2 backdrop-blur-md bg-white/20 rounded-lg border border-white/30" dir="rtl">
                    <p className="text-white text-sm">{phrase.exampleFa}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sentence Structure */}
      {result.sentenceStructure.length > 0 && (
        <div className="backdrop-blur-xl bg-white/15 dark:bg-white/10 rounded-2xl shadow-lg p-6 border-2 border-white/30 dark:border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            تحلیل ساختار جمله
          </h2>
          <div className="space-y-6">
            {result.sentenceStructure.map((sentence: any, sentenceIndex: number) => (
              <CollapsibleSection
                key={sentenceIndex}
                title={`جمله ${sentenceIndex + 1}: ${sentence.sentenceText.substring(0, 50)}...`}
              >
                <div className="space-y-4">
                  <div className="backdrop-blur-md bg-white/10 rounded-xl p-4 border border-white/20 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="p-3 backdrop-blur-md bg-white/20 rounded-lg border border-white/30 flex-1" dir="ltr">
                        <p className="text-white font-medium">{sentence.sentenceText}</p>
                      </div>
                      <TTSButton text={sentence.sentenceText} className="mr-2 hover:bg-white/20 text-white" />
                    </div>
                    <div className="p-3 backdrop-blur-md bg-white/20 rounded-lg border border-white/30" dir="rtl">
                      <p className="text-white">{sentence.sentenceTranslationFa}</p>
                    </div>
                    <div className="p-3 backdrop-blur-md bg-white/20 rounded-lg border border-white/30" dir="rtl">
                      <p className="text-white/80 text-sm">{sentence.patternFa}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-white mb-3">تحلیل کلمه به کلمه:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {sentence.tokens.map((token: any, tokenIndex: number) => (
                        <div
                          key={tokenIndex}
                          className="backdrop-blur-md bg-white/10 rounded-xl p-3 border border-white/20"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-white" dir="ltr">{token.token}</span>
                            <span className="text-xs px-2 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full font-semibold">
                              {token.partOfSpeech}
                            </span>
                          </div>
                          {token.normalized !== token.token && (
                            <p className="text-xs text-white/70 mb-1" dir="ltr">
                              پایه: {token.normalized}
                            </p>
                          )}
                          <p className="text-sm text-white/90 mb-1" dir="rtl">
                            <span className="font-bold">معنی:</span> {token.meaningFa}
                          </p>
                          <p className="text-xs text-white/80" dir="rtl">{token.roleExplanationFa}</p>
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

