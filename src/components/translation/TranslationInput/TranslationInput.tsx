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
  shortcut?: string;
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
  shortcut,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const undoRedoManager = useRef(new UndoRedoManager<string>());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const speechStatusListenerRef = useRef<((status: { isListening: boolean }) => void) | null>(null);

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

  // Format shortcut for display (replace + with space for better readability)
  const formatShortcut = (shortcut: string): string => {
    return shortcut.replace(/\+/g, ' + ');
  };

  // Speech Recognition handlers
  const handleMicrophoneClick = async () => {
    if (isListening) {
      // Stop recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (typeof window !== 'undefined' && window.electronAPI) {
        try {
          await window.electronAPI.stopSpeechRecognition();
        } catch (error) {
          console.error('Error stopping speech recognition:', error);
        }
      }
      setIsListening(false);
      return;
    }

    // Focus the textarea first to ensure text is inserted here
    if (textareaRef.current) {
      textareaRef.current.focus();
    }

    // Try Windows Speech Recognition first (Win+H) - works better than Web Speech API
    // Web Speech API has network issues and requires Google services
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        const available = await window.electronAPI.isSpeechRecognitionAvailable();
        if ('data' in available && available.data) {
          // Focus the textarea before starting recognition
          if (textareaRef.current) {
            textareaRef.current.focus();
            // Small delay to ensure focus is set
            await new Promise(resolve => setTimeout(resolve, 150));
          }
          
          await window.electronAPI.startSpeechRecognition();
          setIsListening(true);
          
          // Listen for status updates
          const statusHandler = (status: { isListening: boolean }) => {
            setIsListening(status.isListening);
          };
          speechStatusListenerRef.current = statusHandler;
          window.electronAPI.onSpeechStatus(statusHandler);
          
          // Show instruction to user
          console.log('[SpeechInput] Windows Speech Recognition activated. Speak now and text will be typed into the input field.');
          return;
        }
      } catch (error) {
        console.error('Error starting Windows Speech Recognition:', error);
        // Fall through to Web Speech API as fallback
      }
    }

    // Fallback: Try Web Speech API (works on all platforms but may have network issues)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('تبدیل صوت به متن در دسترس نیست. لطفاً از Windows Speech Recognition (Win+H) استفاده کنید.');
      return;
    }

    // Use Web Speech API
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US'; // Default to English, can be made configurable

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onChange(value + (value ? ' ' : '') + transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'no-speech') {
          // User didn't speak, just stop silently
        } else if (event.error === 'not-allowed') {
          alert('دسترسی به میکروفون مجاز نیست. لطفاً دسترسی را در تنظیمات فعال کنید.');
        } else if (event.error === 'network') {
          // Network error - suggest using Windows Speech Recognition
          alert('خطا در اتصال به سرویس تشخیص صوت. لطفاً از Windows Speech Recognition (Win+H) استفاده کنید یا اتصال اینترنت خود را بررسی کنید.');
        } else {
          console.warn(`Speech recognition error: ${event.error}`);
          // Don't show alert for minor errors
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      alert('خطا در شروع تبدیل صوت به متن. لطفاً از Windows Speech Recognition (Win+H) استفاده کنید.');
    }
  };

  // Cleanup speech status listener on unmount
  useEffect(() => {
    return () => {
      if (speechStatusListenerRef.current && typeof window !== 'undefined' && window.electronAPI) {
        // Note: IPC listeners are automatically cleaned up when component unmounts
        speechStatusListenerRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <div className="relative">
        <div className="relative">
          {/* Custom label with badge */}
          {label && (
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-semibold text-white dark:text-gray-200">
                {label}
              </label>
              {shortcut && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-white/20 dark:bg-gray-800/30 text-white dark:text-gray-200 border border-white/30 dark:border-gray-600/30 dir-ltr">
                  {formatShortcut(shortcut)}
                </span>
              )}
            </div>
          )}
          <Textarea
            ref={textareaRef}
            label={undefined}
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
            className="absolute bottom-2 left-2 p-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-gray-700/50 text-white dark:text-gray-300 hover:text-white dark:hover:text-gray-100 transition-all duration-300 z-10 group backdrop-blur-sm"
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

          {/* Microphone Button - Next to Fullscreen Button */}
          <button
            onClick={handleMicrophoneClick}
            className={`absolute bottom-2 left-10 p-1.5 rounded-lg transition-all duration-300 z-10 group backdrop-blur-sm ${
              isListening
                ? 'bg-red-500 dark:bg-red-600 text-white animate-pulse shadow-lg'
                : 'hover:bg-white/20 dark:hover:bg-gray-700/50 text-white dark:text-gray-300 hover:text-white dark:hover:text-gray-100'
            }`}
            aria-label="تبدیل صوت به متن"
            title="تبدیل صوت به متن"
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
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
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

