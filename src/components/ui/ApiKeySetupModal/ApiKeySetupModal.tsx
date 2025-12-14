import React, { useState, useEffect } from 'react';
import { OpenRouterGuideModal } from '../OpenRouterGuideModal/OpenRouterGuideModal';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { isValidApiKey } from '../../../utils/apiKeyValidation';
import { useSettingsStore } from '../../../stores/settingsStore';
import { AppSettings } from '../../../types/settings';

interface ApiKeySetupModalProps {
  isOpen: boolean;
  onApiKeySaved: () => void;
}

export const ApiKeySetupModal: React.FC<ApiKeySetupModalProps> = ({
  isOpen,
  onApiKeySaved,
}) => {
  const { settings, loadSettings } = useSettingsStore();
  const [apiKey, setApiKey] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load current API key when modal opens
  useEffect(() => {
    if (isOpen && settings) {
      setApiKey(settings.openRouterApiKey1 || '');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, settings]);

  // Prevent ESC key from closing modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape, true);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape, true);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSave = async () => {
    // Validate API key
    if (!isValidApiKey(apiKey)) {
      setError('لطفاً یک API Key معتبر وارد کنید. API Key باید با "sk-or-v1-" شروع شود.');
      return;
    }

    if (!settings || !window.electronAPI) {
      setError('خطا در دسترسی به تنظیمات');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Create updated settings with new API key
      const updatedSettings: AppSettings = {
        ...settings,
        openRouterApiKey1: apiKey.trim(),
      };

      const response = await window.electronAPI.saveSettings(updatedSettings);
      
      if (response.success) {
        setSuccess(true);
        // Reload settings
        await loadSettings();
        // Wait a bit for settings to reload, then check if API key is valid
        setTimeout(() => {
          // Check if API key is now valid
          if (isValidApiKey(apiKey.trim())) {
            onApiKeySaved();
          } else {
            setError('API Key ذخیره شد اما هنوز معتبر نیست. لطفاً دوباره تلاش کنید.');
            setSuccess(false);
          }
        }, 500);
      } else {
        const errorMessage = 'error' in response ? response.error : 'خطا در ذخیره API Key';
        setError(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ذخیره API Key';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-80 dark:bg-opacity-90 backdrop-blur-sm"
        // Prevent closing by clicking outside
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div
          className="w-full max-w-2xl max-h-[90vh] m-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col animate-slideUp overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                تنظیم API Key
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                برای استفاده از برنامه، باید یک API Key معتبر از OpenRouter وارد کنید
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Warning Message */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-6 h-6 text-yellow-600 dark:text-yellow-400 ml-2 flex-shrink-0 mt-0.5"
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
                <div>
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                    توجه: بدون API Key معتبر نمی‌توانید از برنامه استفاده کنید
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                    لطفاً API Key خود را از OpenRouter دریافت کرده و در زیر وارد کنید
                  </p>
                </div>
              </div>
            </div>

            {/* Guide Button */}
            <div>
              <Button
                variant="secondary"
                onClick={() => setShowGuide(true)}
                className="w-full"
              >
                <svg
                  className="w-5 h-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                نمایش راهنمای دریافت API Key از OpenRouter
              </Button>
            </div>

            {/* API Key Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                API Key OpenRouter
                <span className="text-red-500 mr-1">*</span>
              </label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setError(null);
                  setSuccess(false);
                }}
                placeholder="sk-or-v1-..."
                dir="ltr"
                className="font-mono"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                API Key باید با "sk-or-v1-" شروع شود
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-green-800 dark:text-green-200 text-sm">
                  API Key با موفقیت ذخیره شد!
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                بدون API Key معتبر نمی‌توانید از برنامه استفاده کنید
              </p>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isSaving || !apiKey.trim()}
              >
                {isSaving ? 'در حال ذخیره...' : 'ذخیره و ادامه'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* OpenRouter Guide Modal */}
      <OpenRouterGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
      />
    </>
  );
};

