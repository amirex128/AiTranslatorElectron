import React from 'react';
import { useHistoryStore, HistoryEntry } from '../../../stores/historyStore';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';
import { Accordion } from '../../ui/Accordion/Accordion';

interface HistoryPanelProps {
  onSelectEntry?: (entry: HistoryEntry) => void;
  className?: string;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  onSelectEntry,
  className = '',
}) => {
  const { entries, searchQuery, setSearchQuery, deleteEntry, getFilteredEntries } =
    useHistoryStore();

  const filteredEntries = getFilteredEntries();

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteEntry(id);
  };

  const handleSelect = (entry: HistoryEntry) => {
    if (onSelectEntry) {
      onSelectEntry(entry);
    }
  };

  const accordionItems = filteredEntries.map((entry) => {
    const date = new Date(entry.timestamp);
    const dateStr = date.toLocaleString('fa-IR');

    return {
      id: entry.id,
      title: `${entry.type} - ${dateStr}`,
      defaultOpen: false,
      content: (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              متن ورودی:
            </label>
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-sm">
              {entry.input}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[1, 2, 3].map((index) => {
              const englishKey = `english_${index}` as keyof typeof entry.result;
              const persianKey = `persian_${index}` as keyof typeof entry.result;
              return (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded p-2">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    ترجمه {index}
                  </div>
                  <div className="text-sm mb-1">
                    <strong>EN:</strong> {(entry.result[englishKey] as string).substring(0, 50)}...
                  </div>
                  <div className="text-sm">
                    <strong>FA:</strong> {(entry.result[persianKey] as string).substring(0, 50)}...
                  </div>
                </div>
              );
            })}
          </div>
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
          variant="secondary"
          onClick={() => useHistoryStore.getState().clearHistory()}
          disabled={entries.length === 0}
        >
          پاک کردن همه
        </Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="جستجو در تاریخچه..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredEntries.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {searchQuery ? 'نتیجه‌ای یافت نشد' : 'تاریخچه خالی است'}
        </div>
      ) : (
        <Accordion items={accordionItems} />
      )}
    </div>
  );
};

