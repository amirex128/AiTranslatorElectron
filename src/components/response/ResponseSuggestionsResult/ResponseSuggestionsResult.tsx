import React, { useState, useEffect } from 'react';
import { ResponseSuggestionsResult as ResponseSuggestionsResultType } from '../../../types/responseSuggestions';
import { Button } from '../../ui/Button/Button';
import { ttsService } from '../../../services/tts/TTSService';
import { useTTSStore } from '../../../stores/ttsStore';

interface ResponseSuggestionsResultProps {
  result: ResponseSuggestionsResultType;
  onCopy: (text: string) => void;
  fontSize?: number;
}

export const ResponseSuggestionsResult: React.FC<ResponseSuggestionsResultProps> = ({
  result,
  onCopy,
  fontSize = 16,
}) => {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const { isPlaying, progress, setIsPlaying, setProgress } = useTTSStore();

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && playingIndex !== null) {
        const currentProgress = ttsService.getProgress();
        setProgress(currentProgress);
        if (currentProgress >= 100) {
          setIsPlaying(false);
          setPlayingIndex(null);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, playingIndex, setProgress, setIsPlaying]);

  const handlePlay = async (index: number) => {
    // If the same response is playing, stop it
    if (playingIndex === index && isPlaying) {
      ttsService.stop();
      setIsPlaying(false);
      setPlayingIndex(null);
      return;
    }

    const suggestion = result.suggestions[index];
    if (!suggestion || !suggestion.responseEn) return;

    try {
      setPlayingIndex(index);
      setIsPlaying(true);
      setProgress(0);
      await ttsService.speak(suggestion.responseEn, 1.0);
      setIsPlaying(false);
      setProgress(100);
      setPlayingIndex(null);
    } catch (error) {
      console.error('TTS Error:', error);
      setIsPlaying(false);
      setPlayingIndex(null);
    }
  };

  const handleCancel = () => {
    ttsService.stop();
    setIsPlaying(false);
    setPlayingIndex(null);
  };

  const handleCopy = (text: string) => {
    onCopy(text);
  };

  return (
    <div className="space-y-4">
      {result.suggestions.map((suggestion, index) => (
        <div
          key={index}
          className="backdrop-blur-xl bg-white/15 dark:bg-white/10 rounded-2xl shadow-lg p-5 border-2 border-white/30 dark:border-white/20"
        >
          {/* Tone/Title */}
          <div className="mb-4">
            <h3
              className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300"
              style={{ fontSize: `${fontSize}px` }}
              dir="rtl"
            >
              {suggestion.tone}
            </h3>
          </div>

          {/* English Response */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                پاسخ انگلیسی:
              </label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleCopy(suggestion.responseEn)}
                  className="rounded-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
                >
                  کپی
                </Button>
                {playingIndex === index && isPlaying ? (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleCancel}
                    isLoading={true}
                    className="rounded-full"
                  >
                    لغو
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handlePlay(index)}
                    disabled={playingIndex !== null && playingIndex !== index}
                    className="rounded-full"
                  >
                    پخش صدا
                  </Button>
                )}
              </div>
            </div>
            <div
              className="p-4 backdrop-blur-md bg-white/20 dark:bg-white/15 rounded-xl border border-white/30 dark:border-white/20 text-white font-medium shadow-inner"
              style={{ fontSize: `${fontSize}px` }}
              dir="ltr"
            >
              {suggestion.responseEn}
            </div>
          </div>

          {/* Persian Translation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                ترجمه فارسی:
              </label>
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleCopy(suggestion.responseFa)}
                className="rounded-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
              >
                کپی
              </Button>
            </div>
            <div
              className="p-4 backdrop-blur-md bg-white/20 dark:bg-white/15 rounded-xl border border-white/30 dark:border-white/20 text-white font-medium shadow-inner"
              style={{ fontSize: `${fontSize}px` }}
              dir="rtl"
            >
              {suggestion.responseFa}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

