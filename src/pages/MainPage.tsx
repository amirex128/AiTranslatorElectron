import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadSettings();
    loadEntries();
  }, [loadSettings, loadEntries]);

  useEffect(() => {
    if (settings) {
      setSelectedModel(settings.selectedModel);
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

  const handleCopy = async (text: string) => {
    const success = await writeClipboard(text);
    if (success) {
      setToast({ message: 'متن کپی شد', type: 'success' });
    } else {
      setToast({ message: 'خطا در کپی کردن', type: 'error' });
    }
  };


  const canTranslate =
    persianToEnglishInput.trim() ||
    englishToPersianInput.trim() ||
    grammarInput.trim() ||
    responseSuggestionsInput.trim();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl rounded py-2 shadow bg-indigo-500 font-bold text-gray-900 dark:text-white text-center">
          مترجم هوش مصنوعی
        </h1>

        <ModelSelector
          selectedModel={selectedModel || (settings?.selectedModel as AIModel)}
          onModelChange={setSelectedModel}
        />

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
          />
          <TranslationInput
            label="انگلیسی به فارسی"
            value={englishToPersianInput}
            onChange={setEnglishToPersianInput}
            placeholder="متن انگلیسی را وارد کنید..."
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
          />
                              <TranslationInput
            label="جوابش چی میشه؟"
            value={responseSuggestionsInput}
            onChange={setResponseSuggestionsInput}
            placeholder="متن انگلیسی را وارد کنید..."
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
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                اصلاح گرامر
              </label>
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
            placeholder="متن انگلیسی برای اصلاح را وارد کنید..."
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
            <Button
              variant="primary"
              onClick={handleTranslate}
              disabled={!canTranslate}
            >
              پردازش
            </Button>
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

