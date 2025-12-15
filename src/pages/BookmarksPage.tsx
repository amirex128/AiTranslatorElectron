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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4 animate-fade-in">
        {/* Header with Gradient */}
        <div className="backdrop-blur-lg bg-white/10 dark:bg-gray-900/20 rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-indigo-100 dark:from-white dark:to-indigo-200 bg-clip-text text-transparent">
                  مورد علاقه‌ها
                </h1>
                <p className="text-white/80 mt-1">
                  {total} مورد علاقه‌مندی
                </p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              onClick={onBack}
              className="rounded-full backdrop-blur-md bg-white/10 border-white/20 text-white hover:bg-white/20 shadow-lg"
            >
              بازگشت
            </Button>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="backdrop-blur-lg bg-white/10 dark:bg-gray-900/20 rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/30">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="جستجو در مورد علاقه‌ها..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full px-4 py-3 backdrop-blur-md bg-white/20 dark:bg-white/15 rounded-xl border-2 border-white/30 dark:border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-inner"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={sortBy === 'date' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleSortChange('date')}
                className={`rounded-full ${
                  sortBy === 'date'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                    : 'backdrop-blur-md bg-white/10 border-white/20 text-white hover:bg-white/20'
                } shadow-lg`}
              >
                تاریخ {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
              </Button>
              <Button
                variant={sortBy === 'alphabet' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleSortChange('alphabet')}
                className={`rounded-full ${
                  sortBy === 'alphabet'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                    : 'backdrop-blur-md bg-white/10 border-white/20 text-white hover:bg-white/20'
                } shadow-lg`}
              >
                الفبا {sortBy === 'alphabet' && (sortOrder === 'desc' ? '↓' : '↑')}
              </Button>
              <Button
                variant={sortBy === 'readCount' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleSortChange('readCount')}
                className={`rounded-full ${
                  sortBy === 'readCount'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                    : 'backdrop-blur-md bg-white/10 border-white/20 text-white hover:bg-white/20'
                } shadow-lg`}
              >
                تعداد خواندن {sortBy === 'readCount' && (sortOrder === 'desc' ? '↓' : '↑')}
              </Button>
            </div>
          </div>
        </div>

        {/* Bookmarks List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12 backdrop-blur-lg bg-white/10 dark:bg-gray-900/20 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-12 backdrop-blur-lg bg-white/10 dark:bg-gray-900/20 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30">
            <svg className="w-16 h-16 text-white/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-white/80 text-lg">
              {searchQuery ? 'نتیجه‌ای یافت نشد' : 'مورد علاقه‌ای وجود ندارد'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="backdrop-blur-xl bg-white/15 dark:bg-white/10 rounded-2xl shadow-lg p-4 border-2 border-white/30 dark:border-white/20 transition-all duration-300 hover:shadow-xl hover:scale-[1.01]"
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
                          className="flex-1 px-4 py-2 backdrop-blur-md bg-white/20 dark:bg-white/15 rounded-xl border-2 border-white/30 dark:border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-inner"
                          dir="ltr"
                          autoFocus
                        />
                        <Button 
                          size="sm" 
                          onClick={() => handleSaveEdit(bookmark.id)}
                          className="rounded-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg"
                        >
                          ذخیره
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          onClick={handleCancelEdit}
                          className="rounded-full backdrop-blur-md bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          لغو
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={() => handlePlaySound(bookmark.englishText)}
                            className="p-2 rounded-full backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 text-white transition-all duration-300 hover:scale-110"
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
                            className="p-2 rounded-full backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 text-white transition-all duration-300 hover:scale-110"
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
                            className="p-2 rounded-full backdrop-blur-md bg-blue-500/20 border border-blue-300/30 hover:bg-blue-500/30 text-white transition-all duration-300 hover:scale-110 flex items-center gap-1"
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
                            <span className="text-xs font-bold">
                              {bookmark.readCount ?? 0}
                            </span>
                          </button>
                          {(bookmark.readCount ?? 0) > 0 && (
                            <button
                              onClick={() => handleResetReadCount(bookmark.id)}
                              className="p-2 rounded-full backdrop-blur-md bg-red-500/20 border border-red-300/30 hover:bg-red-500/30 text-white transition-all duration-300 hover:scale-110"
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
                          className="text-white text-sm whitespace-pre-wrap break-words font-medium"
                          dir="ltr"
                        >
                          {bookmark.englishText}
                        </p>
                        <p className="text-xs text-white/70 mt-1">
                          {formatDate(bookmark.timestamp)}
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleUnbookmark(bookmark.id)}
                    className="p-2 rounded-full backdrop-blur-md bg-red-500/20 border border-red-300/30 hover:bg-red-500/30 text-white transition-all duration-300 hover:scale-110"
                    title="حذف از علاقه‌مندی‌ها"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                {/* Translation and Example Buttons */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <Button
                    size="xs"
                    variant="primary"
                    isLoading={translatingId === bookmark.id && translationType === 'main'}
                    onClick={() => handleTranslate(bookmark.id, 'main')}
                    disabled={!!bookmark.mainTranslation}
                    className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg"
                  >
                    {bookmark.mainTranslation ? '✓ اصلی' : 'اصلی'}
                  </Button>
                  <Button
                    size="xs"
                    variant="primary"
                    isLoading={translatingId === bookmark.id && translationType === 'fallback'}
                    onClick={() => handleTranslate(bookmark.id, 'fallback')}
                    disabled={!!bookmark.fallbackTranslation}
                    className="rounded-full bg-gradient-to-r from-pink-500 to-red-600 hover:from-pink-600 hover:to-red-700 text-white shadow-lg"
                  >
                    {bookmark.fallbackTranslation ? '✓ جایگزین' : 'جایگزین'}
                  </Button>
                  <Button
                    size="xs"
                    variant="primary"
                    isLoading={translatingId === bookmark.id && translationType === 'quick'}
                    onClick={() => handleTranslate(bookmark.id, 'quick')}
                    disabled={!!(bookmark.quickTranslation || bookmark.persianTranslation)}
                    className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg"
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
                    className="rounded-full backdrop-blur-md bg-white/10 border-white/20 text-white hover:bg-white/20 shadow-md"
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
                    className="rounded-full backdrop-blur-md bg-white/10 border-white/20 text-white hover:bg-white/20 shadow-md"
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
          <div className="backdrop-blur-lg bg-white/10 dark:bg-gray-900/20 rounded-2xl p-4 shadow-xl border border-white/20 dark:border-gray-700/30 flex items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFilters({ page: page - 1 })}
              disabled={page === 1}
              className="rounded-full backdrop-blur-md bg-white/10 border-white/20 text-white hover:bg-white/20 shadow-md disabled:opacity-50"
            >
              قبلی
            </Button>
            <span className="text-white font-medium">
              صفحه {page} از {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFilters({ page: page + 1 })}
              disabled={page === totalPages}
              className="rounded-full backdrop-blur-md bg-white/10 border-white/20 text-white hover:bg-white/20 shadow-md disabled:opacity-50"
            >
              بعدی
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

