import React, { useState, useMemo } from 'react';
import { useHistoryStore, HistoryEntry } from '../../../stores/historyStore';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';
import { Tabs, TabItem } from '../../ui/Tabs/Tabs';
import { Modal } from '../../ui/Modal/Modal';
import { AIModel, AI_MODELS } from '../../../models/AIModel';
import { GrammarTeachingResultComponent } from '../../grammar/GrammarTeachingResult/GrammarTeachingResult';
import { ResponseSuggestionsResult } from '../../response/ResponseSuggestionsResult/ResponseSuggestionsResult';

interface HistoryPanelProps {
  onSelectEntry?: (entry: HistoryEntry) => void;
  className?: string;
}

const ITEMS_PER_PAGE = 6;

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  onSelectEntry,
  className = '',
}) => {
  const { entries, searchQuery, setSearchQuery, deleteEntry, clearHistory, getFilteredEntries, loadEntries } =
    useHistoryStore();

  const filteredEntries = getFilteredEntries();
  const [currentPage, setCurrentPage] = useState(1);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  // Load entries from database on mount
  React.useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Handle Escape key to close modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showClearConfirmModal) {
        setShowClearConfirmModal(false);
      }
    };

    if (showClearConfirmModal) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [showClearConfirmModal]);

  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedEntries = useMemo(
    () => filteredEntries.slice(startIndex, endIndex),
    [filteredEntries, startIndex, endIndex]
  );

  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteEntry(id);
  };

  const handleSelect = (entry: HistoryEntry) => {
    if (onSelectEntry) {
      onSelectEntry(entry);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleClearHistory = async () => {
    await clearHistory();
    setShowClearConfirmModal(false);
    setCurrentPage(1);
  };

  const getModelLabel = (model: AIModel): string => {
    const modelItem = AI_MODELS.find((m) => m.value === model);
    return modelItem ? modelItem.label : model.toString();
  };

  const getTypeBadge = (type: HistoryEntry['type'], wordCount: number) => {
    let badgeText = '';
    let badgeColor = '';

    switch (type) {
      case 'persian-to-english':
        badgeText = 'Fa→En';
        badgeColor = 'bg-blue-500 dark:bg-blue-600';
        break;
      case 'english-to-persian':
        badgeText = 'En→Fa';
        badgeColor = 'bg-green-500 dark:bg-green-600';
        break;
      case 'grammar':
        badgeText = 'Grammar';
        badgeColor = 'bg-purple-500 dark:bg-purple-600';
        break;
      case 'grammar-teaching':
        badgeText = 'Grammar Teaching';
        badgeColor = 'bg-orange-500 dark:bg-orange-600';
        break;
      case 'response-suggestions':
        badgeText = 'Response Suggestions';
        badgeColor = 'bg-pink-500 dark:bg-pink-600';
        break;
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-white ${badgeColor}`}>
        {badgeText}
        <span className="bg-white/20 px-1 rounded">{wordCount}</span>
      </span>
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
  };

  const getFirstWords = (text: string, count: number = 5): string => {
    const words = text.trim().split(/\s+/).filter((word) => word.length > 0);
    const firstWords = words.slice(0, count);
    return firstWords.length === words.length ? firstWords.join(' ') : firstWords.join(' ') + '...';
  };

  const tabItems: TabItem[] = paginatedEntries.map((entry) => {
    const date = new Date(entry.timestamp);
    const dateStr = date.toLocaleString('fa-IR');
    const modelLabel = getModelLabel(entry.model);
    const wordCount = countWords(entry.input);
    const responseTimeStr = entry.responseTime ? formatTime(entry.responseTime) : 'N/A';

    // Create translation tabs if result exists
    let translationTabs: TabItem[] = [];
    if (entry.result) {
      translationTabs = [1, 2, 3]
        .filter((index) => {
          const englishKey = `english_${index}` as keyof typeof entry.result;
          const persianKey = `persian_${index}` as keyof typeof entry.result;
          const englishText = entry.result[englishKey] as string;
          const persianText = entry.result[persianKey] as string;
          return englishText || persianText;
        })
        .map((index) => {
          const englishKey = `english_${index}` as keyof typeof entry.result;
          const persianKey = `persian_${index}` as keyof typeof entry.result;
          const englishText = entry.result[englishKey] as string;
          const persianText = entry.result[persianKey] as string;

          return {
            id: `translation-${index}`,
            label: `ترجمه ${index}`,
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            ),
            content: (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-white mb-2 block flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    انگلیسی:
                  </label>
                  <div className="p-4 backdrop-blur-md bg-white/20 dark:bg-white/15 rounded-xl border border-white/30 dark:border-white/20 text-white font-medium shadow-inner" dir="ltr">
                    {englishText}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-white mb-2 block flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    فارسی:
                  </label>
                  <div className="p-4 backdrop-blur-md bg-white/20 dark:bg-white/15 rounded-xl border border-white/30 dark:border-white/20 text-white font-medium shadow-inner" dir="rtl">
                    {persianText}
                  </div>
                </div>
              </div>
            ),
          };
        });
    }

    return {
      id: entry.id,
      label: (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {getTypeBadge(entry.type, wordCount)}
            <span className="text-xs font-medium text-white/90">{modelLabel}</span>
            <span className="text-xs font-medium text-white/90">⏱ {responseTimeStr}</span>
          </div>
          <div className="text-xs font-medium text-white/90 dark:text-white/80 truncate max-w-full leading-tight" dir="auto">
            {getFirstWords(entry.input, 5)}
          </div>
        </div>
      ),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      content: (
        <div className="space-y-4">
          <div className="backdrop-blur-xl bg-white/15 dark:bg-white/10 rounded-2xl p-5 border-2 border-white/30 dark:border-white/20 shadow-lg">
            <label className="text-sm font-bold text-white mb-3 block flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              متن ورودی:
            </label>
            <div className="p-4 backdrop-blur-md bg-white/20 dark:bg-white/15 rounded-xl border border-white/30 dark:border-white/20 text-white font-medium shadow-inner">
              {entry.input}
            </div>
            <div className="mt-3 text-xs text-white/80 dark:text-gray-300 flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {dateStr}
            </div>
          </div>
          
          {entry.type === 'response-suggestions' && entry.responseSuggestionsResult ? (
            <div className="backdrop-blur-md bg-white/5 dark:bg-gray-900/10 rounded-xl p-4 border border-white/10 dark:border-gray-700/20">
              <ResponseSuggestionsResult
                result={entry.responseSuggestionsResult}
                onCopy={(text) => {
                  // Copy functionality handled by component
                }}
                fontSize={14}
              />
            </div>
          ) : entry.type === 'grammar-teaching' && entry.grammarTeachingResult ? (
            <div className="backdrop-blur-md bg-white/5 dark:bg-gray-900/10 rounded-xl p-4 border border-white/10 dark:border-gray-700/20">
              <GrammarTeachingResultComponent
                result={entry.grammarTeachingResult}
                onCopy={(text) => {
                  // Copy functionality handled by component
                }}
                fontSize={14}
              />
            </div>
          ) : translationTabs.length > 0 ? (
            <div className="backdrop-blur-xl bg-white/15 dark:bg-white/10 rounded-2xl p-5 border-2 border-white/30 dark:border-white/20 shadow-lg">
              <Tabs items={translationTabs} />
            </div>
          ) : null}
          
          <div className="flex gap-3 mt-4">
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleSelect(entry)}
              className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              استفاده
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={(e) => handleDelete(entry.id, e)}
              className="rounded-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              حذف
            </Button>
          </div>
        </div>
      ),
    };
  });

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-4">
        <Button
          size="sm"
          variant="danger"
          onClick={() => setShowClearConfirmModal(true)}
          disabled={entries.length === 0}
          className="rounded-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
        >
          پاک کردن همه
        </Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="جستجو در تاریخچه..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {filteredEntries.length === 0 ? (
        <div className="text-center py-12 text-white/80 dark:text-gray-300 backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-6">
          <svg className="w-16 h-16 mx-auto mb-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium">{searchQuery ? 'نتیجه‌ای یافت نشد' : 'تاریخچه خالی است'}</p>
        </div>
      ) : (
        <>
          {tabItems.length > 0 && <Tabs items={tabItems} />}
          
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-full backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30"
              >
                قبلی
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    size="sm"
                    variant={currentPage === page ? 'primary' : 'secondary'}
                    onClick={() => handlePageChange(page)}
                    className={`min-w-10 rounded-full transition-all duration-300 ${
                      currentPage === page 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg' 
                        : 'backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30'
                    }`}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-full backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30"
              >
                بعدی
              </Button>
            </div>
          )}
        </>
      )}

      {/* Clear History Confirmation Modal */}
      <Modal
        isOpen={showClearConfirmModal}
        onClose={() => setShowClearConfirmModal(false)}
        title="هشدار"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-white/90 dark:text-gray-300">
                حذف تمام تاریخچه
              </p>
            </div>
          </div>
          <p className="text-white/80 dark:text-gray-300">
            آیا مطمئن هستید که می‌خواهید تمام تاریخچه ترجمه را حذف کنید؟
          </p>
          <p className="text-sm text-white/70 dark:text-gray-400">
            این عمل قابل بازگشت نیست و تمام {entries.length} ورودی تاریخچه حذف خواهد شد.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowClearConfirmModal(false)}
              className="rounded-full"
            >
              لغو
            </Button>
            <Button
              variant="danger"
              onClick={handleClearHistory}
              className="rounded-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
            >
              تایید و حذف
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

