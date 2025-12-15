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
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700"
        >
          {/* Tone/Title */}
          <div className="mb-3">
            <h3
              className="text-sm font-semibold text-indigo-600 dark:text-indigo-400"
              style={{ fontSize: `${fontSize - 2}px` }}
              dir="rtl"
            >
              {suggestion.tone}
            </h3>
          </div>

          {/* English Response */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                پاسخ انگلیسی:
              </label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleCopy(suggestion.responseEn)}
                >
                  کپی
                </Button>
                {playingIndex === index && isPlaying ? (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleCancel}
                    isLoading={true}
                  >
                    لغو
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handlePlay(index)}
                    disabled={playingIndex !== null && playingIndex !== index}
                  >
                    پخش صدا
                  </Button>
                )}
              </div>
            </div>
            <div
              className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              style={{ fontSize: `${fontSize}px` }}
              dir="ltr"
            >
              {suggestion.responseEn}
            </div>
          </div>

          {/* Persian Translation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ترجمه فارسی:
              </label>
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleCopy(suggestion.responseFa)}
              >
                کپی
              </Button>
            </div>
            <div
              className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
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

