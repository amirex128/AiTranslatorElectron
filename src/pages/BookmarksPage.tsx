import React, { useState, useEffect } from 'react';
import { useBookmarkStore } from '../stores/bookmarkStore';
import { Button } from '../components/ui/Button/Button';
import { ttsService } from '../services/tts/TTSService';
import { Bookmark } from '../main/database/BookmarkService';
import { BookmarkTranslations } from '../components/bookmark/BookmarkTranslations/BookmarkTranslations';

interface BookmarksPageProps {
  onBack: () => void;
}

export const BookmarksPage: React.FC<BookmarksPageProps> = ({ onBack }) => {
  const {
    bookmarks,
    total,
    page,
    pageSize,
    totalPages,
    filters,
    isLoading,
    loadBookmarks,
    removeBookmark,
    updateBookmark,
    incrementReadCount,
    resetReadCount,
    setFilters,
    generateMainExamples,
    generateFallbackExamples,
    updateBookmarkInList,
  } = useBookmarkStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'alphabet' | 'readCount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [translationType, setTranslationType] = useState<'main' | 'fallback' | 'quick' | null>(null);
  const [generatingExamplesId, setGeneratingExamplesId] = useState<string | null>(null);
  const [exampleType, setExampleType] = useState<'main' | 'fallback' | null>(null);

  // Load bookmarks on mount and when filters change
  useEffect(() => {
    loadBookmarks({
      searchQuery: searchQuery || undefined,
      sortBy,
      sortOrder,
      page: 1,
      pageSize: 50,
    });
  }, [searchQuery, sortBy, sortOrder]);

  // Load bookmarks when page changes
  useEffect(() => {
    loadBookmarks({
      searchQuery: searchQuery || undefined,
      sortBy,
      sortOrder,
      page,
      pageSize: 50,
    });
  }, [page]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setFilters({ page: 1 }); // Reset to first page on search
  };

  const handleSortChange = (newSortBy: 'date' | 'alphabet' | 'readCount') => {
    if (sortBy === newSortBy) {
      // Toggle sort order if same sort field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc'); // Default to desc for new sort field
    }
    setFilters({ page: 1 }); // Reset to first page on sort change
  };

  const handleEdit = (bookmark: Bookmark) => {
    setEditingId(bookmark.id);
    setEditText(bookmark.englishText);
  };

  const handleSaveEdit = async (id: string) => {
    if (editText.trim()) {
      await updateBookmark(id, { englishText: editText.trim() });
      setEditingId(null);
      setEditText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleTranslate = async (id: string, type: 'main' | 'fallback' | 'quick') => {
    setTranslatingId(id);
    setTranslationType(type);

    try {
      let response;
      if (type === 'main') {
        response = await window.electronAPI.translateBookmarkMain(id);
      } else if (type === 'fallback') {
        response = await window.electronAPI.translateBookmarkFallback(id);
      } else {
        response = await window.electronAPI.translateBookmarkQuick(id);
      }

      if (response && 'success' in response && response.success && response.data) {
        console.log('[BookmarksPage] Translation completed, updating bookmark in list:', {
          type,
          bookmark: response.data,
        });
        // Update bookmark directly in store
        updateBookmarkInList(response.data);
        // Reload bookmarks for sync
        await loadBookmarks({
          searchQuery: searchQuery || undefined,
          sortBy,
          sortOrder,
          page,
          pageSize: 50,
        });
      } else {
        console.warn('[BookmarksPage] Translation failed or no data:', response);
      }
    } catch (error) {
      console.error('[BookmarksPage] Error translating:', error);
    } finally {
      setTranslatingId(null);
      setTranslationType(null);
    }
  };

  const handlePlaySound = async (text: string) => {
    try {
      await ttsService.speak(text, 1.0);
    } catch (error) {
      console.error('[BookmarksPage] Error playing sound:', error);
    }
  };

  const handleUnbookmark = async (id: string) => {
    if (confirm('آیا مطمئن هستید که می‌خواهید این مورد را از علاقه‌مندی‌ها حذف کنید؟')) {
      await removeBookmark(id);
    }
  };

  const handleIncrementReadCount = async (id: string) => {
    await incrementReadCount(id);
  };

  const handleResetReadCount = async (id: string) => {
    if (confirm('آیا مطمئن هستید که می‌خواهید شمارنده خواندن را صفر کنید؟')) {
      await resetReadCount(id);
    }
  };

  const handleGenerateExamples = async (id: string, type: 'main' | 'fallback') => {
    setGeneratingExamplesId(id);
    setExampleType(type);
    try {
      let updatedBookmark: Bookmark | null = null;
      if (type === 'main') {
        updatedBookmark = await generateMainExamples(id);
      } else {
        updatedBookmark = await generateFallbackExamples(id);
      }
      
      if (updatedBookmark) {
        console.log('[BookmarksPage] Examples generated successfully:', {
          type,
          bookmarkId: id,
          hasMainExamples: !!updatedBookmark.mainExamples && updatedBookmark.mainExamples.length > 0,
          hasFallbackExamples: !!updatedBookmark.fallbackExamples && updatedBookmark.fallbackExamples.length > 0,
        });
        // Bookmark is already updated in store by generateMainExamples/generateFallbackExamples
      } else {
        console.warn('[BookmarksPage] Failed to generate examples, no bookmark returned');
      }
    } catch (error) {
      console.error('[BookmarksPage] Error generating examples:', error);
    } finally {
      setGeneratingExamplesId(null);
      setExampleType(null);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              مورد علاقه‌ها
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {total} مورد علاقه‌مندی
            </p>
          </div>
          <Button variant="secondary" onClick={onBack}>
            بازگشت
          </Button>
        </div>

        {/* Search and Sort */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="جستجو در مورد علاقه‌ها..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'date' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleSortChange('date')}
            >
              تاریخ {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Button>
            <Button
              variant={sortBy === 'alphabet' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleSortChange('alphabet')}
            >
              الفبا {sortBy === 'alphabet' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Button>
            <Button
              variant={sortBy === 'readCount' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleSortChange('readCount')}
            >
              تعداد خواندن {sortBy === 'readCount' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Button>
          </div>
        </div>

        {/* Bookmarks List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {searchQuery ? 'نتیجه‌ای یافت نشد' : 'مورد علاقه‌ای وجود ندارد'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border border-gray-200 dark:border-gray-700"
              >
                {/* Bookmark Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    {editingId === bookmark.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          dir="ltr"
                          autoFocus
                        />
                        <Button size="sm" onClick={() => handleSaveEdit(bookmark.id)}>
                          ذخیره
                        </Button>
                        <Button size="sm" variant="secondary" onClick={handleCancelEdit}>
                          لغو
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <button
                            onClick={() => handlePlaySound(bookmark.englishText)}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                            title="پخش صدا"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(bookmark)}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                            title="ویرایش"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleIncrementReadCount(bookmark.id)}
                            className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors flex items-center gap-0.5"
                            title="افزایش تعداد خواندن"
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            <span className="text-xs font-medium">
                              {bookmark.readCount ?? 0}
                            </span>
                          </button>
                          {(bookmark.readCount ?? 0) > 0 && (
                            <button
                              onClick={() => handleResetReadCount(bookmark.id)}
                              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                              title="صفر کردن تعداد خواندن"
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
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                        <p
                          className="text-gray-900 dark:text-white text-sm whitespace-pre-wrap break-words"
                          dir="ltr"
                        >
                          {bookmark.englishText}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(bookmark.timestamp)}
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleUnbookmark(bookmark.id)}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                    title="حذف از علاقه‌مندی‌ها"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
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
                </div>

                {/* Translation and Example Buttons */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <Button
                    size="xs"
                    variant="primary"
                    isLoading={translatingId === bookmark.id && translationType === 'main'}
                    onClick={() => handleTranslate(bookmark.id, 'main')}
                    disabled={!!bookmark.mainTranslation}
                  >
                    {bookmark.mainTranslation ? '✓ اصلی' : 'اصلی'}
                  </Button>
                  <Button
                    size="xs"
                    variant="primary"
                    isLoading={translatingId === bookmark.id && translationType === 'fallback'}
                    onClick={() => handleTranslate(bookmark.id, 'fallback')}
                    disabled={!!bookmark.fallbackTranslation}
                  >
                    {bookmark.fallbackTranslation ? '✓ جایگزین' : 'جایگزین'}
                  </Button>
                  <Button
                    size="xs"
                    variant="primary"
                    isLoading={translatingId === bookmark.id && translationType === 'quick'}
                    onClick={() => handleTranslate(bookmark.id, 'quick')}
                    disabled={!!(bookmark.quickTranslation || bookmark.persianTranslation)}
                  >
                    {bookmark.quickTranslation || bookmark.persianTranslation
                      ? '✓ سریع'
                      : 'سریع'}
                  </Button>
                  <Button
                    size="xs"
                    variant="secondary"
                    isLoading={generatingExamplesId === bookmark.id && exampleType === 'main'}
                    onClick={() => handleGenerateExamples(bookmark.id, 'main')}
                    disabled={!!bookmark.mainExamples && bookmark.mainExamples.length > 0}
                  >
                    {bookmark.mainExamples && bookmark.mainExamples.length > 0
                      ? '✓ مثال اصلی'
                      : 'مثال اصلی'}
                  </Button>
                  <Button
                    size="xs"
                    variant="secondary"
                    isLoading={generatingExamplesId === bookmark.id && exampleType === 'fallback'}
                    onClick={() => handleGenerateExamples(bookmark.id, 'fallback')}
                    disabled={!!bookmark.fallbackExamples && bookmark.fallbackExamples.length > 0}
                  >
                    {bookmark.fallbackExamples && bookmark.fallbackExamples.length > 0
                      ? '✓ مثال جایگزین'
                      : 'مثال جایگزین'}
                  </Button>
                </div>

                {/* Translations Display (Accordion) */}
                <BookmarkTranslations bookmark={bookmark} />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFilters({ page: page - 1 })}
              disabled={page === 1}
            >
              قبلی
            </Button>
            <span className="text-gray-600 dark:text-gray-400">
              صفحه {page} از {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFilters({ page: page + 1 })}
              disabled={page === totalPages}
            >
              بعدی
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

