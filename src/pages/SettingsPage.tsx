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
import { ShortcutBuilder } from '../components/ui/ShortcutBuilder/ShortcutBuilder';
import { Switch } from '../components/ui/Switch/Switch';

interface SettingsPageProps {
  onBack?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const { settings, loadSettings } = useSettingsStore();
  const [showOllamaGuide, setShowOllamaGuide] = useState(false);
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

  const handleChange = (field: keyof AppSettings, value: string | number | boolean | AIModel | { width: number; height: number }) => {
    if (!formData) return;
    
    if (field === 'windowSize' && typeof value === 'object' && 'width' in value) {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900 p-6 flex items-center justify-center">
        <div className="backdrop-blur-lg bg-white/10 dark:bg-gray-900/20 rounded-xl p-6 shadow-xl border border-white/20 dark:border-gray-700/30 text-white dark:text-gray-200 animate-fade-in">
          در حال بارگذاری...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-4 animate-fade-in">
        {/* Header */}
        <div className="backdrop-blur-lg bg-white/10 dark:bg-gray-900/20 rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-indigo-100 dark:from-white dark:to-indigo-200 bg-clip-text text-transparent">
                تنظیمات
              </h1>
            </div>
            <button
              onClick={handleBack}
              className="px-6 py-3 rounded-full backdrop-blur-lg bg-white/20 dark:bg-gray-900/30 hover:bg-white/30 dark:hover:bg-gray-900/40 text-white font-semibold shadow-lg border border-white/30 dark:border-gray-700/30 transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              بازگشت
            </button>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="backdrop-blur-lg bg-white/10 dark:bg-gray-900/20 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 space-y-6">
          {/* Info Message */}
          <div className="backdrop-blur-md bg-blue-500/20 dark:bg-blue-900/30 border border-blue-300/30 dark:border-blue-700/30 rounded-xl p-4 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-200 dark:text-blue-300 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-white dark:text-blue-100">
                  تنظیمات از فایل .env خوانده می‌شوند
                </p>
                <p className="text-xs text-blue-100 dark:text-blue-200 mt-1">
                  می‌توانید تنظیمات را در اینجا تغییر دهید و با دکمه ذخیره در فایل .env ذخیره کنید. کلیدهای میانبر به‌صورت خودکار اعمال می‌شوند. برای سایر تنظیمات ممکن است نیاز به راه‌اندازی مجدد باشد.
                </p>
              </div>
            </div>
          </div>

          {/* Model Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="backdrop-blur-md bg-white/5 dark:bg-gray-900/10 rounded-xl p-4 border border-white/10 dark:border-gray-700/20 transition-all duration-300 hover:shadow-lg">
              <label className="block text-sm font-semibold text-white dark:text-gray-200 mb-3">
                مدل هوش مصنوعی
              </label>
              <ModelSelector
                selectedModel={formData.selectedModel}
                onModelChange={(model) => handleChange('selectedModel', model)}
                disabled={false}
              />
            </div>
            <div className="backdrop-blur-md bg-white/5 dark:bg-gray-900/10 rounded-xl p-4 border border-white/10 dark:border-gray-700/20 transition-all duration-300 hover:shadow-lg">
              <label className="block text-sm font-semibold text-white dark:text-gray-200 mb-3">
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
          <div className="backdrop-blur-md bg-white/5 dark:bg-gray-900/10 rounded-xl p-4 border border-white/10 dark:border-gray-700/20 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-white dark:text-gray-200">
                آدرس AI Provider (Ollama)
              </label>
              <button
                onClick={() => setShowOllamaGuide(true)}
                className="text-sm text-blue-200 hover:text-blue-100 dark:text-blue-300 dark:hover:text-blue-200 flex items-center gap-1 transition-colors duration-300 px-3 py-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-gray-800/20"
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
          <div className="border-t border-white/20 dark:border-gray-700/30 pt-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white dark:text-gray-100 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                تنظیمات OpenRouter
              </h2>
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
          <div className="border-t border-white/20 dark:border-gray-700/30 pt-6">
            <h2 className="text-xl font-bold text-white dark:text-gray-100 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              تنظیمات AI
            </h2>

            <div className="space-y-4">
              <div className="backdrop-blur-md bg-white/5 dark:bg-gray-900/10 rounded-xl p-4 border border-white/10 dark:border-gray-700/20">
                <label className="block text-sm font-semibold text-white dark:text-gray-200 mb-3">
                  Temperature: <span className="text-indigo-300 dark:text-purple-300">{formData.temperature}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 dark:accent-purple-500"
                  disabled={false}
                />
                <div className="flex justify-between text-xs text-white/70 dark:text-gray-300 mt-2">
                  <span>0</span>
                  <span>1</span>
                  <span>2</span>
                </div>
              </div>
            </div>
          </div>

          {/* UI Configuration */}
          <div className="border-t border-white/20 dark:border-gray-700/30 pt-6">
            <h2 className="text-xl font-bold text-white dark:text-gray-100 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
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
          <div className="border-t border-white/20 dark:border-gray-700/30 pt-6">
            <h2 className="text-xl font-bold text-white dark:text-gray-100 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              کلیدهای میانبر
            </h2>

            <div className="backdrop-blur-md bg-blue-500/20 dark:bg-blue-900/30 border border-blue-300/30 dark:border-blue-700/30 rounded-xl p-4 mb-4 transition-all duration-300 hover:shadow-lg">
              <p className="text-sm text-blue-100 dark:text-blue-200">
                <strong className="text-white dark:text-blue-100">راهنما:</strong> برای هر کلید میانبر، می‌توانید حداکثر 4 کلید modifier (Alt, Ctrl, Shift, Cmd) و یک کلید اصلی انتخاب کنید.
                <br />
                <strong className="text-white dark:text-blue-100">نکته:</strong> انتخاب modifierها اختیاری است. می‌توانید فقط با یک کلید اصلی یا ترکیب modifier + کلید اصلی، کلید میانبر بسازید.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { key: 'persianToEnglish' as const, label: 'فارسی به انگلیسی' },
                { key: 'englishToPersian' as const, label: 'انگلیسی به فارسی' },
                { key: 'grammar' as const, label: 'اصلاح گرامر' },
                { key: 'responseSuggestions' as const, label: 'جوابش چی میشه؟' },
                { key: 'processMain' as const, label: 'پردازش (مدل اصلی)' },
                { key: 'processFallback' as const, label: 'پردازش (مدل جایگزین)' },
                { key: 'processQuickTranslate' as const, label: 'ترجمه سریع' },
                { key: 'addBookmark' as const, label: 'افزودن به علاقه‌مندی‌ها' },
              ].map(({ key, label }) => (
                <div key={key} className="backdrop-blur-md bg-white/5 dark:bg-gray-900/10 rounded-xl p-4 border border-white/10 dark:border-gray-700/20 transition-all duration-300 hover:shadow-lg">
                  <ShortcutBuilder
                    label={label}
                    value={formData.shortcuts[key]}
                    onChange={(value) => handleShortcutChange(key, value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Translate Configuration */}
          <div className="border-t border-white/20 dark:border-gray-700/30 pt-6">
            <h2 className="text-xl font-bold text-white dark:text-gray-100 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              ترجمه سریع
            </h2>

            <div className="space-y-4">
              <div className="backdrop-blur-md bg-white/5 dark:bg-gray-900/10 rounded-xl p-4 border border-white/10 dark:border-gray-700/20">
                <Switch
                  label="فعال‌سازی ترجمه سریع"
                  checked={formData.quickTranslateEnabled}
                  onChange={(checked: boolean) => handleChange('quickTranslateEnabled', checked)}
                />
              </div>

              <div className="backdrop-blur-md bg-blue-500/20 dark:bg-blue-900/30 border border-blue-300/30 dark:border-blue-700/30 rounded-xl p-4 transition-all duration-300 hover:shadow-lg">
                <p className="text-sm text-blue-100 dark:text-blue-200">
                  <strong className="text-white dark:text-blue-100">راهنما:</strong> با فعال‌سازی این قابلیت، با انتخاب متن انگلیسی در برنامه، یک باکس شیشه‌ای کنار موس نمایش داده می‌شود که متن را به فارسی ترجمه می‌کند.
                </p>
              </div>

              <Input
                label="زمان بسته شدن خودکار (ثانیه)"
                type="number"
                min="0"
                max="60"
                value={formData.quickTranslateTimeout}
                onChange={(e) => handleChange('quickTranslateTimeout', parseInt(e.target.value, 10))}
                placeholder="5"
                disabled={!formData.quickTranslateEnabled}
                helperText="0 = بسته نشدن خودکار"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="border-t border-white/20 dark:border-gray-700/30 pt-6">
            <div className="flex gap-3 justify-end flex-wrap">
              <button
                onClick={handleBack}
                disabled={isSaving}
                className="px-6 py-3 rounded-full backdrop-blur-lg bg-white/20 dark:bg-gray-900/30 hover:bg-white/30 dark:hover:bg-gray-900/40 text-white font-semibold shadow-lg border border-white/30 dark:border-gray-700/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                بازگشت
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    ذخیره تنظیمات
                  </>
                )}
              </button>
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
      </div>
    </div>
  );
};

