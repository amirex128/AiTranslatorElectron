import React, { useEffect, useRef, useState } from 'react';
import { ttsService } from '../../../services/tts/TTSService';

interface QuickTranslateBoxProps {
  text: string;
  translation: string | null;
  isLoading: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  timeout?: number; // seconds
}

export const QuickTranslateBox: React.FC<QuickTranslateBoxProps> = ({
  text,
  translation,
  isLoading,
  position,
  onClose,
  timeout = 5,
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-close after timeout
  useEffect(() => {
    if (timeout > 0 && !isLoading) {
      timeoutRef.current = setTimeout(() => {
        onClose();
      }, timeout * 1000);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [timeout, isLoading, onClose]);

  // Calculate smart position
  useEffect(() => {
    if (boxRef.current) {
      const box = boxRef.current;
      const boxRect = box.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let finalX = position.x;
      let finalY = position.y;

      // Smart positioning: prefer right, fallback to left, then below
      const spaceRight = viewportWidth - position.x;
      const spaceLeft = position.x;
      const spaceBelow = viewportHeight - position.y;

      if (spaceRight >= boxRect.width + 20) {
        // Enough space on right
        finalX = position.x + 20;
      } else if (spaceLeft >= boxRect.width + 20) {
        // Enough space on left
        finalX = position.x - boxRect.width - 20;
      } else {
        // Not enough space on sides, place below
        finalX = Math.max(20, Math.min(position.x, viewportWidth - boxRect.width - 20));
        finalY = position.y + 30;
      }

      // Ensure box stays within viewport
      finalX = Math.max(20, Math.min(finalX, viewportWidth - boxRect.width - 20));
      finalY = Math.max(20, Math.min(finalY, viewportHeight - boxRect.height - 20));

      box.style.left = `${finalX}px`;
      box.style.top = `${finalY}px`;
    }
  }, [position]);

  // TTS Button Component
  const TTSButton: React.FC<{ text: string }> = ({ text }) => {
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
        className="p-1.5 rounded-md hover:bg-white/20 text-white/80 hover:text-white transition-colors"
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

  return (
    <div
      ref={boxRef}
      className="fixed z-50 pointer-events-auto animate-fadeIn"
      style={{
        maxWidth: '400px',
        minWidth: '200px',
      }}
    >
      <div
        className="relative rounded-lg shadow-2xl border border-white/20 backdrop-blur-md"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white z-10"
          aria-label="Close"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="p-4 pt-8">
          {/* Original text */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-white/60">متن انگلیسی:</div>
              <TTSButton text={text} />
            </div>
            <div className="text-sm text-white/90 font-medium" dir="ltr">
              {text}
            </div>
          </div>

          {/* Translation or loading */}
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="relative w-6 h-6">
                <svg
                  className="animate-spin h-6 w-6 text-white/80"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            </div>
          ) : translation ? (
            <div>
              <div className="text-xs text-white/60 mb-1">ترجمه فارسی:</div>
              <div className="text-sm text-white font-medium" dir="rtl">
                {translation}
              </div>
            </div>
          ) : (
            <div className="text-sm text-white/60">خطا در ترجمه</div>
          )}
        </div>
      </div>
    </div>
  );
};

