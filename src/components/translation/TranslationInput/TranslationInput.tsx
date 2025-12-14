import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Textarea } from '../../ui/Textarea/Textarea';
import { FullscreenEditor } from '../../ui/FullscreenEditor/FullscreenEditor';
import { UndoRedoManager } from '../../../utils/undoRedo';
import { HistoryEntry } from '../../../stores/historyStore';

interface TranslationInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  historyEntries?: HistoryEntry[];
  onSelectHistoryEntry?: (entry: HistoryEntry) => void;
  dir?: 'ltr' | 'rtl' | 'auto';
}

export const TranslationInput: React.FC<TranslationInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  autoFocus = false,
  className = '',
  historyEntries = [],
  onSelectHistoryEntry,
  dir = 'rtl',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const undoRedoManager = useRef(new UndoRedoManager<string>());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (value) {
      undoRedoManager.current.push(value);
    }
  }, [value]);

  // Filter history entries for autocomplete
  const autocompleteSuggestions = useMemo(() => {
    if (!value.trim() || historyEntries.length === 0) {
      return [];
    }
    
    const lowerValue = value.toLowerCase();
    const filtered = historyEntries
      .filter((entry) => entry.input.toLowerCase().includes(lowerValue))
      .slice(0, 5); // Show max 5 suggestions
    
    return filtered;
  }, [value, historyEntries]);

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowAutocomplete(newValue.trim().length > 0 && autocompleteSuggestions.length > 0);
  };

  const handleSelectHistoryEntry = (entry: HistoryEntry) => {
    if (onSelectHistoryEntry) {
      onSelectHistoryEntry(entry);
      setShowAutocomplete(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      const previousState = undoRedoManager.current.undo();
      if (previousState !== null) {
        onChange(previousState);
      }
    } else if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === 'y' || (e.key === 'z' && e.shiftKey))
    ) {
      e.preventDefault();
      const nextState = undoRedoManager.current.redo();
      if (nextState !== null) {
        onChange(nextState);
      }
    }
  };

  return (
    <>
      <div className="relative">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            label={label}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (value.trim().length > 0 && autocompleteSuggestions.length > 0) {
                setShowAutocomplete(true);
              }
            }}
            placeholder={placeholder}
            rows={6}
            className={className}
            dir={dir}
          />
          {/* Fullscreen Button - Bottom Left */}
          <button
            onClick={() => setIsFullscreen(true)}
            className="absolute bottom-2 left-2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200 z-10 group"
            aria-label="تمام صفحه"
            title="تمام صفحه"
          >
            <svg
              className="w-4 h-4 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>
          
          {/* Autocomplete Dropdown */}
          {showAutocomplete && autocompleteSuggestions.length > 0 && (
            <div
              ref={autocompleteRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
            >
              {autocompleteSuggestions.map((entry) => {
                // Get English and Persian text based on entry type
                let englishText = '';
                let persianText = '';
                
                if (entry.type === 'persian-to-english') {
                  // Input is Persian, result has English
                  persianText = entry.input;
                  if (entry.result) {
                    englishText = entry.result.english_1 || '';
                  }
                } else if (entry.type === 'english-to-persian') {
                  // Input is English, result has Persian
                  englishText = entry.input;
                  if (entry.result) {
                    persianText = entry.result.persian_1 || '';
                  }
                } else if (entry.type === 'grammar') {
                  // Input is English, result has corrected English and Persian
                  englishText = entry.input;
                  if (entry.result) {
                    persianText = entry.result.persian_1 || '';
                  }
                } else if (entry.type === 'grammar-teaching') {
                  // Input is English, grammarTeachingResult has original and corrected
                  if (entry.grammarTeachingResult) {
                    englishText = entry.grammarTeachingResult.originalText || entry.input;
                    persianText = entry.grammarTeachingResult.persianTranslation || '';
                  } else {
                    englishText = entry.input;
                  }
                } else if (entry.type === 'response-suggestions') {
                  // Input is English, responseSuggestionsResult has suggestions
                  englishText = entry.input;
                  if (entry.responseSuggestionsResult && entry.responseSuggestionsResult.suggestions.length > 0) {
                    persianText = entry.responseSuggestionsResult.suggestions[0].responseFa || '';
                  }
                }
                
                // Get type label
                const getTypeLabel = () => {
                  if (entry.type === 'persian-to-english') return 'فارسی به انگلیسی';
                  if (entry.type === 'english-to-persian') return 'انگلیسی به فارسی';
                  if (entry.type === 'grammar') return 'اصلاح گرامر';
                  if (entry.type === 'grammar-teaching') return 'آموزش گرامر';
                  if (entry.type === 'response-suggestions') return 'پیشنهاد پاسخ';
                  return '';
                };

                return (
                  <button
                    key={entry.id}
                    onClick={() => handleSelectHistoryEntry(entry)}
                    className="w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                  >
                    {/* English text in separate div with LTR */}
                    {englishText && (
                      <div className="text-sm text-gray-900 dark:text-gray-100 truncate mb-1" dir="ltr">
                        {englishText}
                      </div>
                    )}
                    {/* Persian text in separate div with RTL */}
                    {persianText && (
                      <div className="text-sm text-gray-900 dark:text-gray-100 truncate mb-1" dir="rtl">
                        {persianText}
                      </div>
                    )}
                    {/* Type label - always show */}
                    {getTypeLabel() && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium" dir="rtl">
                        {getTypeLabel()}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Editor Modal */}
      <FullscreenEditor
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        value={value}
        onChange={onChange}
        label={label}
        placeholder={placeholder}
        dir={dir}
      />
    </>
  );
};

