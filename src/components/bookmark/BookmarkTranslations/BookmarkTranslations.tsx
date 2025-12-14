import React from 'react';
import { Accordion } from '../../ui/Accordion/Accordion';
import { Bookmark } from '../../../main/database/BookmarkService';

interface BookmarkTranslationsProps {
  bookmark: Bookmark;
}

export const BookmarkTranslations: React.FC<BookmarkTranslationsProps> = ({ bookmark }) => {
  const items = [];

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
    items.push({
      id: 'main',
      title: 'ترجمه با مدل اصلی',
      content: (
        <div className="text-xs text-gray-900 dark:text-white" dir="rtl">
          {translation}
        </div>
      ),
      defaultOpen: false,
    });
  }

  // Add fallback translation if available
  if (bookmark.fallbackTranslation) {
    const translation = bookmark.fallbackTranslation.persian_1 || bookmark.fallbackTranslation.english_1;
    items.push({
      id: 'fallback',
      title: 'ترجمه با مدل جایگزین',
      content: (
        <div className="text-xs text-gray-900 dark:text-white" dir="rtl">
          {translation}
        </div>
      ),
      defaultOpen: false,
    });
  }

  // Add quick translation if available
  if (bookmark.quickTranslation || bookmark.persianTranslation) {
    const translation = bookmark.quickTranslation || bookmark.persianTranslation;
    items.push({
      id: 'quick',
      title: 'ترجمه سریع',
      content: (
        <div className="text-xs text-gray-900 dark:text-white" dir="rtl">
          {translation}
        </div>
      ),
      defaultOpen: false,
    });
  }

  // Add main examples if available
  if (bookmark.mainExamples && bookmark.mainExamples.length > 0) {
    items.push({
      id: 'main-examples',
      title: 'مثال‌های مدل اصلی',
      content: (
        <div className="space-y-2">
          {bookmark.mainExamples.map((example, index) => (
            <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0">
              <div className="mb-1">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-0.5">مثال {index + 1}:</p>
                <p className="text-xs text-gray-900 dark:text-white" dir="ltr">
                  {example.english}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-0.5">ترجمه:</p>
                <p className="text-xs text-gray-900 dark:text-white" dir="rtl">
                  {example.persian}
                </p>
              </div>
            </div>
          ))}
        </div>
      ),
      defaultOpen: false,
    });
  }

  // Add fallback examples if available
  if (bookmark.fallbackExamples && bookmark.fallbackExamples.length > 0) {
    items.push({
      id: 'fallback-examples',
      title: 'مثال‌های مدل جایگزین',
      content: (
        <div className="space-y-2">
          {bookmark.fallbackExamples.map((example, index) => (
            <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0">
              <div className="mb-1">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-0.5">مثال {index + 1}:</p>
                <p className="text-xs text-gray-900 dark:text-white" dir="ltr">
                  {example.english}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-0.5">ترجمه:</p>
                <p className="text-xs text-gray-900 dark:text-white" dir="rtl">
                  {example.persian}
                </p>
              </div>
            </div>
          ))}
        </div>
      ),
      defaultOpen: false,
    });
  }

  // If no translations available, return null
  if (items.length === 0) {
    return null;
  }

  return <Accordion items={items} className="mt-4" />;
};

