import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { AppSettings } from '../types/settings';
import { Button } from '../components/ui/Button/Button';
import { Input } from '../components/ui/Input/Input';
import { Select } from '../components/ui/Select/Select';
import { ModelSelector } from '../components/translation/ModelSelector/ModelSelector';
import { AIModel, AI_MODELS } from '../models/AIModel';
import { Toast } from '../components/ui/Toast/Toast';
import { OllamaGuideModal } from '../components/ui/OllamaGuideModal/OllamaGuideModal';
import { OpenRouterGuideModal } from '../components/ui/OpenRouterGuideModal/OpenRouterGuideModal';
import { ShortcutBuilder } from '../components/ui/ShortcutBuilder/ShortcutBuilder';

interface SettingsPageProps {
  onBack?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const { settings, loadSettings } = useSettingsStore();
  const [showOllamaGuide, setShowOllamaGuide] = useState(false);
  const [showOpenRouterGuide, setShowOpenRouterGuide] = useState(false);
  const [formData, setFormData] = useState<AppSettings | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  const handleChange = (field: keyof AppSettings, value: string | number | AIModel | { width: number; height: number }) => {
    if (!formData) return;
    
    if (field === 'windowSize' && typeof value === 'object') {
      setFormData({ ...formData, windowSize: value });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleShortcutChange = (shortcutKey: keyof AppSettings['shortcuts'], value: string) => {
    if (!formData) return;
    setFormData({
      ...formData,
      shortcuts: {
        ...formData.shortcuts,
        [shortcutKey]: value,
      },
    });
  };

  const handleSave = async () => {
    if (!formData || !window.electronAPI) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await window.electronAPI.saveSettings(formData);
      if (response.success) {
        setToast({ message: 'تنظیمات با موفقیت ذخیره شد. کلیدهای میانبر به‌صورت خودکار اعمال شدند.', type: 'success' });
        // Reload settings after save
        await loadSettings();
      } else {
        // TypeScript type narrowing: if success is false, it's ErrorResponse
        const error = 'error' in response ? response.error : 'خطا در ذخیره تنظیمات';
        setToast({ message: error, type: 'error' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ذخیره تنظیمات';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!settings || !formData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            تنظیمات
          </h1>
          <Button variant="ghost" onClick={handleBack}>
            بازگشت
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
          {/* Info Message */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  تنظیمات از فایل .env خوانده می‌شوند
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  می‌توانید تنظیمات را در اینجا تغییر دهید و با دکمه ذخیره در فایل .env ذخیره کنید. کلیدهای میانبر به‌صورت خودکار اعمال می‌شوند. برای سایر تنظیمات ممکن است نیاز به راه‌اندازی مجدد باشد.
                </p>
              </div>
            </div>
          </div>

          {/* Model Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                مدل هوش مصنوعی
              </label>
              <ModelSelector
                selectedModel={formData.selectedModel}
                onModelChange={(model) => handleChange('selectedModel', model)}
                disabled={false}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                مدل جایگزین
              </label>
              <ModelSelector
                selectedModel={formData.fallbackSelectedModel}
                onModelChange={(model) => handleChange('fallbackSelectedModel', model)}
                disabled={false}
              />
            </div>
          </div>

          {/* AI Provider URL */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                آدرس AI Provider (Ollama)
              </label>
              <button
                onClick={() => setShowOllamaGuide(true)}
                className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                راهنمای نصب Ollama
              </button>
            </div>
            <Input
              type="text"
              value={formData.aiProviderUrl}
              onChange={(e) => handleChange('aiProviderUrl', e.target.value)}
              placeholder="http://localhost:11434"
              disabled={false}
            />
          </div>

          {/* OpenRouter Configuration */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                تنظیمات OpenRouter
              </h2>
              <button
                onClick={() => setShowOpenRouterGuide(true)}
                className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                راهنمای ساخت API Key
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Base URL"
                type="text"
                value={formData.openRouterBaseUrl}
                onChange={(e) => handleChange('openRouterBaseUrl', e.target.value)}
                placeholder="https://openrouter.ai/api/v1"
                disabled={false}
              />

              <Input
                label="API Key 1"
                type="password"
                value={formData.openRouterApiKey1}
                onChange={(e) => handleChange('openRouterApiKey1', e.target.value)}
                placeholder="sk-or-v1-..."
                disabled={false}
              />

              <Input
                label="API Key 2"
                type="password"
                value={formData.openRouterApiKey2}
                onChange={(e) => handleChange('openRouterApiKey2', e.target.value)}
                placeholder="sk-or-v1-..."
                disabled={false}
              />

              <Input
                label="Referer"
                type="text"
                value={formData.openRouterReferer}
                onChange={(e) => handleChange('openRouterReferer', e.target.value)}
                placeholder="http://localhost:3000"
                disabled={false}
              />

              <Input
                label="Site Name"
                type="text"
                value={formData.openRouterSiteName}
                onChange={(e) => handleChange('openRouterSiteName', e.target.value)}
                placeholder="AI Translator"
                disabled={false}
              />
            </div>
          </div>

          {/* AI Configuration */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              تنظیمات AI
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Temperature: {formData.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                  className="w-full"
                  disabled={false}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>0</span>
                  <span>1</span>
                  <span>2</span>
                </div>
              </div>
            </div>
          </div>

          {/* UI Configuration */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              تنظیمات رابط کاربری
            </h2>

            <div className="space-y-4">
              <Input
                label="اندازه فونت"
                type="number"
                min="10"
                max="24"
                value={formData.fontSize}
                onChange={(e) => handleChange('fontSize', parseInt(e.target.value, 10))}
                disabled={false}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="عرض پنجره"
                  type="number"
                  min="600"
                  value={formData.windowSize.width}
                  onChange={(e) => handleChange('windowSize', { ...formData.windowSize, width: parseInt(e.target.value, 10) })}
                  disabled={false}
                />

                <Input
                  label="ارتفاع پنجره"
                  type="number"
                  min="400"
                  value={formData.windowSize.height}
                  onChange={(e) => handleChange('windowSize', { ...formData.windowSize, height: parseInt(e.target.value, 10) })}
                  disabled={false}
                />
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts Configuration */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              کلیدهای میانبر
            </h2>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>راهنما:</strong> برای هر کلید میانبر، می‌توانید حداکثر 4 کلید modifier (Alt, Ctrl, Shift, Cmd) و یک کلید اصلی انتخاب کنید.
                <br />
                <strong>نکته:</strong> انتخاب modifierها اختیاری است. می‌توانید فقط با یک کلید اصلی یا ترکیب modifier + کلید اصلی، کلید میانبر بسازید.
              </p>
            </div>

            <div className="space-y-6">
              <ShortcutBuilder
                label="فارسی به انگلیسی"
                value={formData.shortcuts.persianToEnglish}
                onChange={(value) => handleShortcutChange('persianToEnglish', value)}
              />

              <ShortcutBuilder
                label="انگلیسی به فارسی"
                value={formData.shortcuts.englishToPersian}
                onChange={(value) => handleShortcutChange('englishToPersian', value)}
              />

              <ShortcutBuilder
                label="اصلاح گرامر"
                value={formData.shortcuts.grammar}
                onChange={(value) => handleShortcutChange('grammar', value)}
              />

              <ShortcutBuilder
                label="جوابش چی میشه؟"
                value={formData.shortcuts.responseSuggestions}
                onChange={(value) => handleShortcutChange('responseSuggestions', value)}
              />

              <ShortcutBuilder
                label="پردازش (مدل اصلی)"
                value={formData.shortcuts.processMain}
                onChange={(value) => handleShortcutChange('processMain', value)}
              />

              <ShortcutBuilder
                label="پردازش (مدل جایگزین)"
                value={formData.shortcuts.processFallback}
                onChange={(value) => handleShortcutChange('processFallback', value)}
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex gap-4 justify-end">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={isSaving}
              >
                بازگشت
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isSaving}
                isLoading={isSaving}
              >
                {isSaving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
              </Button>
            </div>
          </div>

        </div>

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Ollama Guide Modal */}
        <OllamaGuideModal
          isOpen={showOllamaGuide}
          onClose={() => setShowOllamaGuide(false)}
          />

        {/* OpenRouter Guide Modal */}
        <OpenRouterGuideModal
          isOpen={showOpenRouterGuide}
          onClose={() => setShowOpenRouterGuide(false)}
          />
      </div>
    </div>
  );
};

