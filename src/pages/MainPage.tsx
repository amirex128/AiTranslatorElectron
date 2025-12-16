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
import { Modal } from '../components/ui/Modal/Modal';
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
  const [showDictionaryModal, setShowDictionaryModal] = useState(false);
  const [dictionaryWord, setDictionaryWord] = useState<string>('');
  const [hideAds, setHideAds] = useState<boolean>(true);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [lastRequestTime, setLastRequestTime] = useState<number | null>(null);
  const [grammarTeachingMode, setGrammarTeachingMode] = useState(false);
  const [grammarTeachingResult, setGrammarTeachingResult] = useState<GrammarTeachingResult | null>(null);
  
  // Separate results for different translation types
  const [mainResults, setMainResults] = useState<TranslationResultType | null>(null);
  const [fallbackResults, setFallbackResults] = useState<TranslationResultType | null>(null);
  const [quickTranslateResults, setQuickTranslateResults] = useState<TranslationResultType | null>(null);
  const [selectedMainResult, setSelectedMainResult] = useState<number | null>(null);
  const [selectedFallbackResult, setSelectedFallbackResult] = useState<number | null>(null);
  const [selectedQuickTranslateResult, setSelectedQuickTranslateResult] = useState<number | null>(null);

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
      setMainResults(cachedEntry.result);
      setSelectedMainResult(1);
      setResults(cachedEntry.result); // Keep for backward compatibility
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

      setMainResults(response.result);
      setSelectedMainResult(1);
      setResults(response.result); // Keep for backward compatibility
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
      setFallbackResults(cachedEntry.result);
      setSelectedFallbackResult(1);
      setResults(cachedEntry.result); // Keep for backward compatibility
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

      setFallbackResults(response.result);
      setSelectedFallbackResult(1);
      setResults(response.result); // Keep for backward compatibility
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

  // Clean input text by removing error messages and stack traces
  const cleanInput = useCallback((text: string): string => {
    // Remove error messages and stack traces
    return text
      .replace(/Error:.*$/gm, '')
      .replace(/at eval.*$/gm, '')
      .replace(/at Generator\.next.*$/gm, '')
      .replace(/at fulfilled.*$/gm, '')
      .replace(/webpack-internal:.*$/gm, '')
      .replace(/^\s*Error:.*$/gm, '') // Error at start of line
      .replace(/\n\s*Error:.*$/gm, '') // Error after newline
      .trim();
  }, []);

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

    // Clean input to remove any error messages or stack traces
    input = cleanInput(input);
    
    // Validate cleaned input
    if (!input || input.trim() === '') {
      setError('متن ورودی معتبر نیست. لطفاً متن را دوباره وارد کنید.');
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

      // Determine translation direction for QuickTranslate service
      const direction: 'en-to-fa' | 'fa-to-en' = type === 'english-to-persian' ? 'en-to-fa' : 'fa-to-en';
      
      // Call Google Translate API with correct direction
      // quickTranslateTranslate now returns string directly (unwrapped from IPCResponse)
      const translation = await window.electronAPI.quickTranslateTranslate(input, direction);
      
      // Validate translation result - be more lenient
      if (!translation || typeof translation !== 'string') {
        console.error('[QuickTranslate] Invalid translation response:', translation);
        throw new Error('ترجمه دریافت نشد. لطفاً دوباره تلاش کنید.');
      }
      
      const trimmedTranslation = translation.trim();
      if (trimmedTranslation === '' || trimmedTranslation === 'تعریف نشده' || trimmedTranslation.toLowerCase() === 'undefined') {
        console.error('[QuickTranslate] Translation is empty or undefined:', trimmedTranslation);
        throw new Error('ترجمه دریافت نشد. لطفاً دوباره تلاش کنید.');
      }
      
      // Check if translation contains error indicators
      if (trimmedTranslation.includes('Error:') || 
          trimmedTranslation.includes('at eval') ||
          trimmedTranslation.includes('at Generator.next') ||
          trimmedTranslation.includes('at fulfilled') ||
          trimmedTranslation.includes('webpack-internal:')) {
        console.error('[QuickTranslate] Translation contains error:', trimmedTranslation);
        throw new Error('ترجمه شامل خطا است. لطفاً دوباره تلاش کنید.');
      }
      
      // Use trimmed translation
      const finalTranslation = trimmedTranslation;
      
      const endTime = Date.now();
      const responseTime = Math.floor((endTime - requestStartTime) / 1000);

      // Format translation result based on direction
      // TranslationResult expects: { english_1, persian_1, english_2, persian_2, english_3, persian_3 }
      let formattedResult: TranslationResultType;
      if (type === 'persian-to-english') {
        // Persian to English: input is Persian, translation is English
        formattedResult = {
          english_1: finalTranslation,
          persian_1: input.trim(),
          english_2: '',
          persian_2: '',
          english_3: '',
          persian_3: '',
        };
        console.log('[QuickTranslate] Persian to English result:', formattedResult);
      } else {
        // English to Persian: input is English, translation is Persian
        formattedResult = {
          english_1: input.trim(),
          persian_1: finalTranslation,
          english_2: '',
          persian_2: '',
          english_3: '',
          persian_3: '',
        };
        console.log('[QuickTranslate] English to Persian result:', formattedResult);
      }

      setQuickTranslateResults(formattedResult);
      setSelectedQuickTranslateResult(1);
      setResults(formattedResult); // Keep for backward compatibility
      setSelectedResult(1);
      // Clear other results to ensure quick translate results are displayed
      setMainResults(null);
      setFallbackResults(null);
      setSelectedMainResult(null);
      setSelectedFallbackResult(null);
      setLastRequestTime(responseTime);
      setResponseSuggestionsResult(null);
      setGrammarTeachingResult(null);

      // Add to history (using Google Translate model)
      await addEntry({
        input,
        type,
        model: AIModel.GOOGLE_TRANSLATE, // Use Google Translate model for quick translate results
        result: formattedResult,
        responseTime,
      });

      setToast({ message: 'ترجمه با موفقیت انجام شد', type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ترجمه. لطفاً دوباره تلاش کنید.';
      const errorStack = error instanceof Error ? error.stack : undefined;
      setError(errorMessage, errorStack);
      setToast({ message: 'خطا در ترجمه', type: 'error' });
      
      // Ensure input fields don't contain error messages
      // Clean input fields if they somehow contain error text
      if (persianToEnglishInput.includes('Error:') || persianToEnglishInput.includes('at eval')) {
        const cleaned = cleanInput(persianToEnglishInput);
        if (cleaned !== persianToEnglishInput) {
          setPersianToEnglishInput(cleaned);
        }
      }
      if (englishToPersianInput.includes('Error:') || englishToPersianInput.includes('at eval')) {
        const cleaned = cleanInput(englishToPersianInput);
        if (cleaned !== englishToPersianInput) {
          setEnglishToPersianInput(cleaned);
        }
      }
      
      // Clear error state after a delay to prevent it from being included in next input
      setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setLoading(false);
      setStartTime(null);
    }
  }, [persianToEnglishInput, englishToPersianInput, grammarInput, responseSuggestionsInput, settings, selectedModel, setLoading, setError, setStartTime, setResults, setSelectedResult, setLastRequestTime, setResponseSuggestionsResult, setGrammarTeachingResult, addEntry, setToast, cleanInput, setMainResults, setFallbackResults, setQuickTranslateResults, setSelectedQuickTranslateResult]);


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

  const handleDictionary = useCallback(() => {
    const word = englishToPersianInput.trim();
    if (word && word.split(/\s+/).length === 1) {
      setDictionaryWord(word);
      setShowDictionaryModal(true);
    }
  }, [englishToPersianInput]);

  const canUseDictionary = englishToPersianInput.trim().split(/\s+/).length === 1 && englishToPersianInput.trim().length > 0;

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

    // Check for dictionary shortcut
    if (settings?.shortcuts.processDictionary) {
      if (matchesShortcut(settings.shortcuts.processDictionary, e)) {
        e.preventDefault();
        e.stopPropagation();
        // Check if englishToPersianInput is a single word
        const word = englishToPersianInput.trim();
        const isSingleWord = word.split(/\s+/).length === 1 && word.length > 0;
        if (isSingleWord && !isLoading) {
          handleDictionary();
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
  }, [persianToEnglishInput, englishToPersianInput, grammarInput, responseSuggestionsInput, isLoading, handleTranslate, handleTranslateFallback, handleQuickTranslate, handleDictionary, settings]);

  useEffect(() => {
    // Add event listener to document to catch all keydown events, even in inputs
    // Using capture phase (true) to catch events before they reach inputs
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleKeyDown]);

  // Get the most recent translation result (quick > fallback > main > results)
  // Quick translate should have highest priority when it exists
  const displayResult = quickTranslateResults || fallbackResults || mainResults || results;
  const displaySelected = quickTranslateResults 
    ? selectedQuickTranslateResult 
    : fallbackResults 
    ? selectedFallbackResult 
    : mainResults 
    ? selectedMainResult 
    : selectedResult;
  const displaySetSelected = quickTranslateResults 
    ? setSelectedQuickTranslateResult 
    : fallbackResults 
    ? setSelectedFallbackResult 
    : mainResults 
    ? setSelectedMainResult 
    : setSelectedResult;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 animate-fade-in">
        {/* Header with Gradient */}
        <div className="backdrop-blur-lg bg-white/10 dark:bg-gray-900/20 rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/30">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-indigo-100 dark:from-white dark:to-indigo-200 bg-clip-text text-transparent">
          مترجم هوش مصنوعی
        </h1>
          </div>
        </div>

        {/* Model Selectors - Pill Shaped */}
        <div className="flex flex-wrap gap-3 justify-center">
          <div className="backdrop-blur-lg bg-white/10 dark:bg-gray-900/20 rounded-full px-4 py-2 border border-white/20 dark:border-gray-700/30 shadow-lg transition-all duration-300 hover:scale-105">
        <ModelSelector
          selectedModel={selectedModel || (settings?.selectedModel as AIModel)}
          onModelChange={setSelectedModel}
              label="مدل اصلی"
            />
          </div>
          <div className="backdrop-blur-lg bg-white/10 dark:bg-gray-900/20 rounded-full px-4 py-2 border border-white/20 dark:border-gray-700/30 shadow-lg transition-all duration-300 hover:scale-105">
            <ModelSelector
              selectedModel={fallbackSelectedModel || (settings?.fallbackSelectedModel as AIModel)}
              onModelChange={setFallbackSelectedModel}
              label="مدل جایگزین"
            />
          </div>
        </div>

        {/* Input Fields - Glassmorphism Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="backdrop-blur-lg bg-white/10 dark:bg-gray-900/20 rounded-xl p-4 shadow-xl border border-white/20 dark:border-gray-700/30 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
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
          </div>
          <div className="backdrop-blur-lg bg-white/10 dark:bg-gray-900/20 rounded-xl p-4 shadow-xl border border-white/20 dark:border-gray-700/30 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
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
          </div>
          <div className="backdrop-blur-lg bg-white/10 dark:bg-gray-900/20 rounded-xl p-4 shadow-xl border border-white/20 dark:border-gray-700/30 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
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
          </div>
          <div className="backdrop-blur-lg bg-white/10 dark:bg-gray-900/20 rounded-xl p-4 shadow-xl border border-white/20 dark:border-gray-700/30 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <label className="block text-sm font-medium text-white dark:text-gray-200">
                  اصلاح گرامر
                </label>
                {settings?.shortcuts.grammar && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-white/20 dark:bg-gray-800/30 text-white dark:text-gray-200 border border-white/30 dark:border-gray-600/30 dir-ltr">
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

        {/* Action Buttons - Rounded with Gradients */}
        <div className="flex gap-3 justify-center flex-wrap">
          {isLoading ? (
            <button
              disabled
              className="px-6 py-3 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold shadow-lg opacity-75 cursor-not-allowed flex items-center gap-2"
            >
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              در حال پردازش...
            </button>
          ) : (
            <>
              <button
              onClick={handleTranslate}
              disabled={!canTranslate}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                مدل اصلی
                {settings?.shortcuts.processMain && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full dir-ltr">
                    {settings.shortcuts.processMain.replace(/\+/g, '+')}
                  </span>
                )}
              </button>
              <button
                onClick={handleTranslateFallback}
                disabled={!canTranslate}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-semibold shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                مدل جایگزین
                {settings?.shortcuts.processFallback && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full dir-ltr">
                    {settings.shortcuts.processFallback.replace(/\+/g, '+')}
                  </span>
                )}
              </button>
              <button
                onClick={handleQuickTranslate}
                disabled={!canQuickTranslate}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                ترجمه سریع
                {settings?.shortcuts.processQuickTranslate && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full dir-ltr">
                    {settings.shortcuts.processQuickTranslate.replace(/\+/g, '+')}
                  </span>
                )}
              </button>
              <button
                onClick={handleDictionary}
                disabled={!canUseDictionary}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                دیکشنری
                {settings?.shortcuts.processDictionary && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full dir-ltr">
                    {settings.shortcuts.processDictionary.replace(/\+/g, '+')}
                  </span>
                )}
              </button>
            </>
          )}
          <button
            onClick={() => setShowHistory(!showHistory)}
            disabled={isLoading}
            className="px-6 py-3 rounded-full backdrop-blur-lg bg-white/20 dark:bg-gray-900/30 hover:bg-white/30 dark:hover:bg-gray-900/40 text-white font-semibold shadow-lg border border-white/30 dark:border-gray-700/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            تاریخچه
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="backdrop-blur-lg bg-red-500/20 dark:bg-red-900/20 rounded-xl p-4 shadow-xl border border-red-300/30 dark:border-red-700/30 animate-fade-in">
          <ErrorDisplay
            error={error}
            details={errorDetails || undefined}
            showDetails={showErrorDetails}
            onToggleDetails={toggleErrorDetails}
          />
          </div>
        )}

        {/* Translation Results - Display directly without outer tab */}
        {displayResult && !grammarTeachingResult && !responseSuggestionsResult && (
          <div className="backdrop-blur-lg bg-white/10 dark:bg-gray-900/20 rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/30 animate-fade-in">
            <TranslationResult
              result={displayResult}
              selectedIndex={displaySelected}
              onSelect={displaySetSelected}
              onCopy={handleCopy}
              fontSize={settings?.fontSize || 16}
            />
          </div>
        )}

        {/* Grammar Results - Display directly without outer tab */}
        {grammarTeachingResult && !responseSuggestionsResult && (
          <div className="backdrop-blur-lg bg-white/10 dark:bg-gray-900/20 rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/30 animate-fade-in">
            <GrammarTeachingResultComponent
              result={grammarTeachingResult}
              onCopy={handleCopy}
              fontSize={settings?.fontSize || 16}
            />
          </div>
        )}

        {/* Response Suggestions Results - Display directly without outer tab */}
        {responseSuggestionsResult && (
          <div className="backdrop-blur-lg bg-white/10 dark:bg-gray-900/20 rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/30 animate-fade-in">
            <ResponseSuggestionsResult
              result={responseSuggestionsResult}
              onCopy={handleCopy}
              fontSize={settings?.fontSize || 16}
            />
          </div>
        )}

        {/* Dictionary Modal */}
        <Modal
          isOpen={showDictionaryModal}
          onClose={() => setShowDictionaryModal(false)}
          title={`دیکشنری: ${dictionaryWord}`}
          className="max-w-6xl"
        >
          <div className="relative w-full">
            {/* Ad Block Toggle Button */}
            <div className="flex items-center justify-end mb-2 gap-2">
              <button
                onClick={() => setHideAds(!hideAds)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  hideAds
                    ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/50'
                    : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50'
                }`}
              >
                {hideAds ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    تبلیغات مخفی است
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    نمایش تبلیغات
                  </>
                )}
              </button>
            </div>
            
            {/* Iframe Container */}
            <div className="relative w-full h-[80vh] rounded-lg overflow-hidden">
              <iframe
                src={`https://fastdic.com/word/${encodeURIComponent(dictionaryWord)}`}
                className="w-full h-full border-0 rounded-lg"
                allow="fullscreen"
                title={`Dictionary for ${dictionaryWord}`}
              />
              
              {/* Ad Block Overlay - Covers common ad positions */}
              {hideAds && (
                <>
                  {/* Top banner ad */}
                  <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-gray-900/95 to-transparent pointer-events-none z-10" />
                  
                  {/* Right sidebar ad */}
                  <div className="absolute top-0 right-0 bottom-0 w-64 bg-gradient-to-l from-gray-900/95 to-transparent pointer-events-none z-10" />
                  
                  {/* Bottom banner ad */}
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-900/95 to-transparent pointer-events-none z-10" />
                  
                  {/* Left sidebar ad (if exists) */}
                  <div className="absolute top-0 left-0 bottom-0 w-48 bg-gradient-to-r from-gray-900/95 to-transparent pointer-events-none z-10" />
                  
                  {/* Center overlay for popup ads */}
                  <div className="absolute inset-0 bg-gray-900/80 pointer-events-auto z-20 hidden" id="ad-popup-overlay" />
                </>
              )}
            </div>
          </div>
        </Modal>

        {/* History Panel - Modal */}
        <Modal
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          title="تاریخچه ترجمه"
          className="max-w-6xl"
        >
            <HistoryPanel
              onSelectEntry={(entry) => {
                if (entry.type === 'persian-to-english') {
                  setPersianToEnglishInput(entry.input);
                if (entry.result) {
                  setMainResults(entry.result);
                  setSelectedMainResult(1);
                  setResults(entry.result); // Keep for backward compatibility
                  setSelectedResult(1);
                }
                setFallbackResults(null);
                setQuickTranslateResults(null);
                setGrammarTeachingResult(null);
                setResponseSuggestionsResult(null);
                } else if (entry.type === 'english-to-persian') {
                  setEnglishToPersianInput(entry.input);
                if (entry.result) {
                  setMainResults(entry.result);
                  setSelectedMainResult(1);
                  setResults(entry.result); // Keep for backward compatibility
                  setSelectedResult(1);
                }
                setFallbackResults(null);
                setQuickTranslateResults(null);
                setGrammarTeachingResult(null);
                setResponseSuggestionsResult(null);
                } else if (entry.type === 'grammar') {
                  setGrammarInput(entry.input);
                if (entry.result) {
                  setMainResults(entry.result);
                  setSelectedMainResult(1);
                  setResults(entry.result); // Keep for backward compatibility
                  setSelectedResult(1);
                }
                setFallbackResults(null);
                setQuickTranslateResults(null);
                setGrammarTeachingResult(null);
                setResponseSuggestionsResult(null);
              } else if (entry.type === 'grammar-teaching') {
                setGrammarInput(entry.input);
                setGrammarTeachingResult(entry.grammarTeachingResult || null);
                setMainResults(null);
                setFallbackResults(null);
                setQuickTranslateResults(null);
                setResults(null);
                setResponseSuggestionsResult(null);
              } else if (entry.type === 'response-suggestions') {
                setResponseSuggestionsInput(entry.input);
                setResponseSuggestionsResult(entry.responseSuggestionsResult || null);
                setMainResults(null);
                setFallbackResults(null);
                setQuickTranslateResults(null);
                setResults(null);
                setGrammarTeachingResult(null);
              }
                setShowHistory(false);
              }}
            />
        </Modal>

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

