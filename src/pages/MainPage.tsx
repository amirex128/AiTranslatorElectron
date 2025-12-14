import React, { useState, useEffect, useCallback } from 'react';
import { useTranslationStore } from '../stores/translationStore';
import { useHistoryStore } from '../stores/historyStore';
import { TranslationInput } from '../components/translation/TranslationInput/TranslationInput';
import { TranslationResult } from '../components/translation/TranslationResult/TranslationResult';
import { GrammarTeachingResultComponent } from '../components/grammar/GrammarTeachingResult/GrammarTeachingResult';
import { ResponseSuggestionsResult } from '../components/response/ResponseSuggestionsResult/ResponseSuggestionsResult';
import { ModelSelector } from '../components/translation/ModelSelector/ModelSelector';
import { Button } from '../components/ui/Button/Button';
import { ErrorDisplay } from '../components/ui/ErrorDisplay/ErrorDisplay';
import { Toast } from '../components/ui/Toast/Toast';
import { HistoryPanel } from '../components/history/HistoryPanel/HistoryPanel';
import { TimerButton } from '../components/ui/TimerButton/TimerButton';
import { LastRequestTime } from '../components/ui/LastRequestTime/LastRequestTime';
import { Switch } from '../components/ui/Switch/Switch';
import { aiTranslatorServiceIPC } from '../services/ai/AITranslatorServiceIPC';
import { TranslatorResponse, TranslatorOptions } from '../types/translation';
import { writeClipboard } from '../utils/clipboard';
import { AIModel } from '../models/AIModel';
import { useSettingsStore } from '../stores/settingsStore';
import { GrammarTeachingResult } from '../services/ai/AIChatService';
import { TranslationResult as TranslationResultType } from '../utils/validation';

interface MainPageProps {
  onOpenSettings?: () => void;
}

export const MainPage: React.FC<MainPageProps> = ({ onOpenSettings }) => {
  const {
    persianToEnglishInput,
    englishToPersianInput,
    grammarInput,
    responseSuggestionsInput,
    results,
    selectedResult,
    responseSuggestionsResult,
    isLoading,
    error,
    errorDetails,
    showErrorDetails,
    setPersianToEnglishInput,
    setEnglishToPersianInput,
    setGrammarInput,
    setResponseSuggestionsInput,
    setResults,
    setSelectedResult,
    setResponseSuggestionsResult,
    setLoading,
    setError,
    toggleErrorDetails,
  } = useTranslationStore();

  const { addEntry, findCachedEntry, entries: historyEntries, loadEntries } = useHistoryStore();
  const { settings, loadSettings } = useSettingsStore();
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [fallbackSelectedModel, setFallbackSelectedModel] = useState<AIModel | null>(null);

  useEffect(() => {
    loadSettings();
    loadEntries();
  }, [loadSettings, loadEntries]);

  useEffect(() => {
    if (settings) {
      setSelectedModel(settings.selectedModel);
      setFallbackSelectedModel(settings.fallbackSelectedModel);
    }
  }, [settings]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [lastRequestTime, setLastRequestTime] = useState<number | null>(null);
  const [grammarTeachingMode, setGrammarTeachingMode] = useState(false);
  const [grammarTeachingResult, setGrammarTeachingResult] = useState<GrammarTeachingResult | null>(null);

  useEffect(() => {
    // Always enable dark mode
    document.documentElement.classList.add('dark');
  }, []);

  // Handle keyboard shortcuts from main process
  useEffect(() => {
    const handleShortcut = (data: { type: string; text: string }) => {
      if (data.type === 'persian-to-english') {
        setPersianToEnglishInput(data.text);
      } else if (data.type === 'english-to-persian') {
        setEnglishToPersianInput(data.text);
      } else if (data.type === 'grammar') {
        setGrammarInput(data.text);
      } else if (data.type === 'response-suggestions') {
        setResponseSuggestionsInput(data.text);
      }
    };

    // Listen for shortcut events from main process
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.onShortcut(handleShortcut);
    }

    return () => {
      // Cleanup if needed
    };
  }, [setPersianToEnglishInput, setEnglishToPersianInput, setGrammarInput, setResponseSuggestionsInput]);

  const handleTranslate = async () => {
    if (!selectedModel || !settings) {
      setError('تنظیمات بارگذاری نشده است');
      return;
    }

    // Handle response suggestions first
    if (responseSuggestionsInput.trim()) {
      const input = responseSuggestionsInput.trim();
      
      // Check cache first
      const cachedEntry = findCachedEntry(input, 'response-suggestions', selectedModel);
      if (cachedEntry && cachedEntry.responseSuggestionsResult) {
        setResponseSuggestionsResult(cachedEntry.responseSuggestionsResult);
        setResults(null);
        setGrammarTeachingResult(null);
        setLastRequestTime(cachedEntry.responseTime);
        setToast({ message: 'نتیجه از کش بارگذاری شد', type: 'success' });
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const requestStartTime = Date.now();
        setStartTime(requestStartTime);

        const response = await aiTranslatorServiceIPC.suggestResponses(input, selectedModel, {});
        const endTime = Date.now();
        const responseTime = Math.floor((endTime - requestStartTime) / 1000);

        setResponseSuggestionsResult(response.result);
        setResults(null);
        setGrammarTeachingResult(null);
        setLastRequestTime(responseTime);

        // Add to history
        await addEntry({
          input,
          type: 'response-suggestions',
          model: selectedModel,
          result: null,
          responseSuggestionsResult: response.result,
          responseTime,
        });

        setToast({ message: 'پیشنهادات پاسخ با موفقیت تولید شد', type: 'success' });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'خطا در تولید پیشنهادات پاسخ';
        setError(errorMessage);
        setToast({ message: errorMessage, type: 'error' });
      } finally {
        setLoading(false);
        setStartTime(null);
      }
      return;
    }

    let input = '';
    let translateFn: (
      text: string,
      model: AIModel,
      options: TranslatorOptions
    ) => Promise<TranslatorResponse>;
    let type: 'persian-to-english' | 'english-to-persian' | 'grammar';

    if (persianToEnglishInput.trim()) {
      input = persianToEnglishInput.trim();
      translateFn = aiTranslatorServiceIPC.translatePersianToEnglish.bind(
        aiTranslatorServiceIPC
      );
      type = 'persian-to-english';
    } else if (englishToPersianInput.trim()) {
      input = englishToPersianInput.trim();
      translateFn = aiTranslatorServiceIPC.translateEnglishToPersian.bind(
        aiTranslatorServiceIPC
      );
      type = 'english-to-persian';
    } else if (grammarInput.trim()) {
      input = grammarInput.trim();
      if (grammarTeachingMode) {
        // Check cache first
        const cachedEntry = findCachedEntry(input, 'grammar-teaching', selectedModel);
        if (cachedEntry && cachedEntry.grammarTeachingResult) {
          setGrammarTeachingResult(cachedEntry.grammarTeachingResult);
          setResults(null);
          setLastRequestTime(cachedEntry.responseTime);
          setToast({ message: 'نتیجه از کش بارگذاری شد', type: 'success' });
          return;
        }

        // Use grammar teaching mode
        try {
          setLoading(true);
          setError(null);
          const requestStartTime = Date.now();
          setStartTime(requestStartTime);

          const response = await aiTranslatorServiceIPC.teachGrammar(input, selectedModel, {});
          const endTime = Date.now();
          const responseTime = Math.floor((endTime - requestStartTime) / 1000);

          setGrammarTeachingResult(response.result);
          setResults(null); // Clear regular results
          setLastRequestTime(responseTime);

          // Add to history
          await addEntry({
            input,
            type: 'grammar-teaching',
            model: selectedModel,
            result: null,
            grammarTeachingResult: response.result,
            responseTime,
          });

          setToast({ message: 'آموزش گرامر با موفقیت انجام شد', type: 'success' });
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'خطا در آموزش گرامر';
          setError(errorMessage);
          setToast({ message: errorMessage, type: 'error' });
        } finally {
          setLoading(false);
        }
        return;
      } else {
      translateFn = aiTranslatorServiceIPC.correctGrammar.bind(aiTranslatorServiceIPC);
      type = 'grammar';
      }
    } else {
      setError('لطفاً متن را وارد کنید');
      return;
    }

    // Check cache first
    const cachedEntry = findCachedEntry(input, type, selectedModel);
    if (cachedEntry && cachedEntry.result) {
      setResults(cachedEntry.result);
      setSelectedResult(1);
      setLastRequestTime(cachedEntry.responseTime);
      setGrammarTeachingResult(null);
      setResponseSuggestionsResult(null);
      setToast({ message: 'نتیجه از کش بارگذاری شد', type: 'success' });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const requestStartTime = Date.now(); // Start timer
      setStartTime(requestStartTime);

      const response = await translateFn(input, selectedModel, {});
      const endTime = Date.now();
      const responseTime = Math.floor((endTime - requestStartTime) / 1000);

      setResults(response.result);
      setSelectedResult(1);
      setLastRequestTime(responseTime);
      setResponseSuggestionsResult(null);

      // Add to history
      await addEntry({
        input,
        type,
        model: selectedModel,
        result: response.result,
        responseTime,
      });

      setToast({ message: 'ترجمه با موفقیت انجام شد', type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ترجمه. لطفاً دوباره تلاش کنید.';
      const errorStack = error instanceof Error ? error.stack : undefined;
      setError(errorMessage, errorStack);
      setToast({ message: 'خطا در ترجمه', type: 'error' });
    } finally {
      setLoading(false);
      setStartTime(null); // Stop timer
    }
  };

  const handleTranslateFallback = async () => {
    if (!fallbackSelectedModel || !settings) {
      setError('تنظیمات بارگذاری نشده است');
      return;
    }

    // Handle response suggestions first
    if (responseSuggestionsInput.trim()) {
      const input = responseSuggestionsInput.trim();
      
      // Check cache first
      const cachedEntry = findCachedEntry(input, 'response-suggestions', fallbackSelectedModel);
      if (cachedEntry && cachedEntry.responseSuggestionsResult) {
        setResponseSuggestionsResult(cachedEntry.responseSuggestionsResult);
        setResults(null);
        setGrammarTeachingResult(null);
        setLastRequestTime(cachedEntry.responseTime);
        setToast({ message: 'نتیجه از کش بارگذاری شد', type: 'success' });
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const requestStartTime = Date.now();
        setStartTime(requestStartTime);

        const response = await aiTranslatorServiceIPC.suggestResponses(input, fallbackSelectedModel, {});
        const endTime = Date.now();
        const responseTime = Math.floor((endTime - requestStartTime) / 1000);

        setResponseSuggestionsResult(response.result);
        setResults(null);
        setGrammarTeachingResult(null);
        setLastRequestTime(responseTime);

        // Add to history
        await addEntry({
          input,
          type: 'response-suggestions',
          model: fallbackSelectedModel,
          result: null,
          responseSuggestionsResult: response.result,
          responseTime,
        });

        setToast({ message: 'پیشنهادات پاسخ با موفقیت تولید شد', type: 'success' });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'خطا در تولید پیشنهادات پاسخ';
        setError(errorMessage);
        setToast({ message: errorMessage, type: 'error' });
      } finally {
        setLoading(false);
        setStartTime(null);
      }
      return;
    }

    let input = '';
    let translateFn: (
      text: string,
      model: AIModel,
      options: TranslatorOptions
    ) => Promise<TranslatorResponse>;
    let type: 'persian-to-english' | 'english-to-persian' | 'grammar';

    if (persianToEnglishInput.trim()) {
      input = persianToEnglishInput.trim();
      translateFn = aiTranslatorServiceIPC.translatePersianToEnglish.bind(
        aiTranslatorServiceIPC
      );
      type = 'persian-to-english';
    } else if (englishToPersianInput.trim()) {
      input = englishToPersianInput.trim();
      translateFn = aiTranslatorServiceIPC.translateEnglishToPersian.bind(
        aiTranslatorServiceIPC
      );
      type = 'english-to-persian';
    } else if (grammarInput.trim()) {
      input = grammarInput.trim();
      if (grammarTeachingMode) {
        // Check cache first
        const cachedEntry = findCachedEntry(input, 'grammar-teaching', fallbackSelectedModel);
        if (cachedEntry && cachedEntry.grammarTeachingResult) {
          setGrammarTeachingResult(cachedEntry.grammarTeachingResult);
          setResults(null);
          setLastRequestTime(cachedEntry.responseTime);
          setToast({ message: 'نتیجه از کش بارگذاری شد', type: 'success' });
          return;
        }

        // Use grammar teaching mode
        try {
          setLoading(true);
          setError(null);
          const requestStartTime = Date.now();
          setStartTime(requestStartTime);

          const response = await aiTranslatorServiceIPC.teachGrammar(input, fallbackSelectedModel, {});
          const endTime = Date.now();
          const responseTime = Math.floor((endTime - requestStartTime) / 1000);

          setGrammarTeachingResult(response.result);
          setResults(null); // Clear regular results
          setLastRequestTime(responseTime);

          // Add to history
          await addEntry({
            input,
            type: 'grammar-teaching',
            model: fallbackSelectedModel,
            result: null,
            grammarTeachingResult: response.result,
            responseTime,
          });

          setToast({ message: 'آموزش گرامر با موفقیت انجام شد', type: 'success' });
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'خطا در آموزش گرامر';
          setError(errorMessage);
          setToast({ message: errorMessage, type: 'error' });
        } finally {
          setLoading(false);
        }
        return;
      } else {
      translateFn = aiTranslatorServiceIPC.correctGrammar.bind(aiTranslatorServiceIPC);
      type = 'grammar';
      }
    } else {
      setError('لطفاً متن را وارد کنید');
      return;
    }

    // Check cache first
    const cachedEntry = findCachedEntry(input, type, fallbackSelectedModel);
    if (cachedEntry && cachedEntry.result) {
      setResults(cachedEntry.result);
      setSelectedResult(1);
      setLastRequestTime(cachedEntry.responseTime);
      setGrammarTeachingResult(null);
      setResponseSuggestionsResult(null);
      setToast({ message: 'نتیجه از کش بارگذاری شد', type: 'success' });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const requestStartTime = Date.now(); // Start timer
      setStartTime(requestStartTime);

      const response = await translateFn(input, fallbackSelectedModel, {});
      const endTime = Date.now();
      const responseTime = Math.floor((endTime - requestStartTime) / 1000);

      setResults(response.result);
      setSelectedResult(1);
      setLastRequestTime(responseTime);
      setResponseSuggestionsResult(null);

      // Add to history
      await addEntry({
        input,
        type,
        model: fallbackSelectedModel,
        result: response.result,
        responseTime,
      });

      setToast({ message: 'ترجمه با موفقیت انجام شد', type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ترجمه. لطفاً دوباره تلاش کنید.';
      const errorStack = error instanceof Error ? error.stack : undefined;
      setError(errorMessage, errorStack);
      setToast({ message: 'خطا در ترجمه', type: 'error' });
    } finally {
      setLoading(false);
      setStartTime(null); // Stop timer
    }
  };

  const handleCopy = async (text: string) => {
    const success = await writeClipboard(text);
    if (success) {
      setToast({ message: 'متن کپی شد', type: 'success' });
    } else {
      setToast({ message: 'خطا در کپی کردن', type: 'error' });
    }
  };

  const handleQuickTranslate = useCallback(async () => {
    if (!settings || !window.electronAPI) {
      setError('تنظیمات یا API در دسترس نیست');
      return;
    }

    // Determine translation direction and input text
    let input: string;
    let type: 'persian-to-english' | 'english-to-persian';
    
    if (persianToEnglishInput.trim()) {
      input = persianToEnglishInput.trim();
      type = 'persian-to-english';
    } else if (englishToPersianInput.trim()) {
      input = englishToPersianInput.trim();
      type = 'english-to-persian';
    } else {
      setError('لطفاً متن فارسی یا انگلیسی وارد کنید');
      return;
    }

    // Only work for translation inputs, not grammar or response suggestions
    if (grammarInput.trim() || responseSuggestionsInput.trim()) {
      setError('ترجمه سریع فقط برای ورودی‌های ترجمه کار می‌کند');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const requestStartTime = Date.now();
      setStartTime(requestStartTime);

      // Call Google Translate API
      const response = await window.electronAPI.quickTranslateTranslate(input);
      
      if (!response || 'error' in response) {
        throw new Error('error' in response ? response.error : 'خطا در ترجمه');
      }

      if (!response.success || !('data' in response)) {
        throw new Error('پاسخ نامعتبر از سرور');
      }

      const translation = response.data;
      const endTime = Date.now();
      const responseTime = Math.floor((endTime - requestStartTime) / 1000);

      // Format translation result based on direction
      // TranslationResult expects: { english_1, persian_1, english_2, persian_2, english_3, persian_3 }
      let formattedResult: TranslationResultType;
      if (type === 'persian-to-english') {
        // Persian to English: input is Persian, translation is English
        formattedResult = {
          english_1: translation,
          persian_1: input,
          english_2: '',
          persian_2: '',
          english_3: '',
          persian_3: '',
        };
      } else {
        // English to Persian: input is English, translation is Persian
        formattedResult = {
          english_1: input,
          persian_1: translation,
          english_2: '',
          persian_2: '',
          english_3: '',
          persian_3: '',
        };
      }

      setResults(formattedResult);
      setSelectedResult(1);
      setLastRequestTime(responseTime);
      setResponseSuggestionsResult(null);
      setGrammarTeachingResult(null);

      // Add to history (using a placeholder model since we're not using AI)
      await addEntry({
        input,
        type,
        model: selectedModel || settings.selectedModel, // Use selected model for history entry
        result: formattedResult,
        responseTime,
      });

      setToast({ message: 'ترجمه با موفقیت انجام شد', type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ترجمه. لطفاً دوباره تلاش کنید.';
      const errorStack = error instanceof Error ? error.stack : undefined;
      setError(errorMessage, errorStack);
      setToast({ message: 'خطا در ترجمه', type: 'error' });
    } finally {
      setLoading(false);
      setStartTime(null);
    }
  }, [persianToEnglishInput, englishToPersianInput, grammarInput, responseSuggestionsInput, settings, selectedModel, setLoading, setError, setStartTime, setResults, setSelectedResult, setLastRequestTime, setResponseSuggestionsResult, setGrammarTeachingResult, addEntry, setToast]);


  const canTranslate =
    persianToEnglishInput.trim() ||
    englishToPersianInput.trim() ||
    grammarInput.trim() ||
    responseSuggestionsInput.trim();

  const canQuickTranslate =
    (persianToEnglishInput.trim() || englishToPersianInput.trim()) &&
    !grammarInput.trim() &&
    !responseSuggestionsInput.trim() &&
    !isLoading;

  // Helper function to check if a shortcut matches the keydown event
  const matchesShortcut = (shortcut: string, e: KeyboardEvent): boolean => {
    const parts = shortcut.split('+').map(p => p.trim().toLowerCase());
    const keyMap: Record<string, string> = {
      'commandorcontrol': 'ctrl',
      'command': 'meta',
      'cmd': 'meta',
      'ctrl': 'ctrl',
      'control': 'ctrl',
      'alt': 'alt',
      'shift': 'shift',
      'enter': 'Enter',
      'return': 'Enter',
    };

    let hasCtrl = false;
    let hasAlt = false;
    let hasShift = false;
    let hasMeta = false;
    let mainKey = '';

    for (const part of parts) {
      const normalized = keyMap[part] || part;
      if (normalized === 'ctrl') {
        hasCtrl = true;
      } else if (normalized === 'alt') {
        hasAlt = true;
      } else if (normalized === 'shift') {
        hasShift = true;
      } else if (normalized === 'meta') {
        hasMeta = true;
      } else {
        mainKey = normalized;
      }
    }

    // Check modifiers
    if (hasCtrl && !e.ctrlKey) return false;
    if (hasAlt && !e.altKey) return false;
    if (hasShift && !e.shiftKey) return false;
    if (hasMeta && !e.metaKey) return false;

    // Check that no other modifiers are pressed
    if (!hasCtrl && e.ctrlKey) return false;
    if (!hasAlt && e.altKey) return false;
    if (!hasShift && e.shiftKey) return false;
    if (!hasMeta && e.metaKey) return false;

    // Check main key (case-insensitive)
    return mainKey.toLowerCase() === e.key.toLowerCase();
  };

  // Local keyboard shortcuts handler (only works when app has focus)
  // Use useCallback to memoize the handler and check inputs directly
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Check for quick translate shortcut
    if (settings?.shortcuts.processQuickTranslate) {
      if (matchesShortcut(settings.shortcuts.processQuickTranslate, e)) {
        e.preventDefault();
        e.stopPropagation();
        // Check inputs directly to get current state at the moment of keypress
        const canQuickTranslateNow =
          (persianToEnglishInput.trim() || englishToPersianInput.trim()) &&
          !grammarInput.trim() &&
          !responseSuggestionsInput.trim();
        if (canQuickTranslateNow && !isLoading) {
          handleQuickTranslate();
        }
        return;
      }
    }

    // CTRL+Enter or CMD+Enter for main model
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      // Check inputs directly to get current state at the moment of keypress
      const canTranslateNow =
        persianToEnglishInput.trim() ||
        englishToPersianInput.trim() ||
        grammarInput.trim() ||
        responseSuggestionsInput.trim();
      if (canTranslateNow && !isLoading) {
        handleTranslate();
      }
      return;
    }

    // ALT+Enter for fallback model
    if (e.altKey && e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      // Check inputs directly to get current state at the moment of keypress
      const canTranslateNow =
        persianToEnglishInput.trim() ||
        englishToPersianInput.trim() ||
        grammarInput.trim() ||
        responseSuggestionsInput.trim();
      if (canTranslateNow && !isLoading) {
        handleTranslateFallback();
      }
      return;
    }
  }, [persianToEnglishInput, englishToPersianInput, grammarInput, responseSuggestionsInput, isLoading, handleTranslate, handleTranslateFallback, handleQuickTranslate, settings]);

  useEffect(() => {
    // Add event listener to document to catch all keydown events, even in inputs
    // Using capture phase (true) to catch events before they reach inputs
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-3">
        <h1 className="text-3xl rounded py-1 shadow bg-indigo-500 font-bold text-gray-900 dark:text-white text-center">
          مترجم هوش مصنوعی
        </h1>

        <div className="flex gap-4">
          <ModelSelector
            selectedModel={selectedModel || (settings?.selectedModel as AIModel)}
            onModelChange={setSelectedModel}
            label="مدل اصلی"
          />
          <ModelSelector
            selectedModel={fallbackSelectedModel || (settings?.fallbackSelectedModel as AIModel)}
            onModelChange={setFallbackSelectedModel}
            label="مدل جایگزین"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <TranslationInput
            label="فارسی به انگلیسی"
            value={persianToEnglishInput}
            onChange={setPersianToEnglishInput}
            placeholder="متن فارسی را وارد کنید..."
            autoFocus={false}
            historyEntries={historyEntries.filter((e) => e.type === 'persian-to-english')}
            onSelectHistoryEntry={(entry) => {
              setPersianToEnglishInput(entry.input);
              if (entry.result) {
                setResults(entry.result);
                setSelectedResult(1);
                setGrammarTeachingResult(null);
                setLastRequestTime(entry.responseTime);
              }
            }}
            shortcut={settings?.shortcuts.persianToEnglish}
          />
          <TranslationInput
            label="انگلیسی به فارسی"
            value={englishToPersianInput}
            onChange={setEnglishToPersianInput}
            placeholder="Enter English text here or use theire Shortcut"
            autoFocus={false}
            dir="ltr"
            historyEntries={historyEntries.filter((e) => e.type === 'english-to-persian')}
            onSelectHistoryEntry={(entry) => {
              setEnglishToPersianInput(entry.input);
              if (entry.result) {
                setResults(entry.result);
                setSelectedResult(1);
                setGrammarTeachingResult(null);
                setLastRequestTime(entry.responseTime);
              }
            }}
            shortcut={settings?.shortcuts.englishToPersian}
          />
          <TranslationInput
            label="جوابش چی میشه؟"
            value={responseSuggestionsInput}
            onChange={setResponseSuggestionsInput}
            placeholder="Enter English text here or use their shortcuts..."
            autoFocus={false}
            dir="ltr"
            historyEntries={historyEntries.filter((e) => e.type === 'response-suggestions')}
            onSelectHistoryEntry={(entry) => {
              setResponseSuggestionsInput(entry.input);
              if (entry.responseSuggestionsResult) {
                setResponseSuggestionsResult(entry.responseSuggestionsResult);
                setResults(null);
                setGrammarTeachingResult(null);
                setLastRequestTime(entry.responseTime);
              }
            }}
            shortcut={settings?.shortcuts.responseSuggestions}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  اصلاح گرامر
                </label>
                {settings?.shortcuts.grammar && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 dir-ltr">
                    {settings.shortcuts.grammar.replace(/\+/g, ' + ')}
                  </span>
                )}
              </div>
              <Switch
                checked={grammarTeachingMode}
                onChange={setGrammarTeachingMode}
                label="حالت آموزش"
              />
            </div>
          <TranslationInput
              label=""
            value={grammarInput}
            onChange={setGrammarInput}
            placeholder="Enter English text here or use their shortcuts..."
            autoFocus={false}
            dir="ltr"
            historyEntries={historyEntries.filter((e) => 
              grammarTeachingMode 
                ? e.type === 'grammar-teaching' 
                : e.type === 'grammar'
            )}
            onSelectHistoryEntry={(entry) => {
              setGrammarInput(entry.input);
              if (entry.type === 'grammar-teaching' && entry.grammarTeachingResult) {
                setGrammarTeachingResult(entry.grammarTeachingResult);
                setResults(null);
                setLastRequestTime(entry.responseTime);
              } else if (entry.result) {
                setResults(entry.result);
                setSelectedResult(1);
                setGrammarTeachingResult(null);
                setLastRequestTime(entry.responseTime);
              }
            }}
            shortcut={settings?.shortcuts.grammar}
          />
          </div>
        </div>

        <div className="flex gap-2 justify-center flex-wrap">
          {isLoading ? (
            <Button
              variant="danger"
              isLoading={true}
            >
              در حال پردازش...
            </Button>
          ) : (
            <>
              <Button
                variant="primary"
                onClick={handleTranslate}
                disabled={!canTranslate}
                shortcut={settings?.shortcuts.processMain}
              >
                مدل اصلی
              </Button>
              <Button
                variant="danger"
                onClick={handleTranslateFallback}
                disabled={!canTranslate}
                shortcut={settings?.shortcuts.processFallback}
              >
                مدل جایگزین
              </Button>
              <Button
                variant="secondary"
                onClick={handleQuickTranslate}
                disabled={!canQuickTranslate}
                shortcut={settings?.shortcuts.processQuickTranslate}
              >
                ترجمه سریع
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={() => setShowHistory(!showHistory)} disabled={isLoading}>
            تاریخچه
          </Button>
        </div>

        {error && (
          <ErrorDisplay
            error={error}
            details={errorDetails || undefined}
            showDetails={showErrorDetails}
            onToggleDetails={toggleErrorDetails}
          />
        )}

        {responseSuggestionsResult && (
          <div className="space-y-4">
            <ResponseSuggestionsResult
              result={responseSuggestionsResult}
              onCopy={handleCopy}
              fontSize={settings?.fontSize || 16}
            />
          </div>
        )}

        {grammarTeachingResult && !responseSuggestionsResult && (
          <div className="space-y-4">
            <GrammarTeachingResultComponent
              result={grammarTeachingResult}
              onCopy={handleCopy}
              fontSize={settings?.fontSize || 16}
            />
          </div>
        )}

        {results && !grammarTeachingResult && !responseSuggestionsResult && (
          <div className="space-y-4">
            <TranslationResult
              result={results}
              selectedIndex={selectedResult}
              onSelect={setSelectedResult}
              onCopy={handleCopy}
              fontSize={settings?.fontSize || 16}
            />
          </div>
        )}

        {showHistory && (
          <div className="mt-6">
            <HistoryPanel
              onSelectEntry={(entry) => {
                if (entry.type === 'persian-to-english') {
                  setPersianToEnglishInput(entry.input);
                  setResults(entry.result);
                  setGrammarTeachingResult(null);
                } else if (entry.type === 'english-to-persian') {
                  setEnglishToPersianInput(entry.input);
                  setResults(entry.result);
                  setGrammarTeachingResult(null);
                } else if (entry.type === 'grammar') {
                  setGrammarInput(entry.input);
                  setResults(entry.result);
                  setGrammarTeachingResult(null);
                } else if (entry.type === 'grammar-teaching') {
                  setGrammarInput(entry.input);
                  setGrammarTeachingResult(entry.grammarTeachingResult || null);
                  setResults(null);
                  setResponseSuggestionsResult(null);
                } else if (entry.type === 'response-suggestions') {
                  setResponseSuggestionsInput(entry.input);
                  setResponseSuggestionsResult(entry.responseSuggestionsResult || null);
                  setResults(null);
                  setGrammarTeachingResult(null);
                }
                setShowHistory(false);
              }}
            />
          </div>
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
      <TimerButton isActive={isLoading} startTime={startTime} />
      <LastRequestTime elapsedTime={lastRequestTime} />
    </div>
  );
};

