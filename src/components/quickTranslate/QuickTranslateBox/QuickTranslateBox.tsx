import React, { useEffect, useRef, useState } from 'react';
import { ttsService } from '../../../services/tts/TTSService';
import { useBookmarkStore } from '../../../stores/bookmarkStore';

interface QuickTranslateBoxProps {
  text: string;
  translation: string | null;
  isLoading: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  timeout?: number; // seconds
  direction?: 'en-to-fa' | 'fa-to-en'; // Translation direction
}

export const QuickTranslateBox: React.FC<QuickTranslateBoxProps> = ({
  text,
  translation,
  isLoading,
  position,
  onClose,
  timeout = 5,
  direction = 'en-to-fa', // Default to English to Persian
}) => {
  // Detect language if direction not provided
  const detectLanguage = (text: string): 'en-to-fa' | 'fa-to-en' => {
    const persianRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return persianRegex.test(text) ? 'fa-to-en' : 'en-to-fa';
  };
  
  const actualDirection = direction || detectLanguage(text);
  const isPersianToEnglish = actualDirection === 'fa-to-en';
  const boxRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { checkBookmark, addBookmark, removeBookmark } = useBookmarkStore();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCheckingBookmark, setIsCheckingBookmark] = useState(true);

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

  // Check bookmark status on mount and when text changes
  useEffect(() => {
    const checkStatus = async () => {
      setIsCheckingBookmark(true);
      const bookmark = await checkBookmark(text);
      setIsBookmarked(!!bookmark);
      setIsCheckingBookmark(false);
    };
    checkStatus();
  }, [text, checkBookmark]);

  // Bookmark Button Component
  const BookmarkButton: React.FC = () => {
    const handleToggleBookmark = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isBookmarked) {
        // Remove bookmark
        const bookmark = await checkBookmark(text);
        if (bookmark) {
          await removeBookmark(bookmark.id);
          setIsBookmarked(false);
        }
      } else {
        // Add bookmark
        await addBookmark(text);
        setIsBookmarked(true);
      }
    };

    return (
      <button
        onClick={handleToggleBookmark}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className={`p-1.5 rounded-md hover:bg-white/20 transition-colors ${
          isBookmarked
            ? 'text-yellow-400 hover:text-yellow-300'
            : 'text-white/80 hover:text-white'
        }`}
        title={isBookmarked ? 'حذف از مورد علاقه‌ها' : 'افزودن به مورد علاقه‌ها'}
        disabled={isCheckingBookmark}
      >
        <svg
          className="w-4 h-4"
          fill={isBookmarked ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      </button>
    );
  };

  // TTS Button Component
  const TTSButton: React.FC<{ text: string }> = ({ text }) => {
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlay = async (e: React.MouseEvent) => {
      // Prevent event propagation to avoid triggering selection change
      e.preventDefault();
      e.stopPropagation();
      
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
        onMouseDown={(e) => {
          // Prevent mousedown from affecting selection
          e.preventDefault();
          e.stopPropagation();
        }}
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
      onMouseDown={(e) => {
        // Prevent mousedown on box from affecting text selection
        e.stopPropagation();
      }}
      onClick={(e) => {
        // Prevent click on box from affecting text selection
        e.stopPropagation();
      }}
    >
      <div
        className="relative rounded-lg shadow-2xl border border-white/20 backdrop-blur-md"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
        onMouseDown={(e) => {
          // Prevent mousedown on inner div from affecting text selection
          e.stopPropagation();
        }}
        onClick={(e) => {
          // Prevent click on inner div from affecting text selection
          e.stopPropagation();
        }}
      >
        {/* Close button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
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
              <div className="text-xs text-white/60">
                {isPersianToEnglish ? 'متن فارسی:' : 'متن انگلیسی:'}
              </div>
              <div className="flex items-center gap-1">
                <BookmarkButton />
                <TTSButton text={text} />
              </div>
            </div>
            <div className={`text-sm text-white/90 font-medium ${isPersianToEnglish ? 'dir-rtl' : 'dir-ltr'}`} dir={isPersianToEnglish ? 'rtl' : 'ltr'}>
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
              <div className="text-xs text-white/60 mb-1">
                {isPersianToEnglish ? 'ترجمه انگلیسی:' : 'ترجمه فارسی:'}
              </div>
              <div className={`text-sm text-white font-medium ${isPersianToEnglish ? 'dir-ltr' : 'dir-rtl'}`} dir={isPersianToEnglish ? 'ltr' : 'rtl'}>
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

