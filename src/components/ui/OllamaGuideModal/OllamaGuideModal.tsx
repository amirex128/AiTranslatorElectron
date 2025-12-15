import React, { useEffect } from 'react';
import { AIModel, AI_MODELS } from '../../../models/AIModel';

interface OllamaGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Get only Ollama models
const ollamaModels = AI_MODELS.filter((model) => 
  !model.value.includes('openrouter') && !model.value.includes('OPENROUTER')
);

export const OllamaGuideModal: React.FC<OllamaGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const copyToClipboard = async (text: string) => {
    // Use IPC method (Electron's clipboard API) which doesn't require permissions
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        await window.electronAPI.writeClipboard(text);
        // Could show a toast here
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        // Fallback to browser API
        if (navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(text);
          } catch (browserError) {
            console.error('Error copying to clipboard via browser API:', browserError);
          }
        }
      }
    } else if (navigator.clipboard) {
      // Fallback to browser API if IPC is not available
      try {
        await navigator.clipboard.writeText(text);
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] m-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col animate-slideUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              راهنمای نصب و استفاده از Ollama
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              آموزش کامل نصب و دانلود مدل‌های رایگان
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            aria-label="بستن"
          >
            <svg
              className="w-6 h-6"
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Installation */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold ml-2">
                1
              </span>
              نصب Ollama
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                برای استفاده از مدل‌های رایگان Ollama، ابتدا باید Ollama را نصب کنید:
              </p>
              <div className="space-y-2">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white mb-1">ویندوز:</p>
                  <div className="bg-gray-800 dark:bg-gray-950 rounded p-3 flex items-center justify-between group">
                    <code className="text-green-400 text-sm">
                      winget install Ollama.Ollama
                    </code>
                    <button
                      onClick={() => copyToClipboard('winget install Ollama.Ollama')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-white"
                      title="کپی"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white mb-1">یا از وب‌سایت:</p>
                  <a
                    href="https://ollama.com/download"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    https://ollama.com/download
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Step 2: Download Models */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold ml-2">
                2
              </span>
              دانلود مدل‌های رایگان
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                پس از نصب Ollama، می‌توانید مدل‌های زیر را دانلود کنید. هر مدل را با دستور زیر دانلود کنید:
              </p>
              <div className="space-y-3">
                {ollamaModels.map((model) => (
                  <div
                    key={model.key}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {model.label}
                      </h4>
                    </div>
                    <div className="bg-gray-800 dark:bg-gray-950 rounded p-3 flex items-center justify-between group">
                      <code className="text-green-400 text-sm">
                        ollama pull {model.value}
                      </code>
                      <button
                        onClick={() => copyToClipboard(`ollama pull ${model.value}`)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-white"
                        title="کپی"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Step 3: Verify Installation */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold ml-2">
                3
              </span>
              بررسی نصب
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                برای بررسی اینکه Ollama به درستی نصب شده و مدل‌ها دانلود شده‌اند:
              </p>
              <div className="space-y-2">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white mb-1">بررسی مدل‌های دانلود شده:</p>
                  <div className="bg-gray-800 dark:bg-gray-950 rounded p-3 flex items-center justify-between group">
                    <code className="text-green-400 text-sm">
                      ollama list
                    </code>
                    <button
                      onClick={() => copyToClipboard('ollama list')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-white"
                      title="کپی"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white mb-1">بررسی وضعیت Ollama:</p>
                  <div className="bg-gray-800 dark:bg-gray-950 rounded p-3 flex items-center justify-between group">
                    <code className="text-green-400 text-sm">
                      ollama serve
                    </code>
                    <button
                      onClick={() => copyToClipboard('ollama serve')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-white"
                      title="کپی"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tips */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold ml-2">
                💡
              </span>
              نکات مهم
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>پس از نصب Ollama، سرویس به صورت خودکار اجرا می‌شود</li>
                <li>مدل‌ها در اولین استفاده به صورت خودکار دانلود می‌شوند (اما بهتر است از قبل دانلود شوند)</li>
                <li>مدل‌های بزرگتر نیاز به RAM بیشتری دارند</li>
                <li>می‌توانید از چندین مدل به صورت همزمان استفاده کنید</li>
                <li>آدرس پیش‌فرض Ollama: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">http://localhost:11434</code></li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            ESC برای بستن
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            فهمیدم
          </button>
        </div>
      </div>
    </div>
  );
};


