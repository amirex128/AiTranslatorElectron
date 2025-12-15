import React, { useState } from 'react';
import { Tabs, TabItem } from '../../ui/Tabs/Tabs';
import { Bookmark } from '../../../main/database/BookmarkService';
import { ttsService } from '../../../services/tts/TTSService';

interface BookmarkTranslationsProps {
  bookmark: Bookmark;
}

export const BookmarkTranslations: React.FC<BookmarkTranslationsProps> = ({ bookmark }) => {
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const tabItems: TabItem[] = [];

  // Debug: Log bookmark data
  console.log('[BookmarkTranslations] Rendering bookmark:', {
    id: bookmark.id,
    hasMainTranslation: !!bookmark.mainTranslation,
    hasFallbackTranslation: !!bookmark.fallbackTranslation,
    hasQuickTranslation: !!(bookmark.quickTranslation || bookmark.persianTranslation),
    hasMainExamples: !!bookmark.mainExamples && bookmark.mainExamples.length > 0,
    hasFallbackExamples: !!bookmark.fallbackExamples && bookmark.fallbackExamples.length > 0,
  });

  // Add main translation if available
  if (bookmark.mainTranslation) {
    const translation = bookmark.mainTranslation.persian_1 || bookmark.mainTranslation.english_1;
    tabItems.push({
      id: 'main',
      label: 'ترجمه با مدل اصلی',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      ),
      content: (
        <div className="text-sm text-white font-medium" dir="rtl">
          {translation}
        </div>
      ),
    });
  }

  // Add fallback translation if available
  if (bookmark.fallbackTranslation) {
    const translation = bookmark.fallbackTranslation.persian_1 || bookmark.fallbackTranslation.english_1;
    tabItems.push({
      id: 'fallback',
      label: 'ترجمه با مدل جایگزین',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      ),
      content: (
        <div className="text-sm text-white font-medium" dir="rtl">
          {translation}
        </div>
      ),
    });
  }

  // Add quick translation if available
  if (bookmark.quickTranslation || bookmark.persianTranslation) {
    const translation = bookmark.quickTranslation || bookmark.persianTranslation;
    tabItems.push({
      id: 'quick',
      label: 'ترجمه سریع',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      content: (
        <div className="text-sm text-white font-medium" dir="rtl">
          {translation}
        </div>
      ),
    });
  }

  // Add main examples if available
  if (bookmark.mainExamples && bookmark.mainExamples.length > 0) {
    tabItems.push({
      id: 'main-examples',
      label: 'مثال‌های مدل اصلی',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      content: (
        <div className="space-y-3">
          {bookmark.mainExamples.map((example, index) => (
            <ExampleItem key={index} example={example} index={index} />
          ))}
        </div>
      ),
    });
  }

  // Add fallback examples if available
  if (bookmark.fallbackExamples && bookmark.fallbackExamples.length > 0) {
    tabItems.push({
      id: 'fallback-examples',
      label: 'مثال‌های مدل جایگزین',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      content: (
        <div className="space-y-3">
          {bookmark.fallbackExamples.map((example, index) => (
            <ExampleItem key={index} example={example} index={index} />
          ))}
        </div>
      ),
    });
  }

  // If no translations available, return null
  if (tabItems.length === 0) {
    return null;
  }

  const handleTabChange = (tabId: string) => {
    // Toggle: if clicking the same tab, close it; otherwise, open the new one
    setActiveTabId(activeTabId === tabId ? null : tabId);
  };

  return (
    <div className="mt-4">
      {/* Tab Headers */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tabItems.map((item) => {
          const isActive = activeTabId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`
                relative px-4 py-2 text-sm font-semibold transition-all duration-300 ease-in-out
                flex items-center gap-2 rounded-full backdrop-blur-md
                ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg'
                    : 'text-white/80 hover:text-white hover:bg-white/20 bg-white/10 border border-white/20'
                }
              `}
            >
              {item.icon && (
                <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-white/80'}`}>
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content - Only show if a tab is active */}
      {activeTabId && (
        <div className="animate-fade-in">
          {tabItems.find((item) => item.id === activeTabId)?.content}
        </div>
      )}
    </div>
  );
};

// Example Item Component with TTS Button
const ExampleItem: React.FC<{ example: { english: string; persian: string }; index: number }> = ({
  example,
  index,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async () => {
    if (isPlaying) {
      ttsService.stop();
      setIsPlaying(false);
    } else {
      try {
        setIsPlaying(true);
        await ttsService.speak(example.english, 1.0);
        setIsPlaying(false);
      } catch (error) {
        console.error('TTS Error:', error);
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="backdrop-blur-md bg-white/10 rounded-xl p-3 border border-white/20 last:border-b-0">
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-bold text-white">مثال {index + 1}:</p>
          <button
            onClick={handlePlay}
            className="p-1.5 rounded-full backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 text-white transition-all duration-300 hover:scale-110"
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
        </div>
        <p className="text-sm text-white font-medium" dir="ltr">
          {example.english}
        </p>
      </div>
      <div>
        <p className="text-sm font-bold text-white mb-1">ترجمه:</p>
        <p className="text-sm text-white font-medium" dir="rtl">
          {example.persian}
        </p>
      </div>
    </div>
  );
};

