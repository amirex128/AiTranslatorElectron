import React, { useState, useEffect } from 'react';
import { useTranslationStore } from '../stores/translationStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useHistoryStore } from '../stores/historyStore';
import { useTTSStore } from '../stores/ttsStore';
import { TranslationInput } from '../components/translation/TranslationInput/TranslationInput';
import { TranslationResult } from '../components/translation/TranslationResult/TranslationResult';
import { ModelSelector } from '../components/translation/ModelSelector/ModelSelector';
import { Button } from '../components/ui/Button/Button';
import { Loading } from '../components/ui/Loading/Loading';
import { ErrorDisplay } from '../components/ui/ErrorDisplay/ErrorDisplay';
import { Toast } from '../components/ui/Toast/Toast';
import { HistoryPanel } from '../components/history/HistoryPanel/HistoryPanel';
import { aiTranslatorServiceIPC, TranslatorResponse } from '../services/ai/AITranslatorServiceIPC';
import { writeClipboard } from '../utils/clipboard';
import { OllamaModel } from '../models/OllamaModel';

export const MainPage: React.FC = () => {
  const {
    persianToEnglishInput,
    englishToPersianInput,
    grammarInput,
    results,
    selectedResult,
    isLoading,
    loadingProgress,
    error,
    errorDetails,
    showErrorDetails,
    setPersianToEnglishInput,
    setEnglishToPersianInput,
    setGrammarInput,
    clearInputs,
    setResults,
    setSelectedResult,
    setLoading,
    setLoadingProgress,
    setError,
    toggleErrorDetails,
    setAbortController,
    cancelRequest,
  } = useTranslationStore();

  const {
    selectedModel,
    ollamaUrl,
    temperature,
    fontSize,
  } = useSettingsStore();

  const { addEntry } = useHistoryStore();

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    // Load settings on mount
    useSettingsStore.getState().loadSettings();
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
      }
    };

    // Listen for shortcut events from main process
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.onShortcut(handleShortcut);
    }

    return () => {
      // Cleanup if needed
    };
  }, [setPersianToEnglishInput, setEnglishToPersianInput, setGrammarInput]);

  const handleTranslate = async () => {
    let input = '';
    let translateFn: (
      text: string,
      model: OllamaModel,
      options: any
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
      translateFn = aiTranslatorServiceIPC.correctGrammar.bind(aiTranslatorServiceIPC);
      type = 'grammar';
    } else {
      setError('لطفاً متن را وارد کنید');
      return;
    }

    const abortController = new AbortController();
    setAbortController(abortController);

    try {
      setLoading(true);
      setError(null);

      const response = await translateFn(input, selectedModel, {
        ollamaUrl,
        temperature,
        abortSignal: abortController.signal,
        onProgress: (progress: number) => {
          setLoadingProgress(progress);
        },
      });

      setResults(response.result);
      setSelectedResult(1);

      // Add to history
      addEntry({
        input,
        type,
        model: selectedModel,
        result: response.result,
      });

      setToast({ message: 'ترجمه با موفقیت انجام شد', type: 'success' });
    } catch (error: any) {
      if (error.message === 'Request aborted') {
        setError('درخواست لغو شد');
      } else {
        setError(
          error.message || 'خطا در ترجمه. لطفاً دوباره تلاش کنید.',
          error.stack
        );
      }
      setToast({ message: 'خطا در ترجمه', type: 'error' });
    } finally {
      setLoading(false);
      setAbortController(null);
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
    grammarInput.trim();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl bg-indigo-500 font-bold text-gray-900 dark:text-white text-center">
          مترجم هوش مصنوعی
        </h1>

        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={(model) => useSettingsStore.getState().setSelectedModel(model)}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TranslationInput
            label="فارسی به انگلیسی"
            value={persianToEnglishInput}
            onChange={setPersianToEnglishInput}
            placeholder="متن فارسی را وارد کنید..."
            autoFocus={false}
          />
          <TranslationInput
            label="انگلیسی به فارسی"
            value={englishToPersianInput}
            onChange={setEnglishToPersianInput}
            placeholder="متن انگلیسی را وارد کنید..."
            autoFocus={false}
          />
          <TranslationInput
            label="اصلاح گرامر"
            value={grammarInput}
            onChange={setGrammarInput}
            placeholder="متن انگلیسی برای اصلاح را وارد کنید..."
            autoFocus={false}
          />
        </div>

        <div className="flex gap-2 justify-center flex-wrap">
          <Button
            variant="primary"
            onClick={handleTranslate}
            disabled={!canTranslate || isLoading}
            isLoading={isLoading}
          >
            ترجمه
          </Button>
          <Button variant="secondary" onClick={clearInputs}>
            پاک کردن
          </Button>
          <Button variant="ghost" onClick={() => setShowHistory(!showHistory)}>
            تاریخچه
          </Button>
        </div>

        {isLoading && (
          <Loading
            progress={loadingProgress}
            onCancel={cancelRequest}
          />
        )}

        {error && (
          <ErrorDisplay
            error={error}
            details={errorDetails || undefined}
            showDetails={showErrorDetails}
            onToggleDetails={toggleErrorDetails}
          />
        )}

        {results && !isLoading && (
          <div className="space-y-4">
            <TranslationResult
              result={results}
              selectedIndex={selectedResult}
              onSelect={setSelectedResult}
              onCopy={handleCopy}
              fontSize={fontSize}
            />
          </div>
        )}

        {showHistory && (
          <div className="mt-6">
            <HistoryPanel
              onSelectEntry={(entry) => {
                if (entry.type === 'persian-to-english') {
                  setPersianToEnglishInput(entry.input);
                } else if (entry.type === 'english-to-persian') {
                  setEnglishToPersianInput(entry.input);
                } else if (entry.type === 'grammar') {
                  setGrammarInput(entry.input);
                }
                setResults(entry.result);
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
    </div>
  );
};

