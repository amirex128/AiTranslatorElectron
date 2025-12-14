import React, { useState, useMemo } from 'react';
import { useHistoryStore, HistoryEntry } from '../../../stores/historyStore';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';
import { Accordion } from '../../ui/Accordion/Accordion';
import { AIModel, AI_MODELS } from '../../../models/AIModel';
import { GrammarTeachingResultComponent } from '../../grammar/GrammarTeachingResult/GrammarTeachingResult';
import { ResponseSuggestionsResult } from '../../response/ResponseSuggestionsResult/ResponseSuggestionsResult';

interface HistoryPanelProps {
  onSelectEntry?: (entry: HistoryEntry) => void;
  className?: string;
}

const ITEMS_PER_PAGE = 5;

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

  const accordionItems = paginatedEntries.map((entry) => {
    const date = new Date(entry.timestamp);
    const dateStr = date.toLocaleString('fa-IR');
    const modelLabel = getModelLabel(entry.model);
    const wordCount = countWords(entry.input);
    const responseTimeStr = entry.responseTime ? formatTime(entry.responseTime) : 'N/A';

    return {
      id: entry.id,
      title: (
        <div className="flex items-center gap-2 flex-wrap">
          {getTypeBadge(entry.type, wordCount)}
          <span className="text-xs text-gray-500 dark:text-gray-400">{modelLabel}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">⏱ {responseTimeStr}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{dateStr}</span>
        </div>
      ),
      defaultOpen: false,
      content: (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              متن ورودی:
            </label>
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100">
              {entry.input}
            </div>
          </div>
          
          {entry.type === 'response-suggestions' && entry.responseSuggestionsResult ? (
            <div>
              <ResponseSuggestionsResult
                result={entry.responseSuggestionsResult}
                onCopy={(text) => {
                  // Copy functionality handled by component
                }}
                fontSize={14}
              />
            </div>
          ) : entry.type === 'grammar-teaching' && entry.grammarTeachingResult ? (
            <div>
              <GrammarTeachingResultComponent
                result={entry.grammarTeachingResult}
                onCopy={(text) => {
                  // Copy functionality handled by component
                }}
                fontSize={14}
              />
            </div>
          ) : entry.result ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {[1, 2, 3].map((index) => {
                const englishKey = `english_${index}` as keyof typeof entry.result;
                const persianKey = `persian_${index}` as keyof typeof entry.result;
                const englishText = entry.result[englishKey] as string;
                const persianText = entry.result[persianKey] as string;
                
                return (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded p-2 space-y-2">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      ترجمه {index}
                    </div>
                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        انگلیسی:
                      </div>
                      <div className="text-sm text-gray-900 dark:text-gray-100" dir="ltr">
                        {englishText}
                      </div>
                    </div>
                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        فارسی:
                      </div>
                      <div className="text-sm text-gray-900 dark:text-gray-100" dir="rtl">
                        {persianText}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleSelect(entry)}
            >
              استفاده
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={(e) => handleDelete(entry.id, e)}
            >
              حذف
            </Button>
          </div>
        </div>
      ),
    };
  });

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          تاریخچه ترجمه
        </h2>
        <Button
          size="sm"
          variant="danger"
          onClick={() => setShowClearConfirmModal(true)}
          disabled={entries.length === 0}
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
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {searchQuery ? 'نتیجه‌ای یافت نشد' : 'تاریخچه خالی است'}
        </div>
      ) : (
        <>
          <Accordion items={accordionItems} />
          
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
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
                    className="min-w-10"
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
              >
                بعدی
              </Button>
            </div>
          )}
        </>
      )}

      {/* Clear History Confirmation Modal */}
      {showClearConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowClearConfirmModal(false)}
        >
          <div
            className="w-full max-w-md m-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600 dark:text-red-400"
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
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    هشدار
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    حذف تمام تاریخچه
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowClearConfirmModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                aria-label="بستن"
              >
                <svg
                  className="w-5 h-5"
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
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                آیا مطمئن هستید که می‌خواهید تمام تاریخچه ترجمه را حذف کنید؟
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                این عمل قابل بازگشت نیست و تمام {entries.length} ورودی تاریخچه حذف خواهد شد.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={() => setShowClearConfirmModal(false)}
              >
                لغو
              </Button>
              <Button
                variant="danger"
                onClick={handleClearHistory}
              >
                تایید و حذف
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

